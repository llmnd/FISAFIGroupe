import { callOdoo, OdooApiError } from "@/lib/marketOdoo";

export type SalesOrderState = "draft" | "sent" | "sale" | "done" | "cancel";

export type SalesOrderInput = {
  partnerId: number;
  clientOrderRef: string;
  note: string;
  lines: Array<{ productId: number; quantity: number }>;
};

export type SalesOrderLine = {
  id: number;
  name: string;
  productId: number | null;
  displayType: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  total: number;
};

export type SalesOrderSummary = {
  id: number;
  reference: string;
  state: SalesOrderState;
  customerId: number;
  customerName: string;
  clientOrderRef: string;
  date: string;
  amountUntaxed: number;
  amountTax: number;
  amountTotal: number;
  currencyName: string;
};

export type SalesOrder = SalesOrderSummary & {
  note: string;
  lines: SalesOrderLine[];
};

export type SalesCustomer = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
};

export type SalesProduct = {
  id: number;
  name: string;
  reference: string | null;
  unitName: string;
  unitPrice: number;
};

type Relation = [number, string] | false;
type OdooOrder = {
  id: number;
  name: string;
  state: SalesOrderState;
  partner_id: [number, string];
  currency_id: [number, string];
  client_order_ref: string | false;
  date_order: string;
  amount_untaxed: number;
  amount_tax: number;
  amount_total: number;
  note: string | false;
  order_line: number[];
};
type OdooOrderLine = {
  id: number;
  order_id: [number, string];
  product_id: Relation;
  display_type: string | false;
  name: string;
  product_uom_qty: number;
  price_unit: number;
  price_subtotal: number;
  price_total: number;
};
type OdooCustomer = {
  id: number;
  name: string;
  email: string | false;
  phone: string | false;
  active: boolean;
  customer_rank: number;
};
type OdooTemplate = {
  id: number;
  name: string;
  default_code: string | false;
  sale_ok: boolean;
  active: boolean;
};
type OdooVariant = {
  id: number;
  product_tmpl_id: Relation;
  name: string;
  default_code: string | false;
  lst_price: number;
  uom_id: Relation;
  active: boolean;
};
type OdooProductTemplateReference = {
  id: number;
  product_tmpl_id: [number, string];
};

const MAX_ORDER_LINES = 50;
const MAX_LINE_QUANTITY = 99;
const MAX_PAGE_SIZE = 50;
const MAX_ORDER_LINES_TO_READ = 500;

const ORDER_STATES = ["draft", "sent", "sale", "done", "cancel"] as const;

function isRelation(value: unknown): value is Relation {
  return value === false || (
    Array.isArray(value) &&
    Number.isSafeInteger(value[0]) &&
    typeof value[1] === "string"
  );
}

function isOrderState(value: unknown): value is SalesOrderState {
  return typeof value === "string" && (ORDER_STATES as readonly string[]).includes(value);
}

function isOdooOrder(value: unknown): value is OdooOrder {
  if (!value || typeof value !== "object") return false;
  const order = value as Partial<OdooOrder>;
  return (
    Number.isSafeInteger(order.id) &&
    typeof order.name === "string" &&
    isOrderState(order.state) &&
    Array.isArray(order.partner_id) &&
    Number.isSafeInteger(order.partner_id[0]) &&
    typeof order.partner_id[1] === "string" &&
    Array.isArray(order.currency_id) &&
    Number.isSafeInteger(order.currency_id[0]) &&
    typeof order.currency_id[1] === "string" &&
    (typeof order.client_order_ref === "string" || order.client_order_ref === false) &&
    typeof order.date_order === "string" &&
    typeof order.amount_untaxed === "number" && Number.isFinite(order.amount_untaxed) &&
    typeof order.amount_tax === "number" && Number.isFinite(order.amount_tax) &&
    typeof order.amount_total === "number" && Number.isFinite(order.amount_total) &&
    (typeof order.note === "string" || order.note === false) &&
    Array.isArray(order.order_line) &&
    order.order_line.every((id) => Number.isSafeInteger(id) && id > 0)
  );
}

function isOdooOrderLine(value: unknown): value is OdooOrderLine {
  if (!value || typeof value !== "object") return false;
  const line = value as Partial<OdooOrderLine>;
  return (
    Number.isSafeInteger(line.id) &&
    Array.isArray(line.order_id) &&
    Number.isSafeInteger(line.order_id[0]) &&
    typeof line.order_id[1] === "string" &&
    isRelation(line.product_id) &&
    (typeof line.display_type === "string" || line.display_type === false) &&
    typeof line.name === "string" &&
    typeof line.product_uom_qty === "number" && Number.isFinite(line.product_uom_qty) &&
    typeof line.price_unit === "number" && Number.isFinite(line.price_unit) &&
    typeof line.price_subtotal === "number" && Number.isFinite(line.price_subtotal) &&
    typeof line.price_total === "number" && Number.isFinite(line.price_total)
  );
}

function isOdooCustomer(value: unknown): value is OdooCustomer {
  if (!value || typeof value !== "object") return false;
  const customer = value as Partial<OdooCustomer>;
  return (
    Number.isSafeInteger(customer.id) &&
    typeof customer.name === "string" &&
    (typeof customer.email === "string" || customer.email === false) &&
    (typeof customer.phone === "string" || customer.phone === false) &&
    typeof customer.active === "boolean" &&
    typeof customer.customer_rank === "number" && Number.isFinite(customer.customer_rank)
  );
}

function isOdooTemplate(value: unknown): value is OdooTemplate {
  if (!value || typeof value !== "object") return false;
  const template = value as Partial<OdooTemplate>;
  return (
    Number.isSafeInteger(template.id) &&
    typeof template.name === "string" &&
    (typeof template.default_code === "string" || template.default_code === false) &&
    typeof template.sale_ok === "boolean" &&
    typeof template.active === "boolean"
  );
}

function isOdooVariant(value: unknown): value is OdooVariant {
  if (!value || typeof value !== "object") return false;
  const variant = value as Partial<OdooVariant>;
  return (
    Number.isSafeInteger(variant.id) &&
    isRelation(variant.product_tmpl_id) &&
    typeof variant.name === "string" &&
    (typeof variant.default_code === "string" || variant.default_code === false) &&
    typeof variant.lst_price === "number" && Number.isFinite(variant.lst_price) &&
    isRelation(variant.uom_id) &&
    typeof variant.active === "boolean"
  );
}

function isOdooProductTemplateReference(value: unknown): value is OdooProductTemplateReference {
  if (!value || typeof value !== "object") return false;
  const product = value as Partial<OdooProductTemplateReference>;
  return (
    Number.isSafeInteger(product.id) &&
    Array.isArray(product.product_tmpl_id) &&
    Number.isSafeInteger(product.product_tmpl_id[0]) &&
    typeof product.product_tmpl_id[1] === "string"
  );
}

function isOdooIdRecord(value: unknown): value is { id: number } {
  return !!value && typeof value === "object" &&
    "id" in value && Number.isSafeInteger(value.id);
}

function requireSearchTerm(value: string): string {
  const search = value.trim();
  if (search.length < 2 || search.length > 80) {
    throw new OdooApiError("Saisissez au moins deux caractères pour lancer la recherche.", 400);
  }
  return search;
}

function validateInput(input: SalesOrderInput): void {
  if (!Number.isSafeInteger(input.partnerId) || input.partnerId <= 0) {
    throw new OdooApiError("Sélectionnez un client valide.", 400);
  }
  if (input.clientOrderRef.length > 64 || input.note.length > 2000) {
    throw new OdooApiError("La référence ou la note dépasse la longueur autorisée.", 400);
  }
  const quantityByProduct = new Map<number, number>();
  const invalidLine = input.lines.some((line) => {
    const invalid =
      !Number.isSafeInteger(line.productId) ||
      line.productId <= 0 ||
      !Number.isFinite(line.quantity) ||
      line.quantity <= 0 ||
      line.quantity > MAX_LINE_QUANTITY;
    if (invalid) return true;
    const total = (quantityByProduct.get(line.productId) ?? 0) + line.quantity;
    quantityByProduct.set(line.productId, total);
    return total > MAX_LINE_QUANTITY;
  });
  if (input.lines.length === 0 || input.lines.length > MAX_ORDER_LINES || invalidLine) {
    throw new OdooApiError("Ajoutez entre 1 et 50 produits avec une quantité valide (maximum 99 par ligne).", 400);
  }
}

function parseOrder(payload: unknown, requestedId?: number): OdooOrder {
  if (
    !Array.isArray(payload) ||
    payload.length !== 1 ||
    !isOdooOrder(payload[0]) ||
    (requestedId !== undefined && payload[0].id !== requestedId)
  ) {
    throw new OdooApiError("Odoo n’a pas renvoyé la commande demandée.");
  }
  return payload[0];
}

async function fetchSalesOrder(id: number): Promise<SalesOrder> {
  const payload: unknown = await callOdoo("sale.order", "search_read", {
    domain: [["id", "=", id]],
    fields: [
      "id", "name", "state", "partner_id", "client_order_ref", "date_order",
      "currency_id", "amount_untaxed", "amount_tax", "amount_total", "note", "order_line",
    ],
    limit: 1,
  });
  const order = parseOrder(payload, id);
  const lineIds = order.order_line;
  if (lineIds.length > MAX_ORDER_LINES_TO_READ) {
    throw new OdooApiError("Cette commande contient trop de lignes pour être affichée dans FiSAFi.", 413);
  }
  const linesPayload: unknown = lineIds.length
    ? await callOdoo("sale.order.line", "search_read", {
        domain: [["id", "in", lineIds], ["order_id", "=", id]],
        fields: [
          "id", "order_id", "product_id", "display_type", "name", "product_uom_qty",
          "price_unit", "price_subtotal", "price_total",
        ],
        limit: lineIds.length,
      })
    : [];

  if (
    !Array.isArray(linesPayload) ||
    linesPayload.length !== lineIds.length ||
    !linesPayload.every(isOdooOrderLine) ||
    linesPayload.some((line) => line.order_id[0] !== id || !lineIds.includes(line.id))
  ) {
    console.error(`[ERP/Odoo] Sale order ${id} returned invalid order lines.`);
    throw new OdooApiError("Odoo a renvoyé des lignes de commande invalides.");
  }

  return {
    id: order.id,
    reference: order.name,
    state: order.state,
    customerId: order.partner_id[0],
    customerName: order.partner_id[1],
    clientOrderRef: order.client_order_ref || "",
    date: order.date_order,
    amountUntaxed: order.amount_untaxed,
    amountTax: order.amount_tax,
    amountTotal: order.amount_total,
    currencyName: order.currency_id[1],
    note: order.note || "",
    lines: linesPayload.map((line) => ({
      id: line.id,
      name: line.name,
      productId: line.product_id === false ? null : line.product_id[0],
      displayType: line.display_type || null,
      quantity: line.product_uom_qty,
      unitPrice: line.price_unit,
      subtotal: line.price_subtotal,
      total: line.price_total,
    })),
  };
}

async function validateReferences(input: SalesOrderInput): Promise<void> {
  const partnerPayload: unknown = await callOdoo("res.partner", "search_read", {
    domain: [
      ["id", "=", input.partnerId],
      ["active", "=", true],
    ],
    fields: ["id"],
    limit: 1,
  });
  if (
    !Array.isArray(partnerPayload) ||
    partnerPayload.length !== 1 ||
    !isOdooIdRecord(partnerPayload[0]) ||
    partnerPayload[0].id !== input.partnerId
  ) {
    throw new OdooApiError("Le client sélectionné n’existe plus ou n’est pas accessible.", 400);
  }

  const productIds = [...new Set(input.lines.map((line) => line.productId))];
  const productsPayload: unknown = await callOdoo("product.product", "search_read", {
    domain: [
      ["id", "in", productIds],
      ["active", "=", true],
    ],
    fields: ["id", "product_tmpl_id"],
    limit: productIds.length,
  });
  if (
    !Array.isArray(productsPayload) ||
    productsPayload.length !== productIds.length ||
    !productsPayload.every(isOdooProductTemplateReference) ||
    productsPayload.some((product) => !productIds.includes(product.id))
  ) {
    throw new OdooApiError("Un produit n’est plus disponible pour la vente.", 400);
  }
  const templateIds = [...new Set(productsPayload.map((product) => product.product_tmpl_id[0]))];
  const templatesPayload: unknown = await callOdoo("product.template", "search_read", {
    domain: [
      ["id", "in", templateIds],
      ["active", "=", true],
      ["sale_ok", "=", true],
    ],
    fields: ["id"],
    limit: templateIds.length,
  });
  if (
    !Array.isArray(templatesPayload) ||
    templatesPayload.length !== templateIds.length ||
    !templatesPayload.every(isOdooIdRecord) ||
    templatesPayload.some((template) => !templateIds.includes(template.id))
  ) {
    throw new OdooApiError("Un produit n’est plus disponible pour la vente.", 400);
  }
}

export async function listSalesOrders(options: {
  search: string;
  offset: number;
  limit: number;
}): Promise<{ orders: SalesOrderSummary[]; hasMore: boolean }> {
  const { search, offset, limit } = options;
  if (
    !Number.isSafeInteger(offset) || offset < 0 ||
    !Number.isSafeInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE
  ) {
    throw new OdooApiError("Les paramètres de pagination sont invalides.", 400);
  }
  const domain: unknown[] = [];
  if (search.trim()) {
    const term = search.trim().slice(0, 80);
    domain.push("|", ["name", "ilike", term], ["client_order_ref", "ilike", term]);
  }
  const payload: unknown = await callOdoo("sale.order", "search_read", {
    domain,
    fields: [
      "id", "name", "state", "partner_id", "client_order_ref", "date_order",
      "currency_id", "amount_untaxed", "amount_tax", "amount_total", "note", "order_line",
    ],
    limit: limit + 1,
    offset,
    order: "date_order desc, id desc",
  });
  if (!Array.isArray(payload) || !payload.every(isOdooOrder)) {
    console.error("[ERP/Odoo] Sales order list returned an unexpected response.");
    throw new OdooApiError("Odoo a renvoyé une liste de commandes invalide.");
  }
  const hasMore = payload.length > limit;
  const page = payload.slice(0, limit);
  return {
    orders: page.map((order) => ({
      id: order.id,
      reference: order.name,
      state: order.state,
      customerId: order.partner_id[0],
      customerName: order.partner_id[1],
      clientOrderRef: order.client_order_ref || "",
      date: order.date_order,
      amountUntaxed: order.amount_untaxed,
      amountTax: order.amount_tax,
      amountTotal: order.amount_total,
      currencyName: order.currency_id[1],
    })),
    hasMore,
  };
}

export async function getSalesOrder(id: number): Promise<SalesOrder> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new OdooApiError("L’identifiant de commande est invalide.", 400);
  }
  return fetchSalesOrder(id);
}

export async function searchSalesCustomers(searchTerm: string): Promise<SalesCustomer[]> {
  const search = requireSearchTerm(searchTerm);
  const payload: unknown = await callOdoo("res.partner", "search_read", {
    domain: [
      ["active", "=", true],
      ["customer_rank", ">", 0],
      ["name", "ilike", search],
    ],
    fields: ["id", "name", "email", "phone", "active", "customer_rank"],
    limit: 30,
    order: "name asc",
  });
  if (!Array.isArray(payload) || !payload.every(isOdooCustomer)) {
    console.error("[ERP/Odoo] Customer search returned an unexpected response.");
    throw new OdooApiError("Odoo a renvoyé une liste de clients invalide.");
  }
  return payload.map((customer) => ({
    id: customer.id,
    name: customer.name,
    email: customer.email || null,
    phone: customer.phone || null,
  }));
}

export async function searchSalesProducts(searchTerm: string): Promise<SalesProduct[]> {
  const search = requireSearchTerm(searchTerm);
  const variantsPayload: unknown = await callOdoo("product.product", "search_read", {
    domain: [
      ["active", "=", true],
      "|",
      ["name", "ilike", search],
      ["default_code", "ilike", search],
    ],
    fields: ["id", "product_tmpl_id", "name", "default_code", "lst_price", "uom_id", "active"],
    limit: 100,
    order: "name asc",
  });
  if (!Array.isArray(variantsPayload) || !variantsPayload.every(isOdooVariant)) {
    console.error("[ERP/Odoo] Sales product search returned an unexpected response.");
    throw new OdooApiError("Odoo a renvoyé une liste de produits invalide.");
  }
  if (variantsPayload.length === 0) return [];

  const templateIds = [...new Set(
    variantsPayload.flatMap((variant) =>
      variant.product_tmpl_id === false ? [] : [variant.product_tmpl_id[0]],
    ),
  )];
  const templatesPayload: unknown = await callOdoo("product.template", "search_read", {
    domain: [
      ["id", "in", templateIds],
      ["sale_ok", "=", true],
      ["active", "=", true],
    ],
    fields: ["id", "name", "default_code", "sale_ok", "active"],
    limit: templateIds.length,
    order: "name asc",
  });
  if (
    !Array.isArray(templatesPayload) ||
    !templatesPayload.every(isOdooTemplate) ||
    templatesPayload.some((template) => !templateIds.includes(template.id))
  ) {
    console.error("[ERP/Odoo] Sales product templates returned an unexpected response.");
    throw new OdooApiError("Odoo a renvoyé une liste de produits invalide.");
  }
  const saleableTemplateIds = new Set(templatesPayload.filter((template) => template.sale_ok).map((template) => template.id));
  return variantsPayload
    .filter((variant) => variant.product_tmpl_id !== false && saleableTemplateIds.has(variant.product_tmpl_id[0]))
    .map((variant) => ({
      id: variant.id,
      name: variant.name,
      reference: variant.default_code || null,
      unitName: variant.uom_id === false ? "Unité" : variant.uom_id[1],
      unitPrice: variant.lst_price,
    }));
}

export async function createSalesOrder(input: SalesOrderInput): Promise<SalesOrder> {
  validateInput(input);
  await validateReferences(input);
  const result: unknown = await callOdoo("sale.order", "create", {
    vals_list: [{
      partner_id: input.partnerId,
      client_order_ref: input.clientOrderRef.trim() || false,
      note: input.note.trim(),
      order_line: input.lines.map((line) => [
        0,
        0,
        { product_id: line.productId, product_uom_qty: line.quantity },
      ]),
    }],
  });
  const orderId = Number.isSafeInteger(result) && Number(result) > 0
    ? Number(result)
    : Array.isArray(result) && result.length === 1 &&
        Number.isSafeInteger(result[0]) && result[0] > 0
      ? Number(result[0])
      : null;
  if (!orderId) {
    console.error("[ERP/Odoo] Sale order creation returned an unexpected identifier.");
    throw new OdooApiError("Odoo n’a pas confirmé la création du devis.");
  }
  const order = await fetchSalesOrder(orderId);
  if (order.state !== "draft" && order.state !== "sent") {
    console.error(`[ERP/Odoo] New sale order ${orderId} was created in state ${order.state}.`);
    throw new OdooApiError("Le devis a été créé dans un état inattendu.");
  }
  return order;
}

export async function updateSalesOrder(id: number, input: SalesOrderInput): Promise<SalesOrder> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new OdooApiError("L’identifiant de commande est invalide.", 400);
  }
  validateInput(input);
  const current = await fetchSalesOrder(id);
  if (current.state !== "draft") {
    throw new OdooApiError("Seuls les devis à l’état brouillon peuvent être modifiés.", 409);
  }
  const preservedLines = current.lines.filter((line) => line.productId === null);
  if (preservedLines.some((line) => line.displayType !== "line_section" && line.displayType !== "line_note")) {
    throw new OdooApiError("Ce devis contient des lignes spéciales qui ne peuvent pas être modifiées depuis FiSAFi.", 409);
  }
  await validateReferences(input);
  const latest = await fetchSalesOrder(id);
  if (latest.state !== "draft") {
    throw new OdooApiError("Le devis vient de changer d’état et ne peut plus être modifié.", 409);
  }
  await callOdoo("sale.order", "write", {
    ids: [id],
    vals: {
      partner_id: input.partnerId,
      client_order_ref: input.clientOrderRef.trim() || false,
      note: input.note.trim(),
      order_line: [
        [5, 0, 0],
        ...preservedLines.map((line) => [
          0,
          0,
          { display_type: line.displayType, name: line.name },
        ]),
        ...input.lines.map((line) => [
          0,
          0,
          { product_id: line.productId, product_uom_qty: line.quantity },
        ]),
      ],
    },
  });
  return fetchSalesOrder(id);
}

export async function confirmSalesOrder(id: number): Promise<SalesOrder> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new OdooApiError("L’identifiant de commande est invalide.", 400);
  }
  const current = await fetchSalesOrder(id);
  if (current.state === "sale" || current.state === "done") return current;
  if (current.state !== "draft" && current.state !== "sent") {
    throw new OdooApiError("Ce devis ne peut pas être confirmé dans son état actuel.", 409);
  }
  await callOdoo("sale.order", "action_confirm", { ids: [id] });
  const confirmed = await fetchSalesOrder(id);
  if (confirmed.state !== "sale" && confirmed.state !== "done") {
    console.error(`[ERP/Odoo] Confirmation of sale order ${id} did not change its state.`);
    throw new OdooApiError("Odoo n’a pas confirmé la commande.");
  }
  return confirmed;
}
