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
  order_line?: number[];
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
  lines?: number[];
};
type StatsOrder = {
  id: number;
  kind: "sale_order" | "pos_order";
  reference: string;
  customer: string;
  customerId: string;
  state: MarketOrderState;
  amountTotal: number;
  date: Date;
  operator: string | null;
  pointOfSale: string | null;
  lineIds: number[];
};
type PeriodKey = "7d" | "30d" | "90d" | "12m" | "custom";
type AnalyticsPeriod = {
  key: PeriodKey;
  start: Date;
  endExclusive: Date;
  previousStart: Date;
  dayCount: number;
};
type OdooSaleOrderLine = {
  id: number;
  order_id: OdooRelation;
  product_id: OdooRelation;
  product_uom_qty: number;
  price_total: number;
};
type OdooPOSOrderLine = {
  id: number;
  order_id: OdooRelation;
  product_id: OdooRelation;
  qty: number;
  price_subtotal_incl: number;
};
type OdooProductCategory = { id: number; categ_id: OdooRelation };
type Breakdown = {
  id: string;
  label: string;
  orders: number;
  confirmedOrders: number;
  revenue: number;
  previousOrders: number;
  previousConfirmedOrders: number;
  previousRevenue: number;
  quantity?: number;
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
const MAX_ANALYTICS_DAYS = 366;
const MAX_BREAKDOWN_LINES = 50_000;
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

function isIdArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((id) => Number.isSafeInteger(id) && Number(id) > 0);
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
    typeof order.invoice_status === "string" &&
    (order.order_line === undefined || isIdArray(order.order_line))
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
    isRelation(order.account_move) &&
    (order.lines === undefined || isIdArray(order.lines))
  );
}

function isOdooCompany(value: unknown): value is OdooCompany {
  if (!value || typeof value !== "object") return false;
  const company = value as Partial<OdooCompany>;
  return Number.isSafeInteger(company.id) && Number(company.id) > 0 && typeof company.name === "string";
}

function isOdooSaleOrderLine(value: unknown): value is OdooSaleOrderLine {
  if (!value || typeof value !== "object") return false;
  const line = value as Partial<OdooSaleOrderLine>;
  return Number.isSafeInteger(line.id) &&
    isRelation(line.order_id) &&
    isRelation(line.product_id) &&
    typeof line.product_uom_qty === "number" &&
    Number.isFinite(line.product_uom_qty) &&
    typeof line.price_total === "number" &&
    Number.isFinite(line.price_total);
}

function isOdooPOSOrderLine(value: unknown): value is OdooPOSOrderLine {
  if (!value || typeof value !== "object") return false;
  const line = value as Partial<OdooPOSOrderLine>;
  return Number.isSafeInteger(line.id) &&
    isRelation(line.order_id) &&
    isRelation(line.product_id) &&
    typeof line.qty === "number" &&
    Number.isFinite(line.qty) &&
    typeof line.price_subtotal_incl === "number" &&
    Number.isFinite(line.price_subtotal_incl);
}

function isOdooProductCategory(value: unknown): value is OdooProductCategory {
  if (!value || typeof value !== "object") return false;
  const product = value as Partial<OdooProductCategory>;
  return Number.isSafeInteger(product.id) && isRelation(product.categ_id);
}

function parseOdooDate(value: string): Date | null {
  const date = new Date(`${value.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getMonthStart(date: Date, offset: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset, 1));
}

function getQueryString(value: string | string[] | undefined): string | null {
  return typeof value === "string" ? value : null;
}

function parseDateOnly(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? date
    : null;
}

function getAnalyticsPeriod(
  query: NextApiRequest["query"],
  now: Date,
): AnalyticsPeriod {
  const rawKey = getQueryString(query.period);
  if (
    rawKey !== null &&
    rawKey !== "7d" &&
    rawKey !== "30d" &&
    rawKey !== "90d" &&
    rawKey !== "12m" &&
    rawKey !== "custom"
  ) {
    throw new OdooApiError("La période d’analyse sélectionnée est invalide.", 400);
  }
  const key: PeriodKey =
    rawKey === "7d" || rawKey === "30d" || rawKey === "90d" ||
    rawKey === "12m" || rawKey === "custom"
      ? rawKey
      : "30d";
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const endExclusive = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  let start: Date;
  let dayCount: number;

  if (key === "custom") {
    const from = parseDateOnly(getQueryString(query.from));
    const to = parseDateOnly(getQueryString(query.to));
    if (!from || !to || to < from || to > todayStart) {
      throw new OdooApiError("Choisissez une période personnalisée valide, jusqu’à aujourd’hui.", 400);
    }
    start = from;
    dayCount = Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    if (dayCount > MAX_ANALYTICS_DAYS) {
      throw new OdooApiError("La période personnalisée ne peut pas dépasser 366 jours.", 400);
    }
    return {
      key,
      start,
      endExclusive: new Date(to.getTime() + 24 * 60 * 60 * 1000),
      previousStart: new Date(from.getTime() - dayCount * 24 * 60 * 60 * 1000),
      dayCount,
    };
  }

  if (key === "12m") {
    start = getMonthStart(now, -11);
    dayCount = Math.floor((endExclusive.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  } else {
    dayCount = key === "7d" ? 7 : key === "90d" ? 90 : 30;
    start = new Date(endExclusive.getTime() - dayCount * 24 * 60 * 60 * 1000);
  }
  return {
    key,
    start,
    endExclusive,
    previousStart: new Date(start.getTime() - dayCount * 24 * 60 * 60 * 1000),
    dayCount,
  };
}

function toOdooDateTime(date: Date): string {
  return date.toISOString().replace("T", " ").slice(0, 19);
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
  if (!date) throw new OdooApiError("FiSAFi a renvoyé une date de commande invalide.");
  return {
    id: order.id,
    kind: "sale_order",
    reference: order.name,
    customer: getCustomerLabel(order.partner_id),
    customerId: getCustomerId(order.partner_id, order.id),
    state: order.state,
    amountTotal: order.amount_total,
    date,
    operator: getRelationLabel(order.user_id),
    pointOfSale: null,
    lineIds: order.order_line ?? [],
  };
}

function toPOSStatsOrder(order: OdooPOSOrder): StatsOrder {
  const date = parseOdooDate(order.date_order);
  if (!date) throw new OdooApiError("FiSAFi a renvoyé une date de vente invalide.");
  const state: MarketOrderState =
    order.state === "draft" ? "draft" : order.state === "cancel" ? "cancel" : "done";
  return {
    id: order.id,
    kind: "pos_order",
    reference: order.name,
    customer: getCustomerLabel(order.partner_id),
    customerId: getCustomerId(order.partner_id, order.id),
    state,
    amountTotal: order.amount_total,
    date,
    operator: getRelationLabel(order.user_id),
    pointOfSale: getRelationLabel(order.config_id),
    lineIds: order.lines ?? [],
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
  if (!date) throw new OdooApiError("FiSAFi a renvoyé une date de commande invalide.");
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
  if (!date) throw new OdooApiError("FiSAFi a renvoyé une date de vente invalide.");
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
      throw new OdooApiError(`FiSAFi a renvoyé une liste de ${model} invalide.`);
    }
    const page: T[] = [];
    for (const value of payload) {
      if (!isRecord(value) || seenIds.has(value.id)) {
        throw new OdooApiError(`FiSAFi a renvoyé des données de ${model} invalides ou incomplètes.`);
      }
      seenIds.add(value.id);
      page.push(value);
    }
    records.push(...page);
    if (page.length < STATS_FETCH_SIZE) return records;
  }
}

async function fetchLinesById<T extends { id: number; order_id: OdooRelation }>(
  model: "sale.order.line" | "pos.order.line",
  ids: number[],
  orderIds: Set<number>,
  fields: string[],
  isLine: (value: unknown) => value is T,
): Promise<T[]> {
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length > MAX_BREAKDOWN_LINES) {
    throw new OdooApiError(
      "La période contient trop de lignes détaillées pour produire une analyse fiable. Réduisez la période.",
      422,
    );
  }
  const records: T[] = [];
  const seen = new Set<number>();
  for (let offset = 0; offset < uniqueIds.length; offset += STATS_FETCH_SIZE) {
    const batch = uniqueIds.slice(offset, offset + STATS_FETCH_SIZE);
    const payload: unknown = await callOdoo(model, "search_read", {
      domain: [["id", "in", batch]],
      fields,
      limit: batch.length,
      order: "id asc",
    });
    if (
      !Array.isArray(payload) ||
      payload.length !== batch.length ||
      !payload.every(isLine) ||
      payload.some((line) =>
        seen.has(line.id) ||
        line.order_id === false ||
        !orderIds.has(line.order_id[0]),
      )
    ) {
      console.error(`[Admin/Market] Odoo returned incomplete or unexpected ${model} detail.`);
      throw new OdooApiError("FiSAFi a renvoyé des lignes de vente incomplètes pour l’analyse.");
    }
    for (const line of payload) {
      seen.add(line.id);
      records.push(line);
    }
  }
  return records;
}

function createBreakdownEntry(id: string, label: string): Breakdown {
  return {
    id,
    label,
    orders: 0,
    confirmedOrders: 0,
    revenue: 0,
    previousOrders: 0,
    previousConfirmedOrders: 0,
    previousRevenue: 0,
  };
}

function aggregateOrderBreakdowns(
  orders: StatsOrder[],
  dimension: (order: StatsOrder) => { id: string; label: string },
  start: Date,
): Breakdown[] {
  const entries = new Map<string, Breakdown>();
  const currentOrderSets = new Map<string, Set<string>>();
  const previousOrderSets = new Map<string, Set<string>>();

  for (const order of orders) {
    const { id, label } = dimension(order);
    const entry = entries.get(id) ?? createBreakdownEntry(id, label);
    entries.set(id, entry);
    const current = order.date >= start;
    const orderKey = `${order.kind}:${order.id}`;
    const sets = current ? currentOrderSets : previousOrderSets;
    const orderSet = sets.get(id) ?? new Set<string>();
    orderSet.add(orderKey);
    sets.set(id, orderSet);
    if (isConfirmed(order.state)) {
      if (current) {
        entry.confirmedOrders += 1;
        entry.revenue += order.amountTotal;
      } else {
        entry.previousConfirmedOrders += 1;
        entry.previousRevenue += order.amountTotal;
      }
    }
  }

  for (const [id, entry] of entries) {
    entry.orders = currentOrderSets.get(id)?.size ?? 0;
    entry.previousOrders = previousOrderSets.get(id)?.size ?? 0;
  }
  return [...entries.values()].sort(
    (first, second) => second.revenue - first.revenue || first.label.localeCompare(second.label, "fr"),
  ).slice(0, 10);
}

async function aggregateProductBreakdowns(
  orders: StatsOrder[],
  start: Date,
): Promise<{ products: Breakdown[]; categories: Breakdown[] }> {
  const confirmedOrders = orders.filter(
    (order) => isConfirmed(order.state) && order.lineIds.length > 0,
  );
  const saleOrders = confirmedOrders.filter((order) => order.kind === "sale_order");
  const posOrders = confirmedOrders.filter((order) => order.kind === "pos_order");
  const [saleLines, posLines] = await Promise.all([
    fetchLinesById(
      "sale.order.line",
      saleOrders.flatMap((order) => order.lineIds),
      new Set(saleOrders.map((order) => order.id)),
      ["id", "order_id", "product_id", "product_uom_qty", "price_total"],
      isOdooSaleOrderLine,
    ),
    fetchLinesById(
      "pos.order.line",
      posOrders.flatMap((order) => order.lineIds),
      new Set(posOrders.map((order) => order.id)),
      ["id", "order_id", "product_id", "qty", "price_subtotal_incl"],
      isOdooPOSOrderLine,
    ),
  ]);
  const ordersByKey = new Map(
    confirmedOrders.map((order) => [`${order.kind}:${order.id}`, order]),
  );
  const productDetails = new Map<number, { label: string; categoryId: string; categoryName: string }>();
  const productOrderIds = new Map<string, Set<string>>();
  const productEntries = new Map<string, Breakdown>();

  const addLine = (
    line: { order_id: OdooRelation; product_id: OdooRelation; quantity: number; revenue: number },
    kind: StatsOrder["kind"],
  ) => {
    if (line.order_id === false || line.product_id === false) return;
    const order = ordersByKey.get(`${kind}:${line.order_id[0]}`);
    if (!order) return;
    const productId = line.product_id[0];
    const productLabel = line.product_id[1];
    const details = productDetails.get(productId) ?? {
      label: productLabel,
      categoryId: "uncategorized",
      categoryName: "Catégorie non renseignée",
    };
    productDetails.set(productId, details);
    const current = order.date >= start;
    const orderKey = `${order.kind}:${order.id}`;

    const productEntry = productEntries.get(String(productId)) ??
      createBreakdownEntry(String(productId), details.label);
    productEntries.set(String(productId), productEntry);
    const productOrders = productOrderIds.get(String(productId)) ?? new Set<string>();
    productOrders.add(`${current ? "current" : "previous"}:${orderKey}`);
    productOrderIds.set(String(productId), productOrders);
    if (current) {
      productEntry.confirmedOrders += 1;
      productEntry.revenue += line.revenue;
      productEntry.quantity = (productEntry.quantity ?? 0) + line.quantity;
    } else {
      productEntry.previousConfirmedOrders += 1;
      productEntry.previousRevenue += line.revenue;
    }

  };

  for (const line of saleLines) {
    addLine({
      order_id: line.order_id,
      product_id: line.product_id,
      quantity: line.product_uom_qty,
      revenue: line.price_total,
    }, "sale_order");
  }
  for (const line of posLines) {
    addLine({
      order_id: line.order_id,
      product_id: line.product_id,
      quantity: line.qty,
      revenue: line.price_subtotal_incl,
    }, "pos_order");
  }

  const productIds = [...productDetails.keys()];
  for (let offset = 0; offset < productIds.length; offset += STATS_FETCH_SIZE) {
    const batch = productIds.slice(offset, offset + STATS_FETCH_SIZE);
    const payload: unknown = await callOdoo("product.product", "search_read", {
      domain: [["id", "in", batch]],
      fields: ["id", "categ_id"],
      limit: batch.length,
    });
    if (!Array.isArray(payload) || !payload.every(isOdooProductCategory)) {
      console.error("[Admin/Market] Odoo returned invalid product categories for the sales analysis.");
      throw new OdooApiError("FiSAFi a renvoyé des catégories de produits invalides.");
    }
    for (const product of payload) {
      const details = productDetails.get(product.id);
      if (!details) continue;
      details.categoryId = product.categ_id === false ? "uncategorized" : String(product.categ_id[0]);
      details.categoryName = product.categ_id === false ? "Catégorie non renseignée" : product.categ_id[1];
    }
  }

  const categoryEntries = new Map<string, Breakdown>();
  const categoryOrderIds = new Map<string, Set<string>>();
  for (const [productId, entry] of productEntries) {
    const details = productDetails.get(Number(productId));
    if (!details) continue;
    const orderIds = productOrderIds.get(productId) ?? new Set<string>();
    entry.orders = [...orderIds].filter((id) => id.startsWith("current:")).length;
    entry.confirmedOrders = entry.orders;
    entry.previousOrders = [...orderIds].filter((id) => id.startsWith("previous:")).length;
    entry.previousConfirmedOrders = entry.previousOrders;
    const categoryEntry = categoryEntries.get(details.categoryId) ??
      createBreakdownEntry(details.categoryId, details.categoryName);
    categoryEntries.set(details.categoryId, categoryEntry);
    categoryEntry.revenue += entry.revenue;
    categoryEntry.previousRevenue += entry.previousRevenue;
    categoryEntry.quantity = (categoryEntry.quantity ?? 0) + (entry.quantity ?? 0);
    const categoryOrders = categoryOrderIds.get(details.categoryId) ?? new Set<string>();
    for (const orderId of orderIds) categoryOrders.add(orderId);
    categoryOrderIds.set(details.categoryId, categoryOrders);
  }
  for (const [categoryId, entry] of categoryEntries) {
    const orderIds = categoryOrderIds.get(categoryId) ?? new Set<string>();
    entry.orders = [...orderIds].filter((id) => id.startsWith("current:")).length;
    entry.confirmedOrders = entry.orders;
    entry.previousOrders = [...orderIds].filter((id) => id.startsWith("previous:")).length;
    entry.previousConfirmedOrders = entry.previousOrders;
  }

  const products = [...productEntries.values()].sort(
    (first, second) => second.revenue - first.revenue,
  ).slice(0, 10);
  const categories = [...categoryEntries.values()].sort(
    (first, second) => second.revenue - first.revenue,
  ).slice(0, 10);
  return { products, categories };
}

async function fetchHistoryPage(
  companyId: number,
  cursor: CompanyCursor,
  date?: Date,
): Promise<{ transactions: Transaction[]; hasMore: boolean; nextCursor: CompanyCursor | null }> {
  const dateDomain = date
    ? [
        ["date_order", ">=", toOdooDateTime(date)],
        ["date_order", "<", toOdooDateTime(new Date(date.getTime() + 24 * 60 * 60 * 1000))],
      ]
    : [];
  const salePayload: unknown = await callOdoo("sale.order", "search_read", {
    domain: [["company_id", "=", companyId], ...dateDomain],
    fields: ["id", "name", "state", "amount_total", "date_order", "partner_id", "user_id", "invoice_status"],
    limit: HISTORY_FETCH_SIZE,
    offset: cursor.saleOffset,
    order: "date_order desc, id desc",
  });
  const posPayload: unknown = await callOdoo("pos.order", "search_read", {
    domain: [["company_id", "=", companyId], ...dateDomain],
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
    throw new OdooApiError("FiSAFi a renvoyé des données de ventes ou commandes invalides.");
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
      throw new OdooApiError("FiSAFi a renvoyé une réponse de société invalide.");
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
    const analyticsPeriod = getAnalyticsPeriod(req.query, now);
    const { start: periodStart, endExclusive: periodEnd, previousStart: previousPeriodStart } = analyticsPeriod;
    const rawSelectedDate = getQueryString(req.query.date);
    if (req.query.date !== undefined && rawSelectedDate === null) {
      throw new OdooApiError("La date de transaction sélectionnée est invalide.", 400);
    }
    const selectedDate = parseDateOnly(rawSelectedDate);
    if (
      rawSelectedDate !== null &&
      (!selectedDate || selectedDate < periodStart || selectedDate >= periodEnd)
    ) {
      throw new OdooApiError("La date choisie doit être comprise dans la période d’analyse.", 400);
    }
    const chartStart = new Date(Math.min(
      previousPeriodStart.getTime(),
      getMonthStart(now, -11).getTime(),
    ));
    const chartStartIso = toOdooDateTime(chartStart);
    const salePayload = await fetchRecentOdooRecords(
      "sale.order",
      companyId,
      chartStartIso,
      ["id", "name", "state", "amount_total", "date_order", "partner_id", "user_id", "invoice_status", "order_line"],
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
        "lines",
      ],
      isOdooPOSOrder,
    );
    const history = await fetchHistoryPage(companyId, cursor, selectedDate ?? undefined);
    if (
      new Set(salePayload.map((order) => order.id)).size !== salePayload.length ||
      new Set(posPayload.map((order) => order.id)).size !== posPayload.length
    ) {
      console.error("[Admin/Market] Odoo returned invalid or incomplete company-filtered sales data.");
      throw new OdooApiError("FiSAFi a renvoyé des données de ventes ou commandes invalides ou incomplètes.");
    }

    const statsOrders = [
      ...salePayload.map(toStatsOrder),
      ...posPayload.map(toPOSStatsOrder),
    ].filter((order) => order.date < periodEnd);
    const monthly = Array.from({ length: 12 }, (_, index) => {
      const month = getMonthStart(now, index - 11);
      return {
        label: month.toLocaleDateString("fr-FR", { month: "short", timeZone: "UTC" }),
        month: month.getUTCMonth(),
        year: month.getUTCFullYear(),
        orders: 0,
        confirmedOrders: 0,
        confirmedRevenue: 0,
      };
    });
    for (const order of statsOrders) {
      const month = monthly.find(
        (entry) => entry.month === order.date.getUTCMonth() && entry.year === order.date.getUTCFullYear(),
      );
      if (month) {
        month.orders += 1;
        if (isConfirmed(order.state)) {
          month.confirmedOrders += 1;
          month.confirmedRevenue += order.amountTotal;
        }
      }
    }

    const recentPeriod = statsOrders.filter(({ date }) => date >= periodStart);
    const previousPeriod = statsOrders.filter(
      ({ date }) => date >= previousPeriodStart && date < periodStart,
    );
    const confirmedOrders = recentPeriod.filter(({ state }) => isConfirmed(state));
    const previousConfirmedOrders = previousPeriod.filter(({ state }) => isConfirmed(state));
    const pendingOrders = recentPeriod.filter(({ state }) => state === "draft" || state === "sent").length;
    const previousPendingOrders = previousPeriod.filter(
      ({ state }) => state === "draft" || state === "sent",
    ).length;
    const previousCanceledOrders = previousPeriod.filter(({ state }) => state === "cancel").length;
    const confirmedRevenue = confirmedOrders.reduce((total, { amountTotal }) => total + amountTotal, 0);
    const previousConfirmedRevenue = previousConfirmedOrders.reduce(
      (total, { amountTotal }) => total + amountTotal,
      0,
    );
    const customers = new Set(recentPeriod.map(({ customerId }) => customerId));
    const previousCustomers = new Set(previousPeriod.map(({ customerId }) => customerId));
    const dailyStart = new Date(periodStart);
    const previousStart = new Date(previousPeriodStart);
    const daily = Array.from({ length: analyticsPeriod.dayCount }, (_, index) => {
      const date = new Date(dailyStart.getTime() + index * 24 * 60 * 60 * 1000);
      return {
        label: date.toLocaleDateString("fr-FR", { day: "2-digit", timeZone: "UTC" }),
        detailLabel: date.toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          timeZone: "UTC",
        }),
        date: date.toISOString().slice(0, 10),
        orders: 0,
        confirmedOrders: 0,
        confirmedRevenue: 0,
        previousOrders: 0,
        previousConfirmedOrders: 0,
        previousConfirmedRevenue: 0,
      };
    });
    const dailyIndexByDate = new Map<string, { index: number; previous: boolean }>();
    for (let index = 0; index < daily.length; index += 1) {
      dailyIndexByDate.set(daily[index].date, { index, previous: false });
      const previousDate = new Date(previousStart.getTime() + index * 24 * 60 * 60 * 1000);
      dailyIndexByDate.set(previousDate.toISOString().slice(0, 10), { index, previous: true });
    }
    for (const order of statsOrders) {
      const key = order.date.toISOString().slice(0, 10);
      const bucket = dailyIndexByDate.get(key);
      if (!bucket) continue;
      const point = daily[bucket.index];
      const confirmed = isConfirmed(order.state);
      if (bucket.previous) {
        point.previousOrders += 1;
        if (confirmed) {
          point.previousConfirmedOrders += 1;
          point.previousConfirmedRevenue += order.amountTotal;
        }
      } else {
        point.orders += 1;
        if (confirmed) {
          point.confirmedOrders += 1;
          point.confirmedRevenue += order.amountTotal;
        }
      }
    }
    const analyzedOrders = statsOrders.filter(
      (order) => order.date >= previousPeriodStart && order.date < periodEnd,
    );
    const { products, categories } = await aggregateProductBreakdowns(analyzedOrders, periodStart);
    const weekdays = aggregateOrderBreakdowns(
      analyzedOrders,
      (order) => {
        const day = order.date.getUTCDay();
        return {
          id: String(day),
          label: new Date(Date.UTC(2024, 0, 7 + day)).toLocaleDateString("fr-FR", {
            weekday: "long",
            timeZone: "UTC",
          }),
        };
      },
      periodStart,
    ).sort((first, second) => Number(first.id) - Number(second.id));
    const pointsOfSale = aggregateOrderBreakdowns(
      analyzedOrders,
      (order) => ({
        id: order.kind === "pos_order" ? `pos:${order.pointOfSale ?? "unknown"}` : "orders",
        label: order.kind === "pos_order"
          ? order.pointOfSale ?? "Point de vente non renseigné"
          : "Devis et commandes",
      }),
      periodStart,
    );
    const sellers = aggregateOrderBreakdowns(
      analyzedOrders,
      (order) => ({
        id: order.operator ?? "unknown",
        label: order.operator ?? "Utilisateur non renseigné",
      }),
      periodStart,
    );

    return res.status(200).json({
      company: { id: company.id, name: company.name, type: companyType },
      range: {
        key: analyticsPeriod.key,
        from: periodStart.toISOString().slice(0, 10),
        to: new Date(periodEnd.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        comparisonFrom: previousPeriodStart.toISOString().slice(0, 10),
        comparisonTo: new Date(periodStart.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        currentDayIncomplete: periodStart <= now && periodEnd > now,
      },
      period: {
        orders: recentPeriod.length,
        confirmedOrders: confirmedOrders.length,
        pendingOrders,
        canceledOrders: recentPeriod.filter(({ state }) => state === "cancel").length,
        confirmedRevenue,
        previousOrders: previousPeriod.length,
        previousConfirmedOrders: previousConfirmedOrders.length,
        previousConfirmedRevenue,
        previousPendingOrders,
        previousCanceledOrders,
        previousCustomers: previousCustomers.size,
        previousAverageConfirmedOrder: previousConfirmedOrders.length
          ? previousConfirmedRevenue / previousConfirmedOrders.length
          : 0,
        averageConfirmedOrder: confirmedOrders.length ? confirmedRevenue / confirmedOrders.length : 0,
        conversionRate: recentPeriod.length ? (confirmedOrders.length / recentPeriod.length) * 100 : 0,
        customers: customers.size,
      },
      quality: {
        periodTransactions: recentPeriod.length,
        transactionsWithoutCustomer: recentPeriod.filter(({ customerId }) => customerId.startsWith("order:")).length,
      },
      monthly,
      daily,
      breakdowns: { products, categories, pointsOfSale, sellers, weekdays },
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
          error: "FiSAFi limite temporairement les consultations. Réessayez dans quelques secondes.",
        });
      }
      return res.status(error.statusCode).json({ error: "Les données de ventes FiSAFi sont temporairement indisponibles." });
    }
    console.error("[Admin/Market] Unexpected stats request error:", error);
    return res.status(502).json({ error: "Les statistiques FiSAFi sont temporairement indisponibles." });
  }
}
