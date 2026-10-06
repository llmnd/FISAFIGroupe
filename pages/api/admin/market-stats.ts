import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateEmployee, EmployeeAuthError, requireAdmin } from "@/lib/employeeAuth";
import { callOdoo, OdooApiError } from "@/lib/marketOdoo";

type MarketOrderState = "draft" | "sent" | "sale" | "done" | "cancel";
type TransactionState = MarketOrderState;
type OdooRelation = [number, string] | false;
type OdooCompany = { id: number; name: string };
type OdooSaleOrder = {
  id: number;
  name: string;
  state: MarketOrderState;
  amount_total: number;
  date_order: string;
  partner_id: OdooRelation;
  user_id: OdooRelation;
  invoice_status: string;
};
type OdooPOSOrder = {
  id: number;
  name: string;
  state: "draft" | "paid" | "done" | "invoiced" | "cancel";
  amount_total: number;
  date_order: string;
  session_id: OdooRelation;
  config_id: OdooRelation;
  pos_reference: string | false;
  partner_id: OdooRelation;
  user_id: OdooRelation;
  account_move: OdooRelation;
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
type CompanyCursor = { saleOffset: number; posOffset: number };
type Transaction = {
  id: number;
  kind: "sale_order" | "pos_order";
  reference: string;
  session: string | null;
  date: string;
  pointOfSale: string | null;
  receiptNumber: string | null;
  customer: string;
  operator: string | null;
  amountTotal: number;
  state: TransactionState;
  statusLabel: string;
  invoiceStatus: string;
};

const ORDER_STATES = new Set<MarketOrderState>(["draft", "sent", "sale", "done", "cancel"]);
const POS_ORDER_STATES = new Set<OdooPOSOrder["state"]>(["draft", "paid", "done", "invoiced", "cancel"]);
const STATS_FETCH_SIZE = 1_000;
const HISTORY_PAGE_SIZE = 50;
const HISTORY_FETCH_SIZE = HISTORY_PAGE_SIZE + 1;

function isRelation(value: unknown): value is OdooRelation {
  return (
    value === false ||
    (Array.isArray(value) &&
      value.length === 2 &&
      Number.isSafeInteger(value[0]) &&
      typeof value[1] === "string")
  );
}

function isOdooSaleOrder(value: unknown): value is OdooSaleOrder {
  if (!value || typeof value !== "object") return false;
  const order = value as Partial<OdooSaleOrder>;
  return (
    Number.isSafeInteger(order.id) &&
    typeof order.name === "string" &&
    typeof order.state === "string" &&
    ORDER_STATES.has(order.state as MarketOrderState) &&
    typeof order.amount_total === "number" &&
    Number.isFinite(order.amount_total) &&
    typeof order.date_order === "string" &&
    isRelation(order.partner_id) &&
    isRelation(order.user_id) &&
    typeof order.invoice_status === "string"
  );
}

function isOdooPOSOrder(value: unknown): value is OdooPOSOrder {
  if (!value || typeof value !== "object") return false;
  const order = value as Partial<OdooPOSOrder>;
  return (
    Number.isSafeInteger(order.id) &&
    typeof order.name === "string" &&
    typeof order.state === "string" &&
    POS_ORDER_STATES.has(order.state as OdooPOSOrder["state"]) &&
    typeof order.amount_total === "number" &&
    Number.isFinite(order.amount_total) &&
    typeof order.date_order === "string" &&
    isRelation(order.session_id) &&
    isRelation(order.config_id) &&
    (typeof order.pos_reference === "string" || order.pos_reference === false) &&
    isRelation(order.partner_id) &&
    isRelation(order.user_id) &&
    isRelation(order.account_move)
  );
}

function isOdooCompany(value: unknown): value is OdooCompany {
  if (!value || typeof value !== "object") return false;
  const company = value as Partial<OdooCompany>;
  return Number.isSafeInteger(company.id) && Number(company.id) > 0 && typeof company.name === "string";
}

function parseOdooDate(value: string): Date | null {
  const date = new Date(`${value.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getMonthStart(date: Date, offset: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset, 1));
}

function getRelationLabel(relation: OdooRelation): string | null {
  return relation === false ? null : relation[1];
}

function getCustomerLabel(relation: OdooRelation): string {
  return getRelationLabel(relation) ?? "Client FiSAFi";
}

function getCustomerId(relation: OdooRelation, orderId: number): string {
  return relation === false ? `order:${orderId}` : `partner:${relation[0]}`;
}

function isConfirmed(state: MarketOrderState): boolean {
  return state === "sale" || state === "done";
}

function toStatsOrder(order: OdooSaleOrder): StatsOrder {
  const date = parseOdooDate(order.date_order);
  if (!date) throw new OdooApiError("Odoo a renvoyé une date de commande invalide.");
  return {
    id: order.id,
    reference: order.name,
    customer: getCustomerLabel(order.partner_id),
    customerId: getCustomerId(order.partner_id, order.id),
    state: order.state,
    amountTotal: order.amount_total,
    date,
  };
}

function toPOSStatsOrder(order: OdooPOSOrder): StatsOrder {
  const date = parseOdooDate(order.date_order);
  if (!date) throw new OdooApiError("Odoo a renvoyé une date de vente invalide.");
  const state: MarketOrderState =
    order.state === "draft" ? "draft" : order.state === "cancel" ? "cancel" : "done";
  return {
    id: order.id,
    reference: order.name,
    customer: getCustomerLabel(order.partner_id),
    customerId: getCustomerId(order.partner_id, order.id),
    state,
    amountTotal: order.amount_total,
    date,
  };
}

function toSaleTransaction(order: OdooSaleOrder): Transaction {
  const invoiceStatus: Record<string, string> = {
    no: "Non applicable",
    "to invoice": "À facturer",
    invoiced: "Facturée",
    upselling: "Complément à facturer",
  };
  const statusLabel: Record<MarketOrderState, string> = {
    draft: "Brouillon",
    sent: "Devis envoyé",
    sale: "Confirmée",
    done: "Terminée",
    cancel: "Annulée",
  };
  const date = parseOdooDate(order.date_order);
  if (!date) throw new OdooApiError("Odoo a renvoyé une date de commande invalide.");
  return {
    id: order.id,
    kind: "sale_order",
    reference: order.name,
    session: null,
    date: date.toISOString(),
    pointOfSale: null,
    receiptNumber: null,
    customer: getCustomerLabel(order.partner_id),
    operator: getRelationLabel(order.user_id),
    amountTotal: order.amount_total,
    state: order.state,
    statusLabel: statusLabel[order.state],
    invoiceStatus: invoiceStatus[order.invoice_status] ?? order.invoice_status,
  };
}

function toPOSTransaction(order: OdooPOSOrder): Transaction {
  const status: Record<OdooPOSOrder["state"], { state: TransactionState; label: string }> = {
    draft: { state: "draft", label: "Brouillon" },
    paid: { state: "sale", label: "Payée" },
    done: { state: "done", label: "Comptabilisée" },
    invoiced: { state: "done", label: "Comptabilisée" },
    cancel: { state: "cancel", label: "Annulée" },
  };
  const date = parseOdooDate(order.date_order);
  if (!date) throw new OdooApiError("Odoo a renvoyé une date de vente invalide.");
  return {
    id: order.id,
    kind: "pos_order",
    reference: order.name,
    session: getRelationLabel(order.session_id),
    date: date.toISOString(),
    pointOfSale: getRelationLabel(order.config_id),
    receiptNumber: typeof order.pos_reference === "string" && order.pos_reference ? order.pos_reference : null,
    customer: getCustomerLabel(order.partner_id),
    operator: getRelationLabel(order.user_id),
    amountTotal: order.amount_total,
    state: status[order.state].state,
    statusLabel: status[order.state].label,
    invoiceStatus: order.account_move === false ? "À facturer" : "Facturée",
  };
}

function parseOffset(value: string | string[] | undefined): number {
  if (value === undefined) return 0;
  const offset = Number(value);
  if (!Number.isSafeInteger(offset) || offset < 0) {
    throw new OdooApiError("La pagination de l’historique est invalide.", 400);
  }
  return offset;
}

async function fetchRecentOdooRecords<T extends { id: number }>(
  model: "sale.order" | "pos.order",
  companyId: number,
  chartStartIso: string,
  fields: string[],
  isRecord: (value: unknown) => value is T,
): Promise<T[]> {
  const records: T[] = [];
  const seenIds = new Set<number>();
  while (true) {
    const payload: unknown = await callOdoo(model, "search_read", {
      domain: [["company_id", "=", companyId], ["date_order", ">=", chartStartIso]],
      fields,
      limit: STATS_FETCH_SIZE,
      offset: records.length,
      order: "date_order desc, id desc",
    });
    if (!Array.isArray(payload)) {
      throw new OdooApiError(`Odoo a renvoyé une liste de ${model} invalide.`);
    }
    const page: T[] = [];
    for (const value of payload) {
      if (!isRecord(value) || seenIds.has(value.id)) {
        throw new OdooApiError(`Odoo a renvoyé des données de ${model} invalides ou incomplètes.`);
      }
      seenIds.add(value.id);
      page.push(value);
    }
    records.push(...page);
    if (page.length < STATS_FETCH_SIZE) return records;
  }
}

async function fetchHistoryPage(
  companyId: number,
  cursor: CompanyCursor,
): Promise<{ transactions: Transaction[]; hasMore: boolean; nextCursor: CompanyCursor | null }> {
  const salePayload: unknown = await callOdoo("sale.order", "search_read", {
    domain: [["company_id", "=", companyId]],
    fields: ["id", "name", "state", "amount_total", "date_order", "partner_id", "user_id", "invoice_status"],
    limit: HISTORY_FETCH_SIZE,
    offset: cursor.saleOffset,
    order: "date_order desc, id desc",
  });
  const posPayload: unknown = await callOdoo("pos.order", "search_read", {
    domain: [["company_id", "=", companyId]],
    fields: [
      "id",
      "name",
      "state",
      "amount_total",
      "date_order",
      "session_id",
      "config_id",
      "pos_reference",
      "partner_id",
      "user_id",
      "account_move",
    ],
    limit: HISTORY_FETCH_SIZE,
    offset: cursor.posOffset,
    order: "date_order desc, id desc",
  });
  if (
    !Array.isArray(salePayload) ||
    !salePayload.every(isOdooSaleOrder) ||
    new Set(salePayload.map((order) => order.id)).size !== salePayload.length ||
    !Array.isArray(posPayload) ||
    !posPayload.every(isOdooPOSOrder) ||
    new Set(posPayload.map((order) => order.id)).size !== posPayload.length
  ) {
    console.error("[Admin/Market] Odoo returned invalid data for the company transaction history.");
    throw new OdooApiError("Odoo a renvoyé des données de ventes ou commandes invalides.");
  }

  const saleTransactions = salePayload.map(toSaleTransaction);
  const posTransactions = posPayload.map(toPOSTransaction);
  const merged = [...saleTransactions, ...posTransactions].sort((first, second) => {
    const dateDifference = Date.parse(second.date) - Date.parse(first.date);
    if (dateDifference !== 0) return dateDifference;
    if (first.kind !== second.kind) return first.kind === "pos_order" ? -1 : 1;
    return second.id - first.id;
  });
  const page = merged.slice(0, HISTORY_PAGE_SIZE);
  const saleCount = page.filter((transaction) => transaction.kind === "sale_order").length;
  const posCount = page.length - saleCount;
  const hasMore = salePayload.length > saleCount || posPayload.length > posCount;
  return {
    transactions: page,
    hasMore,
    nextCursor: hasMore
      ? { saleOffset: cursor.saleOffset + saleCount, posOffset: cursor.posOffset + posCount }
      : null,
  };
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
      return res.status(400).json({ error: "Sélectionnez une société FiSAFi valide." });
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
      return res.status(403).json({ error: "Cette société n’est pas accessible avec votre compte." });
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

    const saleOffset = parseOffset(req.query.saleOffset);
    const posOffset = parseOffset(req.query.posOffset);
    const cursor = { saleOffset, posOffset };
    const now = new Date();
    const periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const chartStart = getMonthStart(now, -5);
    const chartStartIso = chartStart.toISOString().replace("T", " ").slice(0, 19);
    const salePayload = await fetchRecentOdooRecords(
      "sale.order",
      companyId,
      chartStartIso,
      ["id", "name", "state", "amount_total", "date_order", "partner_id", "user_id", "invoice_status"],
      isOdooSaleOrder,
    );
    const posPayload = await fetchRecentOdooRecords(
      "pos.order",
      companyId,
      chartStartIso,
      [
        "id",
        "name",
        "state",
        "amount_total",
        "date_order",
        "session_id",
        "config_id",
        "pos_reference",
        "partner_id",
        "user_id",
        "account_move",
      ],
      isOdooPOSOrder,
    );
    const history = await fetchHistoryPage(companyId, cursor);
    if (
      new Set(salePayload.map((order) => order.id)).size !== salePayload.length ||
      new Set(posPayload.map((order) => order.id)).size !== posPayload.length
    ) {
      console.error("[Admin/Market] Odoo returned invalid or incomplete company-filtered sales data.");
      throw new OdooApiError("Odoo a renvoyé des données de ventes ou commandes invalides ou incomplètes.");
    }

    const statsOrders = [
      ...salePayload.map(toStatsOrder),
      ...posPayload.map(toPOSStatsOrder),
    ].filter((order) => order.date <= now);
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
        if (isConfirmed(order.state)) month.confirmedRevenue += order.amountTotal;
      }
    }

    const recentPeriod = statsOrders.filter(({ date }) => date >= periodStart);
    const confirmedOrders = recentPeriod.filter(({ state }) => isConfirmed(state));
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
      transactions: history.transactions,
      hasMore: history.hasMore,
      nextCursor: history.nextCursor,
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    if (error instanceof EmployeeAuthError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error instanceof OdooApiError) {
      console.error("[Admin/Market] Odoo stats request failed:", error);
      if (error.statusCode === 429) {
        res.setHeader("Retry-After", "5");
        return res.status(429).json({
          error: "Odoo limite temporairement les consultations. Réessayez dans quelques secondes.",
        });
      }
      return res.status(error.statusCode).json({ error: "Les données de ventes FiSAFi sont temporairement indisponibles." });
    }
    console.error("[Admin/Market] Unexpected stats request error:", error);
    return res.status(502).json({ error: "Les statistiques FiSAFi sont temporairement indisponibles." });
  }
}
