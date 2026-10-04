import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/backend/lib/db";
import { authenticateEmployee, EmployeeAuthError, requireAdmin } from "@/lib/employeeAuth";
import { callOdoo, OdooApiError } from "@/lib/marketOdoo";

type MarketOrderState = "draft" | "sent" | "sale" | "done" | "cancel";
type OdooMarketOrder = {
  id: number;
  name: string;
  state: MarketOrderState;
  amount_total: number;
};

const ORDER_STATES = new Set<MarketOrderState>(["draft", "sent", "sale", "done", "cancel"]);
const ODOO_BATCH_SIZE = 500;

function isOdooMarketOrder(value: unknown): value is OdooMarketOrder {
  if (!value || typeof value !== "object") return false;
  const order = value as Partial<OdooMarketOrder>;
  return (
    Number.isSafeInteger(order.id) &&
    typeof order.name === "string" &&
    typeof order.state === "string" &&
    ORDER_STATES.has(order.state as MarketOrderState) &&
    typeof order.amount_total === "number" &&
    Number.isFinite(order.amount_total)
  );
}

function getMonthStart(date: Date, offset: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  try {
    const admin = await authenticateEmployee(req);
    requireAdmin(admin);

    const now = new Date();
    const periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const chartStart = getMonthStart(now, -5);
    const quotations = await prisma.marketQuotation.findMany({
      where: { createdAt: { gte: chartStart } },
      select: {
        odooOrderId: true,
        reference: true,
        userId: true,
        state: true,
        amountTotal: true,
        createdAt: true,
        user: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const batches: number[][] = [];
    for (let index = 0; index < quotations.length; index += ODOO_BATCH_SIZE) {
      batches.push(quotations.slice(index, index + ODOO_BATCH_SIZE).map((quotation) => quotation.odooOrderId));
    }
    const odooOrdersById = new Map<number, OdooMarketOrder>();
    for (const ids of batches) {
      const payload: unknown = await callOdoo("sale.order", "search_read", {
        domain: [["id", "in", ids]],
        fields: ["id", "name", "state", "amount_total"],
        limit: ids.length,
      });
      if (
        !Array.isArray(payload) ||
        !payload.every(isOdooMarketOrder) ||
        payload.length !== ids.length ||
        new Set(payload.map((order) => order.id)).size !== ids.length ||
        payload.some((order) => !ids.includes(order.id))
      ) {
        console.error("[Admin/Market] Odoo returned an incomplete or invalid sales-order response.");
        throw new OdooApiError("Odoo n’a pas renvoyé toutes les commandes Market suivies.");
      }
      for (const order of payload) odooOrdersById.set(order.id, order);
    }

    const monthly = Array.from({ length: 6 }, (_, index) => {
      const month = getMonthStart(now, index - 5);
      return {
        label: month.toLocaleDateString("fr-FR", { month: "short" }),
        month: month.getMonth(),
        year: month.getFullYear(),
        orders: 0,
        confirmedRevenue: 0,
      };
    });
    const liveQuotations = quotations.flatMap((quotation) => {
      const order = odooOrdersById.get(quotation.odooOrderId);
      return order ? [{ quotation, order }] : [];
    });

    for (const { quotation, order } of liveQuotations) {
      const month = monthly.find(
        (entry) =>
          entry.month === quotation.createdAt.getMonth() &&
          entry.year === quotation.createdAt.getFullYear(),
      );
      if (month) {
        month.orders += 1;
        if (order.state === "sale" || order.state === "done") {
          month.confirmedRevenue += order.amount_total;
        }
      }
    }

    const recentPeriod = liveQuotations.filter(({ quotation }) => quotation.createdAt >= periodStart);
    const confirmedOrders = recentPeriod.filter(
      ({ order }) => order.state === "sale" || order.state === "done",
    );
    const pendingOrders = recentPeriod.filter(
      ({ order }) => order.state === "draft" || order.state === "sent",
    ).length;
    const confirmedRevenue = confirmedOrders.reduce((total, { order }) => total + order.amount_total, 0);
    const customers = new Set(recentPeriod.map(({ quotation }) => quotation.userId));

    return res.status(200).json({
      period: {
        orders: recentPeriod.length,
        confirmedOrders: confirmedOrders.length,
        pendingOrders,
        canceledOrders: recentPeriod.filter(({ order }) => order.state === "cancel").length,
        confirmedRevenue,
        averageConfirmedOrder: confirmedOrders.length ? confirmedRevenue / confirmedOrders.length : 0,
        conversionRate: recentPeriod.length ? (confirmedOrders.length / recentPeriod.length) * 100 : 0,
        customers: customers.size,
      },
      monthly,
      recentOrders: liveQuotations.slice(0, 8).map(({ quotation, order }) => ({
        id: order.id,
        reference: order.name || quotation.reference,
        customer:
          `${quotation.user.firstName ?? ""} ${quotation.user.lastName ?? ""}`.trim() ||
          quotation.user.email,
        state: order.state,
        amountTotal: order.amount_total,
        date: quotation.createdAt.toISOString(),
      })),
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    if (error instanceof EmployeeAuthError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error instanceof OdooApiError) {
      console.error("[Admin/Market] Odoo stats request failed:", error);
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("[Admin/Market] Unexpected stats request error:", error);
    return res.status(502).json({ error: "Les statistiques Market sont temporairement indisponibles." });
  }
}
