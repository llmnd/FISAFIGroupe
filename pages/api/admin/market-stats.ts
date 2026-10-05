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
type OdooCompany = { id: number; name: string };
type OdooCompanyOrder = OdooMarketOrder & {
  date_order: string;
  partner_id: [number, string] | false;
};
type StatsOrder = {
  id: number;
  reference: string;
  customer: string;
  customerId: string;
  state: MarketOrderState;
  amountTotal: number;
  date: Date;
};

const ORDER_STATES = new Set<MarketOrderState>(["draft", "sent", "sale", "done", "cancel"]);
const ODOO_BATCH_SIZE = 500;
const ODOO_ORDER_LIMIT = 20_000;

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

function isOdooCompanyOrder(value: unknown): value is OdooCompanyOrder {
  if (!isOdooMarketOrder(value) || !("date_order" in value) || !("partner_id" in value)) return false;
  const order = value as Partial<OdooCompanyOrder>;
  return (
    typeof order.date_order === "string" &&
    (order.partner_id === false ||
      (Array.isArray(order.partner_id) &&
        Number.isSafeInteger(order.partner_id[0]) &&
        typeof order.partner_id[1] === "string"))
  );
}

function isOdooCompany(value: unknown): value is OdooCompany {
  if (!value || typeof value !== "object") return false;
  const company = value as Partial<OdooCompany>;
  return Number.isSafeInteger(company.id) && Number(company.id) > 0 && typeof company.name === "string";
}

function getMonthStart(date: Date, offset: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset, 1));
}

function parseOdooDate(value: string): Date | null {
  const date = new Date(`${value.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
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
    const companyId = Number(req.query.companyId);
    if (!Number.isSafeInteger(companyId) || companyId <= 0) {
      return res.status(400).json({ error: "Sélectionnez une société Odoo valide." });
    }

    const companyPayload: unknown = await callOdoo("res.company", "search_read", {
      domain: [["id", "=", companyId]],
      fields: ["id", "name"],
      limit: 2,
    });
    if (
      !Array.isArray(companyPayload) ||
      !companyPayload.every(isOdooCompany) ||
      companyPayload.length > 1 ||
      companyPayload.some((item) => item.id !== companyId)
    ) {
      console.error("[Admin/Odoo] Selected company lookup returned an invalid response.");
      throw new OdooApiError("Odoo a renvoyé une réponse de société invalide.");
    }
    const company = companyPayload[0];
    if (!company) {
      return res.status(403).json({ error: "Cette société n’est pas accessible avec votre compte Odoo." });
    }
    const normalizedCompanyName = company.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const companyType = normalizedCompanyName.includes("market")
      ? "market"
      : normalizedCompanyName.includes("groupe")
        ? "groupe"
        : null;
    if (!companyType) {
      return res.status(422).json({
        error: `La société « ${company.name} » n’est pas identifiée comme FiSAFi Groupe ou FiSAFi Market.`,
      });
    }

    const now = new Date();
    const periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const chartStart = getMonthStart(now, -5);
    const statsOrders: StatsOrder[] = [];

    if (companyType === "market") {
      const quotations = await prisma.marketQuotation.findMany({
        where: { createdAt: { gte: chartStart } },
        select: {
          odooOrderId: true,
          reference: true,
          userId: true,
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
          domain: [["id", "in", ids], ["company_id", "=", companyId]],
          fields: ["id", "name", "state", "amount_total"],
          limit: ids.length,
        });
        if (
          !Array.isArray(payload) ||
          !payload.every(isOdooMarketOrder) ||
          new Set(payload.map((order) => order.id)).size !== payload.length ||
          payload.some((order) => !ids.includes(order.id))
        ) {
          console.error("[Admin/Market] Odoo returned an invalid company-filtered sales-order response.");
          throw new OdooApiError("Odoo a renvoyé des données de commandes Market invalides.");
        }
        for (const order of payload) odooOrdersById.set(order.id, order);
      }

      for (const quotation of quotations) {
        const order = odooOrdersById.get(quotation.odooOrderId);
        if (!order) continue;
        statsOrders.push({
          id: order.id,
          reference: order.name || quotation.reference,
          customer:
            `${quotation.user.firstName ?? ""} ${quotation.user.lastName ?? ""}`.trim() ||
            quotation.user.email,
          customerId: `user:${quotation.userId}`,
          state: order.state,
          amountTotal: order.amount_total,
          date: quotation.createdAt,
        });
      }
    } else {
      const chartStartIso = chartStart.toISOString().replace("T", " ").slice(0, 19);
      const payload: unknown = await callOdoo("sale.order", "search_read", {
        domain: [["company_id", "=", companyId], ["date_order", ">=", chartStartIso]],
        fields: ["id", "name", "state", "amount_total", "date_order", "partner_id"],
        limit: ODOO_ORDER_LIMIT,
        order: "date_order desc, id desc",
      });
      if (
        !Array.isArray(payload) ||
        payload.length >= ODOO_ORDER_LIMIT ||
        !payload.every(isOdooCompanyOrder) ||
        new Set(payload.map((order) => order.id)).size !== payload.length
      ) {
        console.error("[Admin/Groupe] Odoo returned an incomplete or invalid sales-order response.");
        throw new OdooApiError("Odoo a renvoyé des données de commandes Groupe invalides ou incomplètes.");
      }
      for (const order of payload) {
        const date = parseOdooDate(order.date_order);
        if (!date || date < chartStart) continue;
        statsOrders.push({
          id: order.id,
          reference: order.name,
          customer: order.partner_id === false ? "Client Odoo" : order.partner_id[1],
          customerId: order.partner_id === false ? `order:${order.id}` : `partner:${order.partner_id[0]}`,
          state: order.state,
          amountTotal: order.amount_total,
          date,
        });
      }
    }

    const monthly = Array.from({ length: 6 }, (_, index) => {
      const month = getMonthStart(now, index - 5);
      return {
        label: month.toLocaleDateString("fr-FR", { month: "short", timeZone: "UTC" }),
        month: month.getUTCMonth(),
        year: month.getUTCFullYear(),
        orders: 0,
        confirmedRevenue: 0,
      };
    });
    for (const order of statsOrders) {
      const month = monthly.find(
        (entry) => entry.month === order.date.getUTCMonth() && entry.year === order.date.getUTCFullYear(),
      );
      if (month) {
        month.orders += 1;
        if (order.state === "sale" || order.state === "done") month.confirmedRevenue += order.amountTotal;
      }
    }

    const recentPeriod = statsOrders.filter(({ date }) => date >= periodStart);
    const confirmedOrders = recentPeriod.filter(({ state }) => state === "sale" || state === "done");
    const pendingOrders = recentPeriod.filter(({ state }) => state === "draft" || state === "sent").length;
    const confirmedRevenue = confirmedOrders.reduce((total, { amountTotal }) => total + amountTotal, 0);
    const customers = new Set(recentPeriod.map(({ customerId }) => customerId));

    return res.status(200).json({
      company: { id: company.id, name: company.name, type: companyType },
      period: {
        orders: recentPeriod.length,
        confirmedOrders: confirmedOrders.length,
        pendingOrders,
        canceledOrders: recentPeriod.filter(({ state }) => state === "cancel").length,
        confirmedRevenue,
        averageConfirmedOrder: confirmedOrders.length ? confirmedRevenue / confirmedOrders.length : 0,
        conversionRate: recentPeriod.length ? (confirmedOrders.length / recentPeriod.length) * 100 : 0,
        customers: customers.size,
      },
      monthly,
      recentOrders: statsOrders.slice(0, 8).map((order) => ({
        id: order.id,
        reference: order.reference,
        customer: order.customer,
        state: order.state,
        amountTotal: order.amountTotal,
        date: order.date.toISOString(),
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
