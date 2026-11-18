import { canViewProductCost, type EmployeeAccount } from "@/lib/employeeAuth";
import { callOdoo, OdooApiError } from "@/lib/marketOdoo";
import type {
  DataValue,
  HistoryPoint,
  ProductSnapshot,
  SimulationSnapshot,
} from "./contracts";

type Relation = [number, string] | false;
type SaleState = "draft" | "sent" | "sale" | "done" | "cancel";
type PosState = "draft" | "paid" | "done" | "invoiced" | "cancel";
type Company = { id: number; name: string; currency_id: Relation };
type SaleOrder = {
  id: number;
  name: string;
  state: SaleState;
  amount_total: number;
  amount_untaxed: number;
  date_order: string;
  partner_id: Relation;
  order_line: number[];
};
type PosOrder = {
  id: number;
  name: string;
  state: PosState;
  amount_total: number;
  amount_tax: number;
  date_order: string;
  partner_id: Relation;
  lines: number[];
};
type SaleLine = {
  id: number;
  order_id: Relation;
  product_id: Relation;
  product_uom_qty: number;
  price_subtotal: number;
  price_total: number;
};
type PosLine = {
  id: number;
  order_id: Relation;
  product_id: Relation;
  qty: number;
  price_subtotal: number;
  price_subtotal_incl: number;
};
type Variant = {
  id: number;
  product_tmpl_id: Relation;
  name: string;
  lst_price: number;
  free_qty: number;
};
type ProductTemplate = {
  id: number;
  name: string;
  list_price: number;
  standard_price?: number;
  uom_name: string;
  company_id: Relation;
};
type Order = {
  source: "sale_order" | "pos_order";
  id: number;
  state: string;
  date: Date;
  customerId: number | null;
  total: number;
  untaxed: number;
  lineIds: number[];
};

const FETCH_SIZE = 1_000;
const MAX_ORDERS = 50_000;
const MAX_LINES = 50_000;
const MAX_SNAPSHOT_PRODUCTS = 2_000;
const UTC_ZONE = "UTC" as const;

function isRelation(value: unknown): value is Relation {
  return value === false ||
    (Array.isArray(value) &&
      value.length === 2 &&
      Number.isSafeInteger(value[0]) &&
      typeof value[1] === "string");
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isIdArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((id) => Number.isSafeInteger(id) && id > 0);
}

function isCompany(value: unknown): value is Company {
  if (!value || typeof value !== "object") return false;
  const company = value as Partial<Company>;
  return Number.isSafeInteger(company.id) &&
    typeof company.name === "string" &&
    isRelation(company.currency_id);
}

function isSaleOrder(value: unknown): value is SaleOrder {
  if (!value || typeof value !== "object") return false;
  const order = value as Partial<SaleOrder>;
  return Number.isSafeInteger(order.id) &&
    typeof order.name === "string" &&
    (order.state === "draft" || order.state === "sent" || order.state === "sale" ||
      order.state === "done" || order.state === "cancel") &&
    isNumber(order.amount_total) &&
    isNumber(order.amount_untaxed) &&
    typeof order.date_order === "string" &&
    isRelation(order.partner_id) &&
    isIdArray(order.order_line);
}

function isPosOrder(value: unknown): value is PosOrder {
  if (!value || typeof value !== "object") return false;
  const order = value as Partial<PosOrder>;
  return Number.isSafeInteger(order.id) &&
    typeof order.name === "string" &&
    (order.state === "draft" || order.state === "paid" || order.state === "done" ||
      order.state === "invoiced" || order.state === "cancel") &&
    isNumber(order.amount_total) &&
    isNumber(order.amount_tax) &&
    typeof order.date_order === "string" &&
    isRelation(order.partner_id) &&
    isIdArray(order.lines);
}

function isSaleLine(value: unknown): value is SaleLine {
  if (!value || typeof value !== "object") return false;
  const line = value as Partial<SaleLine>;
  return Number.isSafeInteger(line.id) &&
    isRelation(line.order_id) &&
    isRelation(line.product_id) &&
    isNumber(line.product_uom_qty) &&
    isNumber(line.price_subtotal) &&
    isNumber(line.price_total);
}

function isPosLine(value: unknown): value is PosLine {
  if (!value || typeof value !== "object") return false;
  const line = value as Partial<PosLine>;
  return Number.isSafeInteger(line.id) &&
    isRelation(line.order_id) &&
    isRelation(line.product_id) &&
    isNumber(line.qty) &&
    isNumber(line.price_subtotal) &&
    isNumber(line.price_subtotal_incl);
}

function isVariant(value: unknown): value is Variant {
  if (!value || typeof value !== "object") return false;
  const variant = value as Partial<Variant>;
  return Number.isSafeInteger(variant.id) &&
    isRelation(variant.product_tmpl_id) &&
    typeof variant.name === "string" &&
    isNumber(variant.lst_price) &&
    isNumber(variant.free_qty);
}

function isProductTemplate(value: unknown): value is ProductTemplate {
  if (!value || typeof value !== "object") return false;
  const product = value as Partial<ProductTemplate>;
  return Number.isSafeInteger(product.id) &&
    typeof product.name === "string" &&
    isNumber(product.list_price) &&
    (product.standard_price === undefined || isNumber(product.standard_price)) &&
    typeof product.uom_name === "string" &&
    isRelation(product.company_id);
}

function parseOdooDate(value: string): Date {
  const date = new Date(`${value.replace(" ", "T")}Z`);
  if (Number.isNaN(date.getTime())) {
    throw new OdooApiError("FiSAFi a renvoyé une date de commande invalide.");
  }
  return date;
}

function toOdooUtc(date: Date): string {
  return date.toISOString().replace("T", " ").slice(0, 19);
}

function isConfirmed(order: Order): boolean {
  return order.source === "sale_order"
    ? order.state === "sale" || order.state === "done"
    : order.state === "paid" || order.state === "done" || order.state === "invoiced";
}

function coversCurrentMonth<T extends { date_order: string }>(
  result: { records: T[]; complete: boolean },
  currentMonthStart: Date,
): boolean {
  if (result.complete) return true;
  const oldestFetched = result.records[result.records.length - 1];
  return oldestFetched !== undefined &&
    parseOdooDate(oldestFetched.date_order) < currentMonthStart;
}

function observation<T>(value: T, source: string, observedAt: string): DataValue<T> {
  return { status: "observed", value, source, observedAt };
}

function unknown(reason: "not_recorded" | "not_authorized" | "incomplete"): DataValue<number> {
  return { status: "unknown", reason };
}

async function readAll<T>(
  model: string,
  companyId: number,
  start: Date,
  endExclusive: Date,
  confirmedStates: string[],
  fields: string[],
  isRecord: (value: unknown) => value is T & { id: number },
): Promise<{ records: Array<T & { id: number }>; complete: boolean }> {
  const records: Array<T & { id: number }> = [];
  const seen = new Set<number>();
  while (records.length < MAX_ORDERS) {
    const limit = Math.min(FETCH_SIZE, MAX_ORDERS - records.length);
    const payload: unknown = await callOdoo(model, "search_read", {
      domain: [
        ["company_id", "=", companyId],
        ["date_order", ">=", toOdooUtc(start)],
        ["date_order", "<", toOdooUtc(endExclusive)],
        ["state", "in", confirmedStates],
      ],
      fields,
      limit,
      offset: records.length,
      order: "date_order desc, id desc",
    });
    if (!Array.isArray(payload) || !payload.every(isRecord)) {
      throw new OdooApiError(`FiSAFi a renvoyé des données invalides pour ${model}.`);
    }
    for (const record of payload) {
      if (seen.has(record.id)) {
        throw new OdooApiError(`FiSAFi a renvoyé un identifiant répété pour ${model}.`);
      }
      seen.add(record.id);
      records.push(record);
    }
    if (payload.length < limit) return { records, complete: true };
  }
  return { records, complete: false };
}

async function readLines<T extends { id: number; order_id: Relation }>(
  model: string,
  ids: number[],
  isRecord: (value: unknown) => value is T,
): Promise<{ records: T[]; complete: boolean }> {
  const uniqueIds = [...new Set(ids)];
  const selectedIds = uniqueIds.slice(0, MAX_LINES);
  const records: T[] = [];
  const seen = new Set<number>();
  for (let offset = 0; offset < selectedIds.length; offset += FETCH_SIZE) {
    const batch = selectedIds.slice(offset, offset + FETCH_SIZE);
    const payload: unknown = await callOdoo(model, "search_read", {
      domain: [["id", "in", batch]],
      fields: model === "sale.order.line"
        ? ["id", "order_id", "product_id", "product_uom_qty", "price_subtotal", "price_total"]
        : ["id", "order_id", "product_id", "qty", "price_subtotal", "price_subtotal_incl"],
      limit: batch.length,
      order: "id asc",
    });
    if (
      !Array.isArray(payload) ||
      payload.length !== batch.length ||
      !payload.every(isRecord) ||
      new Set(payload.map((record) => record.id)).size !== batch.length ||
      payload.some((record) => !batch.includes(record.id))
    ) {
      throw new OdooApiError(`FiSAFi a renvoyé des lignes incomplètes pour ${model}.`);
    }
    for (const line of payload) {
      if (seen.has(line.id)) {
        throw new OdooApiError(`FiSAFi a renvoyé un identifiant de ligne répété pour ${model}.`);
      }
      seen.add(line.id);
      records.push(line);
    }
  }
  return { records, complete: uniqueIds.length <= MAX_LINES };
}

export async function getMarketSimulationSnapshot(
  companyId: number,
  account: EmployeeAccount,
  now = new Date(),
): Promise<SimulationSnapshot> {
  if (!Number.isSafeInteger(companyId) || companyId <= 0) {
    throw new OdooApiError("L’identifiant de société sélectionné est invalide.", 400);
  }

  const companyPayload: unknown = await callOdoo("res.company", "search_read", {
    domain: [["id", "=", companyId]],
    fields: ["id", "name", "currency_id"],
    limit: 1,
  });
  if (
    !Array.isArray(companyPayload) ||
    companyPayload.length !== 1 ||
    !companyPayload.every(isCompany) ||
    companyPayload[0].id !== companyId
  ) {
    throw new OdooApiError("FiSAFi a renvoyé une société invalide.");
  }
  const company = companyPayload[0];
  if (!company) throw new OdooApiError("La société sélectionnée n’est pas accessible.", 403);
  const normalizedName = company.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (!normalizedName.includes("groupe") && !normalizedName.includes("market")) {
    throw new OdooApiError("La société sélectionnée n’est pas une société FiSAFi autorisée.", 403);
  }

  const generatedAt = now.toISOString();
  const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const historyStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));
  const historyEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const [saleResult, posResult] = await Promise.all([
    readAll<SaleOrder>(
      "sale.order",
      companyId,
      historyStart,
      historyEnd,
      ["sale", "done"],
      ["id", "name", "state", "amount_total", "amount_untaxed", "date_order", "partner_id", "order_line"],
      (value): value is SaleOrder & { id: number } => isSaleOrder(value),
    ),
    readAll<PosOrder>(
      "pos.order",
      companyId,
      historyStart,
      historyEnd,
      ["paid", "done", "invoiced"],
      ["id", "name", "state", "amount_total", "amount_tax", "date_order", "partner_id", "lines"],
      (value): value is PosOrder & { id: number } => isPosOrder(value),
    ),
  ]);

  const orders: Order[] = [
    ...saleResult.records.map((order) => ({
      source: "sale_order" as const,
      id: order.id,
      state: order.state,
      date: parseOdooDate(order.date_order),
      customerId: order.partner_id === false ? null : order.partner_id[0],
      total: order.amount_total,
      untaxed: order.amount_untaxed,
      lineIds: order.order_line,
    })),
    ...posResult.records.map((order) => ({
      source: "pos_order" as const,
      id: order.id,
      state: order.state,
      date: parseOdooDate(order.date_order),
      customerId: order.partner_id === false ? null : order.partner_id[0],
      total: order.amount_total,
      untaxed: order.amount_total - order.amount_tax,
      lineIds: order.lines,
    })),
  ].filter((order) => order.date < historyEnd);

  const monthly: HistoryPoint[] = Array.from({ length: 12 }, (_, index) => {
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11 + index, 1));
    return {
      periodStart: monthStart.toISOString().slice(0, 10),
      confirmedOrders: 0,
      confirmedRevenue: 0,
      confirmedRevenueUntaxed: 0,
    };
  });

  const lineBearingOrders = orders.filter(isConfirmed);
  let confirmedRevenue = 0;
  let confirmedRevenueUntaxed = 0;
  let confirmedOrders = 0;
  let identifiedCustomers = 0;
  let ordersWithoutCustomer = 0;
  const currentCustomerIds = new Set<number>();
  const saleLineIds: number[] = [];
  const posLineIds: number[] = [];
  let orderLinesComplete = saleResult.complete && posResult.complete;

  for (const order of lineBearingOrders) {
    if (order.lineIds.length === 0) orderLinesComplete = false;
    if (order.source === "sale_order") {
      for (const id of order.lineIds) saleLineIds.push(id);
    } else {
      for (const id of order.lineIds) posLineIds.push(id);
    }
    const monthIndex =
      (order.date.getUTCFullYear() - now.getUTCFullYear()) * 12 +
      order.date.getUTCMonth() -
      now.getUTCMonth() +
      11;
    if (monthIndex < 0 || monthIndex >= monthly.length) continue;
    const month = monthly[monthIndex];
    month.confirmedOrders += 1;
    month.confirmedRevenue += order.total;
    month.confirmedRevenueUntaxed =
      (month.confirmedRevenueUntaxed ?? 0) + order.untaxed;
    if (order.date >= currentMonthStart) {
      confirmedOrders += 1;
      confirmedRevenue += order.total;
      confirmedRevenueUntaxed += order.untaxed;
      if (order.customerId === null) ordersWithoutCustomer += 1;
      else currentCustomerIds.add(order.customerId);
    }
  }
  identifiedCustomers = currentCustomerIds.size;

  if (saleLineIds.length > MAX_LINES || posLineIds.length > MAX_LINES) {
    orderLinesComplete = false;
  }
  const [saleLineResult, posLineResult] = await Promise.all([
    readLines<SaleLine>("sale.order.line", saleLineIds, isSaleLine),
    readLines<PosLine>("pos.order.line", posLineIds, isPosLine),
  ]);
  orderLinesComplete = orderLinesComplete && saleLineResult.complete && posLineResult.complete;

  const orderIndex = new Map(orders.map((order) => [`${companyId}:${order.source}:${order.id}`, order]));
  const productRows = new Map<number, {
    templateId: number | null;
    name: string;
    unitName: string | null;
    soldOrders: Set<string>;
    soldQuantity: number;
    soldRevenueTotal: number;
    soldRevenueUntaxed: number;
  }>();
  const lineVariantIds = new Set<number>();
  const addLine = (
    source: "sale_order" | "pos_order",
    line: SaleLine | PosLine,
    quantity: number,
    revenueUntaxed: number,
    revenueTotal: number,
  ) => {
    if (
      quantity < 0 ||
      revenueUntaxed < 0 ||
      revenueTotal < 0 ||
      (quantity === 0 && (revenueUntaxed !== 0 || revenueTotal !== 0))
    ) {
      orderLinesComplete = false;
    }
    if (line.order_id === false || line.product_id === false) {
      orderLinesComplete = false;
      return;
    }
    const order = orderIndex.get(`${companyId}:${source}:${line.order_id[0]}`);
    if (!order || !isConfirmed(order) || !order.lineIds.includes(line.id)) {
      orderLinesComplete = false;
      return;
    }
    const productId = line.product_id[0];
    lineVariantIds.add(productId);
    const product = productRows.get(productId) ?? {
      templateId: null,
      name: line.product_id[1],
      unitName: null,
      soldOrders: new Set<string>(),
      soldQuantity: 0,
      soldRevenueTotal: 0,
      soldRevenueUntaxed: 0,
    };
    product.soldOrders.add(`${companyId}:${source}:${order.id}`);
    product.soldQuantity += quantity;
    product.soldRevenueTotal += revenueTotal;
    product.soldRevenueUntaxed += revenueUntaxed;
    productRows.set(productId, product);
  };
  for (const line of saleLineResult.records) {
    addLine("sale_order", line, line.product_uom_qty, line.price_subtotal, line.price_total);
  }
  for (const line of posLineResult.records) {
    addLine("pos_order", line, line.qty, line.price_subtotal, line.price_subtotal_incl);
  }

  const variantsPayload: unknown = lineVariantIds.size
    ? await callOdoo("product.product", "search_read", {
        domain: [["id", "in", [...lineVariantIds]], ["active", "=", true]],
        fields: ["id", "product_tmpl_id", "name", "lst_price", "free_qty"],
        limit: lineVariantIds.size,
        context: { allowed_company_ids: [companyId], force_company: companyId },
      })
    : [];
  if (!Array.isArray(variantsPayload) || !variantsPayload.every(isVariant)) {
    throw new OdooApiError("FiSAFi a renvoyé des variantes produit invalides.");
  }
  const variantsById = new Map(variantsPayload.map((variant) => [variant.id, variant]));
  if (variantsById.size !== lineVariantIds.size) orderLinesComplete = false;

  const templateIds = [...new Set(
    variantsPayload.flatMap((variant) =>
      variant.product_tmpl_id === false ? [] : [variant.product_tmpl_id[0]],
    ),
  )];
  const mayReadCosts = canViewProductCost(account);
  const templatesPayload: unknown = templateIds.length
    ? await callOdoo("product.template", "search_read", {
        domain: [
          ["id", "in", templateIds],
          ["company_id", "in", [false, companyId]],
        ],
        fields: [
          "id",
          "name",
          "list_price",
          "uom_name",
          "company_id",
          ...(mayReadCosts ? ["standard_price"] : []),
        ],
        limit: templateIds.length,
        context: { allowed_company_ids: [companyId], force_company: companyId },
      })
    : [];
  if (!Array.isArray(templatesPayload) || !templatesPayload.every(isProductTemplate)) {
    throw new OdooApiError("FiSAFi a renvoyé des produits invalides pour le simulateur.");
  }
  const templatesById = new Map(templatesPayload.map((product) => [product.id, product]));
  if (templatesById.size !== templateIds.length) orderLinesComplete = false;
  const observedProducts: ProductSnapshot[] = [];
  for (const [productId, totals] of productRows) {
    const variant = variantsById.get(productId);
    const template = variant?.product_tmpl_id === false || !variant
      ? undefined
      : templatesById.get(variant.product_tmpl_id[0]);
    totals.templateId = template?.id ?? null;
    totals.name = template?.name ?? totals.name;
    totals.unitName = template?.uom_name ?? null;
    observedProducts.push({
      productId,
      templateId: totals.templateId,
      name: totals.name,
      unitName: totals.unitName,
      soldOrders: totals.soldOrders.size,
      soldQuantity: totals.soldQuantity,
      soldRevenueTotal: totals.soldRevenueTotal,
      soldRevenueUntaxed: totals.soldRevenueUntaxed,
      currentSalePrice: variant
        ? observation(variant.lst_price, "product.product.lst_price (prix courant)", generatedAt)
        : unknown("not_recorded"),
      currentUnitCost: mayReadCosts
        ? template?.standard_price !== undefined
          ? observation(template.standard_price, "product.template.standard_price (coût courant)", generatedAt)
          : unknown("not_recorded")
        : unknown("not_authorized"),
      currentAvailableStock: variant
        ? observation(variant.free_qty, "product.product.free_qty (stock courant)", generatedAt)
        : unknown("not_recorded"),
    });
  }
  observedProducts.sort((first, second) =>
    second.soldRevenueTotal - first.soldRevenueTotal || first.name.localeCompare(second.name, "fr"),
  );
  const productsComplete = orderLinesComplete &&
    variantsById.size === lineVariantIds.size &&
    templatesById.size === templateIds.length &&
    observedProducts.length <= MAX_SNAPSHOT_PRODUCTS;
  const snapshotProducts = observedProducts.slice(0, MAX_SNAPSHOT_PRODUCTS);

  const daysInMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
  const elapsedDays = Math.max(now.getUTCDate(), 1);
  const currencyName = company.currency_id === false ? null : company.currency_id[1];
  const historyComplete = saleResult.complete && posResult.complete;
  const currentMonthComplete =
    coversCurrentMonth(saleResult, currentMonthStart) &&
    coversCurrentMonth(posResult, currentMonthStart);
  const customerCoverage = confirmedOrders > 0 ? identifiedCustomers / confirmedOrders : 0;

  return {
    companyId,
    companyName: company.name,
    generatedAt,
    timezone: UTC_ZONE,
    currencyName,
    monthStart: currentMonthStart.toISOString().slice(0, 10),
    actuals: {
      confirmedRevenue,
      confirmedRevenueUntaxed: confirmedOrders > 0 ? confirmedRevenueUntaxed : null,
      confirmedOrders,
      identifiedCustomers,
      ordersWithoutCustomer,
      elapsedDays,
      remainingDays: Math.max(daysInMonth - elapsedDays, 0),
    },
    history: {
      monthly,
      complete: historyComplete,
      from: historyStart.toISOString().slice(0, 10),
      toExclusive: historyEnd.toISOString().slice(0, 10),
    },
    products: snapshotProducts,
    quality: {
      ordersComplete: historyComplete,
      currentMonthComplete,
      orderLinesComplete,
      productsComplete,
      customerCoverage,
      notes: [
        "Les dates et mois sont regroupés en UTC, comme dans les statistiques actuelles.",
        "Les coûts et stocks du catalogue sont des valeurs courantes, pas des valeurs historiques.",
        ...(!currentMonthComplete ? ["Le mois courant est partiel ; son panier moyen et ses totaux ne sont pas utilisés comme référence complète."] : []),
        ...(ordersWithoutCustomer > 0 ? [`${ordersWithoutCustomer} commandes confirmées n'ont pas de client identifié.`] : []),
        ...(!historyComplete ? ["L'historique a atteint la limite de lecture et peut être incomplet."] : []),
        ...(!orderLinesComplete ? ["Les lignes ou produits sont incomplets ; les marges et limites de stock ne sont pas exhaustives."] : []),
        ...(observedProducts.length > MAX_SNAPSHOT_PRODUCTS
          ? [`La liste produit est limitée aux ${MAX_SNAPSHOT_PRODUCTS} meilleures références par chiffre d'affaires ; les calculs de marge et de stock sont incomplets.`]
          : []),
      ],
    },
  };
}
