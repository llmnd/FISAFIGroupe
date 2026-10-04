import { createHash } from "crypto";
import { callOdoo, getTemplateStock, OdooApiError } from "@/lib/marketOdoo";
import type {
  ERPProvider,
  PointOfSale,
  POSClosingMethod,
  POSClosingSummary,
  POSPaymentMethod,
  POSProduct,
  POSProductPage,
  POSSaleLineInput,
  POSSaleResult,
  POSSession,
  POSSessionStatus,
  POSSaleQuote,
} from "./contracts";
import { ERPOperationError } from "./errors";

type OdooRelation = [number, string] | false;
type OdooPOSConfig = {
  id: number;
  name: string;
  company_id: OdooRelation;
  current_session_id: OdooRelation;
  active: boolean;
};
type OdooPOSSession = {
  id: number;
  name: string;
  state: string;
  user_id: OdooRelation;
  start_at: string | false;
};
type OdooPOSProduct = {
  id: number;
  name: string;
  default_code: string | false;
  list_price: number;
  uom_name: string;
  image_128: string | false | null;
  write_date: string;
};
type OdooPOSConfigDetails = {
  id: number;
  name: string;
  active: boolean;
  company_id: OdooRelation;
  current_session_id: OdooRelation;
  payment_method_ids: number[];
  pricelist_id: OdooRelation;
  default_fiscal_position_id: OdooRelation;
  cash_control: boolean;
  picking_type_id: OdooRelation;
  cash_rounding: boolean;
  rounding_method: OdooRelation;
};
type OdooPOSSessionDetails = {
  id: number;
  name: string;
  state: string;
  config_id: OdooRelation;
  user_id: OdooRelation;
  start_at: string | false;
  opening_notes: string | false;
  closing_notes: string | false;
  payment_method_ids: number[];
  currency_id: OdooRelation;
  cash_register_balance_end: number;
};
type OdooPaymentMethod = {
  id: number;
  name: string;
  type: string;
  is_cash_count: boolean;
  use_payment_terminal: string | false;
  active: boolean;
};
type OdooSaleProduct = {
  id: number;
  product_tmpl_id: OdooRelation;
  active: boolean;
  lst_price: number;
  free_qty: number;
  tracking: string;
};
type OdooSaleTemplate = {
  id: number;
  name: string;
  active: boolean;
  sale_ok: boolean;
  available_in_pos: boolean;
  taxes_id: number[];
  uom_name: string;
};
type OdooTax = {
  id: number;
  amount: number;
  amount_type: string;
  price_include: boolean;
  include_base_amount: boolean;
  sequence: number;
};
type OdooCurrency = {
  id: number;
  rounding: number;
  decimal_places: number;
};
type OdooPOSPayment = {
  id: number;
  amount: number;
  payment_method_id: OdooRelation;
  is_change: boolean;
};
type OdooPOSOrderSummary = {
  id: number;
  state: string;
  payment_ids: number[];
};
type OdooPOSOrder = {
  id: number;
  name: string;
  uuid: string;
  state: string;
  amount_total: number;
  amount_tax: number;
  amount_paid: number;
  session_id: OdooRelation;
  internal_note: string | false;
};
type OdooPickingType = {
  id: number;
  default_location_src_id: OdooRelation;
};
type OdooStockQuant = {
  id: number;
  product_id: OdooRelation;
  location_id: OdooRelation;
  quantity: number;
  reserved_quantity: number;
};

const MAX_LINES_PER_SALE = 100;
const MAX_ORDERS_PER_SESSION = 10_000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isRelation(value: unknown): value is OdooRelation {
  return value === false || (
    Array.isArray(value) &&
    Number.isSafeInteger(value[0]) &&
    typeof value[1] === "string"
  );
}

function isPOSConfig(value: unknown): value is OdooPOSConfig {
  if (!value || typeof value !== "object") return false;
  const config = value as Partial<OdooPOSConfig>;
  return (
    Number.isSafeInteger(config.id) &&
    typeof config.name === "string" &&
    isRelation(config.company_id) &&
    isRelation(config.current_session_id) &&
    typeof config.active === "boolean"
  );
}

function isPOSSession(value: unknown): value is OdooPOSSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<OdooPOSSession>;
  return (
    Number.isSafeInteger(session.id) &&
    typeof session.name === "string" &&
    typeof session.state === "string" &&
    isRelation(session.user_id) &&
    (typeof session.start_at === "string" || session.start_at === false)
  );
}

function isPOSProduct(value: unknown): value is OdooPOSProduct {
  if (!value || typeof value !== "object") return false;
  const product = value as Partial<OdooPOSProduct>;
  return (
    Number.isSafeInteger(product.id) &&
    typeof product.name === "string" &&
    (typeof product.default_code === "string" || product.default_code === false) &&
    typeof product.list_price === "number" &&
    Number.isFinite(product.list_price) &&
    product.list_price >= 0 &&
    typeof product.uom_name === "string" &&
    (typeof product.image_128 === "string" || product.image_128 === false || product.image_128 === null) &&
    typeof product.write_date === "string"
  );
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => Number.isSafeInteger(item) && item > 0);
}

function isPOSConfigDetails(value: unknown): value is OdooPOSConfigDetails {
  if (!value || typeof value !== "object") return false;
  const config = value as Partial<OdooPOSConfigDetails>;
  return (
    Number.isSafeInteger(config.id) &&
    typeof config.name === "string" &&
    typeof config.active === "boolean" &&
    isRelation(config.company_id) &&
    isRelation(config.current_session_id) &&
    isNumberArray(config.payment_method_ids) &&
    isRelation(config.pricelist_id) &&
    isRelation(config.default_fiscal_position_id) &&
    typeof config.cash_control === "boolean" &&
    isRelation(config.picking_type_id) &&
    typeof config.cash_rounding === "boolean" &&
    isRelation(config.rounding_method)
  );
}

function isPOSSessionDetails(value: unknown): value is OdooPOSSessionDetails {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<OdooPOSSessionDetails>;
  return (
    Number.isSafeInteger(session.id) &&
    typeof session.name === "string" &&
    typeof session.state === "string" &&
    isRelation(session.config_id) &&
    isRelation(session.user_id) &&
    (typeof session.start_at === "string" || session.start_at === false) &&
    (typeof session.opening_notes === "string" || session.opening_notes === false) &&
    (typeof session.closing_notes === "string" || session.closing_notes === false) &&
    isNumberArray(session.payment_method_ids) &&
    isRelation(session.currency_id) &&
    typeof session.cash_register_balance_end === "number" &&
    Number.isFinite(session.cash_register_balance_end)
  );
}

function isOdooPaymentMethod(value: unknown): value is OdooPaymentMethod {
  if (!value || typeof value !== "object") return false;
  const method = value as Partial<OdooPaymentMethod>;
  return (
    Number.isSafeInteger(method.id) &&
    typeof method.name === "string" &&
    typeof method.type === "string" &&
    typeof method.is_cash_count === "boolean" &&
    (typeof method.use_payment_terminal === "string" || method.use_payment_terminal === false) &&
    typeof method.active === "boolean"
  );
}

function isOdooSaleProduct(value: unknown): value is OdooSaleProduct {
  if (!value || typeof value !== "object") return false;
  const product = value as Partial<OdooSaleProduct>;
  return (
    Number.isSafeInteger(product.id) &&
    isRelation(product.product_tmpl_id) &&
    typeof product.active === "boolean" &&
    typeof product.lst_price === "number" &&
    Number.isFinite(product.lst_price) &&
    product.lst_price >= 0 &&
    typeof product.free_qty === "number" &&
    Number.isFinite(product.free_qty) &&
    typeof product.tracking === "string"
  );
}

function isOdooSaleTemplate(value: unknown): value is OdooSaleTemplate {
  if (!value || typeof value !== "object") return false;
  const template = value as Partial<OdooSaleTemplate>;
  return (
    Number.isSafeInteger(template.id) &&
    typeof template.name === "string" &&
    typeof template.active === "boolean" &&
    typeof template.sale_ok === "boolean" &&
    typeof template.available_in_pos === "boolean" &&
    isNumberArray(template.taxes_id) &&
    typeof template.uom_name === "string"
  );
}

function isOdooTax(value: unknown): value is OdooTax {
  if (!value || typeof value !== "object") return false;
  const tax = value as Partial<OdooTax>;
  return (
    Number.isSafeInteger(tax.id) &&
    typeof tax.amount === "number" &&
    Number.isFinite(tax.amount) &&
    typeof tax.amount_type === "string" &&
    typeof tax.price_include === "boolean" &&
    typeof tax.include_base_amount === "boolean" &&
    typeof tax.sequence === "number"
  );
}

function isOdooCurrency(value: unknown): value is OdooCurrency {
  if (!value || typeof value !== "object") return false;
  const currency = value as Partial<OdooCurrency>;
  return (
    Number.isSafeInteger(currency.id) &&
    typeof currency.rounding === "number" &&
    Number.isFinite(currency.rounding) &&
    currency.rounding > 0 &&
    Number.isSafeInteger(currency.decimal_places) &&
    (currency.decimal_places as number) >= 0
  );
}

function isPOSPayment(value: unknown): value is OdooPOSPayment {
  if (!value || typeof value !== "object") return false;
  const payment = value as Partial<OdooPOSPayment>;
  return (
    Number.isSafeInteger(payment.id) &&
    typeof payment.amount === "number" &&
    Number.isFinite(payment.amount) &&
    isRelation(payment.payment_method_id) &&
    typeof payment.is_change === "boolean"
  );
}

function isPOSOrderSummary(value: unknown): value is OdooPOSOrderSummary {
  if (!value || typeof value !== "object") return false;
  const order = value as Partial<OdooPOSOrderSummary>;
  return (
    Number.isSafeInteger(order.id) &&
    typeof order.state === "string" &&
    isNumberArray(order.payment_ids)
  );
}

function isPOSOrder(value: unknown): value is OdooPOSOrder {
  if (!value || typeof value !== "object") return false;
  const order = value as Partial<OdooPOSOrder>;
  return (
    Number.isSafeInteger(order.id) &&
    typeof order.name === "string" &&
    typeof order.uuid === "string" &&
    typeof order.state === "string" &&
    typeof order.amount_total === "number" &&
    Number.isFinite(order.amount_total) &&
    typeof order.amount_tax === "number" &&
    Number.isFinite(order.amount_tax) &&
    typeof order.amount_paid === "number" &&
    Number.isFinite(order.amount_paid) &&
    isRelation(order.session_id) &&
    (typeof order.internal_note === "string" || order.internal_note === false)
  );
}

function isOdooPickingType(value: unknown): value is OdooPickingType {
  if (!value || typeof value !== "object") return false;
  const pickingType = value as Partial<OdooPickingType>;
  return Number.isSafeInteger(pickingType.id) && isRelation(pickingType.default_location_src_id);
}

function isOdooStockQuant(value: unknown): value is OdooStockQuant {
  if (!value || typeof value !== "object") return false;
  const quant = value as Partial<OdooStockQuant>;
  return (
    Number.isSafeInteger(quant.id) &&
    isRelation(quant.product_id) &&
    isRelation(quant.location_id) &&
    typeof quant.quantity === "number" &&
    Number.isFinite(quant.quantity) &&
    typeof quant.reserved_quantity === "number" &&
    Number.isFinite(quant.reserved_quantity)
  );
}

function operationError(message: string, statusCode = 409): ERPOperationError {
  return new ERPOperationError(message, statusCode);
}

function normalizeOdooDate(date: Date): string {
  return date.toISOString().replace("T", " ").slice(0, 19);
}

function roundToCurrency(amount: number, rounding: number): number {
  return Math.round((amount + Number.EPSILON) / rounding) * rounding;
}

function getSessionOwnerMarker(employeeId: string): string {
  return `FISAFI_OWNER:${employeeId}`;
}

function digestPayload(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function assertValidOperationId(operationId: string): void {
  if (!UUID_PATTERN.test(operationId)) {
    throw operationError("La clé d’idempotence est invalide.", 400);
  }
}

function sessionResult(session: OdooPOSSessionDetails): POSSession {
  return {
    id: session.id,
    name: session.name,
    status: normalizeSessionStatus(session.state),
    startedAt: typeof session.start_at === "string" ? session.start_at : null,
  };
}

function normalizeSessionStatus(value: string): POSSessionStatus {
  switch (value) {
    case "opened":
    case "opening_control":
    case "closing_control":
    case "closed":
      return value;
    default:
      return "unknown";
  }
}

export class OdooERPProvider implements ERPProvider {
  async getPointsOfSale(): Promise<PointOfSale[]> {
    const configs: unknown = await callOdoo("pos.config", "search_read", {
      domain: [],
      fields: ["id", "name", "company_id", "current_session_id", "active"],
      limit: 200,
      order: "name asc",
    });

    if (!Array.isArray(configs) || !configs.every(isPOSConfig)) {
      console.error("[ERP/Odoo] Point-of-sale configuration response has an unexpected format.");
      throw new OdooApiError("Les points de vente ont renvoyé des données invalides.");
    }

    const sessionIds = [...new Set(
      configs.flatMap((config) => config.current_session_id === false ? [] : [config.current_session_id[0]]),
    )];
    const sessions: unknown = sessionIds.length
      ? await callOdoo("pos.session", "search_read", {
          domain: [["id", "in", sessionIds]],
          fields: ["id", "name", "state", "user_id", "start_at"],
          limit: sessionIds.length,
        })
      : [];

    if (
      !Array.isArray(sessions) ||
      !sessions.every(isPOSSession) ||
      sessions.some((session) => !sessionIds.includes(session.id))
    ) {
      console.error("[ERP/Odoo] Point-of-sale session response has an unexpected format.");
      throw new OdooApiError("Les sessions de caisse ont renvoyé des données invalides.");
    }

    const sessionById = new Map(sessions.map((session) => [session.id, session]));
    return configs.map((config) => {
      const currentSessionId = config.current_session_id === false ? null : config.current_session_id[0];
      const session = currentSessionId === null ? undefined : sessionById.get(currentSessionId);
      if (currentSessionId !== null && !session) {
        console.error(`[ERP/Odoo] Current session ${currentSessionId} was not returned for a point of sale.`);
        throw new OdooApiError("Une session de caisse n’a pas pu être vérifiée.");
      }

      return {
        id: config.id,
        name: config.name,
        location: config.company_id === false ? null : config.company_id[1],
        active: config.active,
        session: session
          ? {
              id: session.id,
              name: session.name,
              status: normalizeSessionStatus(session.state),
              responsible: session.user_id === false ? null : session.user_id[1],
              startedAt: typeof session.start_at === "string" ? session.start_at : null,
            }
          : null,
      };
    });
  }

  async getPOSProducts(options: {
    configId: number;
    search: string;
    offset: number;
    limit: number;
  }): Promise<POSProductPage> {
    const { configId, search, offset, limit } = options;
    const domain: unknown[] = [
      ["active", "=", true],
      ["sale_ok", "=", true],
      ["available_in_pos", "=", true],
    ];
    if (search) {
      domain.push("|", ["name", "ilike", search], ["default_code", "ilike", search]);
    }

    const payload: unknown = await callOdoo("product.template", "search_read", {
      domain,
      fields: ["id", "name", "default_code", "list_price", "uom_name", "image_128", "write_date"],
      limit: limit + 1,
      offset,
      order: "name asc",
    });
    if (!Array.isArray(payload) || !payload.every(isPOSProduct)) {
      console.error("[ERP/Odoo] POS product response has an unexpected format.");
      throw new OdooApiError("Le catalogue caisse a renvoyé des données invalides.");
    }

    const hasMore = payload.length > limit;
    const page = (payload as OdooPOSProduct[]).slice(0, limit);
    const stockByTemplate = await getTemplateStock(page.map((product) => product.id));
    const config = await this.getPOSConfig(configId);
    const variants = Array.from(stockByTemplate.values()).flatMap((stock) => stock.variants);
    const locationStock = await this.getLocationStock(config, variants.map((variant) => variant.id));
    const products: POSProduct[] = page.map((product) => {
      const stock = stockByTemplate.get(product.id);
      const productVariants = stock?.variants ?? [];
      const availableQuantity = productVariants.reduce(
        (sum, variant) => sum + (locationStock.get(variant.id) ?? 0),
        0,
      );
      return {
        id: product.id,
        variantRef: productVariants.length === 1 ? String(productVariants[0].id) : null,
        name: product.name,
        reference: product.default_code || null,
        unitPrice: productVariants.length === 1
          ? productVariants[0].lst_price
          : product.list_price,
        unitName: product.uom_name,
        availableQuantity,
        imageUrl: `/api/market/products/${product.id}/image?v=${encodeURIComponent(product.write_date)}`,
        variantChoiceRequired: productVariants.length > 1,
      };
    });
    return { products, hasMore };
  }

  private async getPOSConfig(configId: number): Promise<OdooPOSConfigDetails> {
    const payload: unknown = await callOdoo("pos.config", "search_read", {
      domain: [["id", "=", configId]],
      fields: [
        "id",
        "name",
        "active",
        "company_id",
        "current_session_id",
        "payment_method_ids",
        "pricelist_id",
        "default_fiscal_position_id",
        "cash_control",
        "picking_type_id",
        "cash_rounding",
        "rounding_method",
      ],
      limit: 1,
    });
    if (!Array.isArray(payload) || payload.length !== 1 || !isPOSConfigDetails(payload[0])) {
      throw operationError("Le point de vente n’a pas pu être vérifié.", 404);
    }
    return payload[0];
  }

  private async getLocationStock(
    config: OdooPOSConfigDetails,
    variantIds: number[],
  ): Promise<Map<number, number>> {
    if (!variantIds.length) return new Map();
    if (config.picking_type_id === false) {
      throw operationError("Le type d’opération de stock n’est pas configuré pour cette caisse.");
    }
    const pickingTypePayload: unknown = await callOdoo("stock.picking.type", "search_read", {
      domain: [["id", "=", config.picking_type_id[0]]],
      fields: ["id", "default_location_src_id"],
      limit: 1,
    });
    if (
      !Array.isArray(pickingTypePayload) ||
      pickingTypePayload.length !== 1 ||
      !isOdooPickingType(pickingTypePayload[0]) ||
      pickingTypePayload[0].default_location_src_id === false
    ) {
      throw operationError("L’emplacement de stock de cette caisse n’a pas pu être vérifié.");
    }
    const locationId = pickingTypePayload[0].default_location_src_id[0];
    const quantPayload: unknown = await callOdoo("stock.quant", "search_read", {
      domain: [
        ["product_id", "in", variantIds],
        ["location_id", "child_of", locationId],
      ],
      fields: ["id", "product_id", "location_id", "quantity", "reserved_quantity"],
      limit: 10_001,
    });
    if (
      !Array.isArray(quantPayload) ||
      quantPayload.length > 10_000 ||
      !quantPayload.every(isOdooStockQuant)
    ) {
      throw new OdooApiError("Odoo a renvoyé des niveaux de stock invalides.");
    }
    const stockByVariant = new Map<number, number>();
    for (const quant of quantPayload as OdooStockQuant[]) {
      if (quant.product_id !== false) {
        const variantId = quant.product_id[0];
        stockByVariant.set(
          variantId,
          (stockByVariant.get(variantId) ?? 0) + quant.quantity - quant.reserved_quantity,
        );
      }
    }
    return new Map(
      [...stockByVariant].map(([variantId, quantity]) => [
        variantId,
        Math.max(0, quantity),
      ]),
    );
  }

  private async getPOSSession(sessionId: number): Promise<OdooPOSSessionDetails> {
    const payload: unknown = await callOdoo("pos.session", "search_read", {
      domain: [["id", "=", sessionId]],
      fields: [
        "id",
        "name",
        "state",
        "config_id",
        "user_id",
        "start_at",
        "opening_notes",
        "closing_notes",
        "payment_method_ids",
        "currency_id",
        "cash_register_balance_end",
      ],
      limit: 1,
    });
    if (!Array.isArray(payload) || payload.length !== 1 || !isPOSSessionDetails(payload[0])) {
      throw operationError("La session de caisse n’a pas pu être vérifiée.", 404);
    }
    return payload[0];
  }

  private async getCurrentSession(
    configId: number,
    expectedSessionId?: number,
  ): Promise<{ config: OdooPOSConfigDetails; session: OdooPOSSessionDetails }> {
    const config = await this.getPOSConfig(configId);
    if (config.current_session_id === false) {
      throw operationError("Aucune session n’est actuellement associée à ce point de vente.");
    }
    const sessionId = config.current_session_id[0];
    if (expectedSessionId !== undefined && sessionId !== expectedSessionId) {
      throw operationError("La session a changé. Actualisez la page avant de continuer.");
    }
    const session = await this.getPOSSession(sessionId);
    if (session.config_id === false || session.config_id[0] !== configId) {
      throw operationError("La session ne correspond pas à ce point de vente.");
    }
    return { config, session };
  }

  private assertSessionOwner(session: OdooPOSSessionDetails, employeeId: string): void {
    const marker = getSessionOwnerMarker(employeeId);
    if (typeof session.opening_notes !== "string" || !session.opening_notes.includes(marker)) {
      throw operationError("Cette session de caisse a été ouverte par un autre employé.", 403);
    }
  }

  private async getSessionPaymentMethods(
    session: OdooPOSSessionDetails,
  ): Promise<{ configMethods: OdooPaymentMethod[]; methods: POSPaymentMethod[] }> {
    if (!session.payment_method_ids.length) {
      throw operationError("Aucun moyen de paiement n’est configuré pour cette caisse.");
    }
    const payload: unknown = await callOdoo("pos.payment.method", "search_read", {
      domain: [["id", "in", session.payment_method_ids]],
      fields: ["id", "name", "type", "is_cash_count", "use_payment_terminal", "active"],
      limit: session.payment_method_ids.length,
    });
    if (
      !Array.isArray(payload) ||
      !payload.every(isOdooPaymentMethod) ||
      payload.length !== session.payment_method_ids.length
    ) {
      console.error("[ERP/Odoo] POS payment-method response has an unexpected format.");
      throw new OdooApiError("Les moyens de paiement de la caisse ont renvoyé des données invalides.");
    }
    const configMethods = payload as OdooPaymentMethod[];
    const methods = configMethods
      .filter((method) =>
        method.active &&
        (method.type === "cash" || method.type === "bank")
      )
      .map((method) => ({
        id: method.id,
        name: method.name,
        type: method.type as "cash" | "bank",
        manual: method.use_payment_terminal === false,
      }));
    return { configMethods, methods };
  }

  async openPOSSession(options: {
    configId: number;
    openingAmount: number;
    operationId: string;
    employeeId: string;
  }): Promise<POSSession> {
    const { configId, openingAmount, operationId, employeeId } = options;
    assertValidOperationId(operationId);
    if (!Number.isSafeInteger(configId) || configId < 1) {
      throw operationError("Le point de vente demandé est invalide.", 400);
    }
    if (!Number.isSafeInteger(openingAmount) || openingAmount < 0 || openingAmount > 1_000_000_000) {
      throw operationError("Le montant d’ouverture doit être un nombre entier positif ou nul.", 400);
    }

    const openMarker = `FISAFI_OPEN:${operationId}:AMOUNT:${openingAmount}`;
    const ownerMarker = getSessionOwnerMarker(employeeId);
    const matchingPayload: unknown = await callOdoo("pos.session", "search_read", {
      domain: [
        ["config_id", "=", configId],
        ["opening_notes", "ilike", openMarker],
      ],
      fields: [
        "id",
        "name",
        "state",
        "config_id",
        "user_id",
        "start_at",
        "opening_notes",
        "closing_notes",
        "payment_method_ids",
        "currency_id",
        "cash_register_balance_end",
      ],
      limit: 2,
    });
    if (!Array.isArray(matchingPayload) || !matchingPayload.every(isPOSSessionDetails)) {
      throw new OdooApiError("Odoo a renvoyé une session d’ouverture invalide.");
    }
    if (matchingPayload.length > 1) {
      throw operationError("Plusieurs sessions correspondent à cette demande. Contactez un administrateur.");
    }

    if (matchingPayload.length === 1) {
      const existing = matchingPayload[0];
      if (
        typeof existing.opening_notes !== "string" ||
        !existing.opening_notes.includes(ownerMarker)
      ) {
        throw operationError("La clé d’ouverture est déjà associée à un autre employé.", 409);
      }
      if (existing.state === "opened") return sessionResult(existing);
      if (existing.state !== "opening_control") {
        throw operationError("Cette demande d’ouverture ne correspond plus à une session active.");
      }
      await callOdoo("pos.session", "set_opening_control", {
        ids: [existing.id],
        cashbox_value: openingAmount,
        notes: `${openMarker};${ownerMarker}`,
      });
      const opened = await this.getPOSSession(existing.id);
      if (
        opened.state !== "opened" ||
        typeof opened.opening_notes !== "string" ||
        !opened.opening_notes.includes(ownerMarker)
      ) {
        throw new OdooApiError("Odoo n’a pas confirmé l’ouverture de la caisse.");
      }
      return sessionResult(opened);
    }

    const config = await this.getPOSConfig(configId);
    if (!config.active) throw operationError("Ce point de vente est inactif.", 409);
    if (config.current_session_id !== false) {
      throw operationError("Une session est déjà associée à ce point de vente.");
    }

    await callOdoo("pos.config", "open_ui", {
      ids: [configId],
      context: { default_opening_notes: `${openMarker};${ownerMarker}` },
    });
    const openedConfig = await this.getPOSConfig(configId);
    if (openedConfig.current_session_id === false) {
      throw new OdooApiError("Odoo n’a pas créé de session de caisse.");
    }
    const session = await this.getPOSSession(openedConfig.current_session_id[0]);
    if (
      session.state !== "opening_control" ||
      typeof session.opening_notes !== "string" ||
      !session.opening_notes.includes(openMarker) ||
      !session.opening_notes.includes(ownerMarker)
    ) {
      throw operationError(
        "La session créée n’a pas conservé sa clé d’ouverture. Elle reste non ouverte ; vérifiez-la dans Odoo avant de réessayer.",
      );
    }
    await callOdoo("pos.session", "set_opening_control", {
      ids: [session.id],
      cashbox_value: openingAmount,
      notes: `${openMarker};${ownerMarker}`,
    });
    const verified = await this.getPOSSession(session.id);
    if (
      verified.state !== "opened" ||
      typeof verified.opening_notes !== "string" ||
      !verified.opening_notes.includes(openMarker)
    ) {
      throw new OdooApiError("Odoo n’a pas confirmé l’ouverture de la caisse.");
    }
    return sessionResult(verified);
  }

  async getPOSPaymentMethods(options: {
    configId: number;
    sessionId: number;
    employeeId: string;
  }): Promise<POSPaymentMethod[]> {
    const { config, session } = await this.getCurrentSession(options.configId, options.sessionId);
    if (session.state !== "opened") throw operationError("La caisse n’est pas ouverte.");
    this.assertSessionOwner(session, options.employeeId);
    if (config.default_fiscal_position_id !== false) {
      throw operationError(
        "La position fiscale par défaut de cette caisse n’est pas encore prise en charge par FiSAFi.",
      );
    }
    if (config.cash_rounding) {
      throw operationError(
        "L’arrondi de caisse Odoo est activé. Il doit être pris en charge avant l’encaissement dans FiSAFi.",
      );
    }
    const { methods } = await this.getSessionPaymentMethods(session);
    const manualMethods = methods.filter((method) => method.manual);
    if (manualMethods.length === 0) {
      throw operationError("Aucun moyen de paiement manuel n’est configuré pour cette caisse.");
    }
    return manualMethods;
  }

  private async prepareSale(
    config: OdooPOSConfigDetails,
    session: OdooPOSSessionDetails,
    lines: POSSaleLineInput[],
  ): Promise<{
    currency: OdooCurrency;
    orderLines: Array<Record<string, unknown>>;
    amountTotal: number;
    amountTax: number;
  }> {
    if (config.cash_rounding) {
      throw operationError(
        "L’arrondi de caisse Odoo est activé. Il doit être pris en charge avant l’encaissement dans FiSAFi.",
      );
    }
    if (config.default_fiscal_position_id !== false) {
      throw operationError(
        "La position fiscale par défaut de cette caisse n’est pas encore prise en charge par FiSAFi.",
      );
    }
    if (session.currency_id === false) {
      throw operationError("La devise de la session de caisse n’a pas pu être vérifiée.");
    }
    if (config.pricelist_id === false) {
      throw operationError("Aucune liste de prix n’est configurée pour cette caisse.");
    }

    const pricelistItems: unknown = await callOdoo("product.pricelist.item", "search_read", {
      domain: [["pricelist_id", "=", config.pricelist_id[0]]],
      fields: ["id"],
      limit: 1,
    });
    if (!Array.isArray(pricelistItems) || pricelistItems.length > 0) {
      throw operationError(
        "Cette caisse utilise des règles de prix Odoo. Les ventes sont bloquées plutôt que d’appliquer un prix approximatif.",
      );
    }

    const currencyPayload: unknown = await callOdoo("res.currency", "search_read", {
      domain: [["id", "=", session.currency_id[0]]],
      fields: ["id", "rounding", "decimal_places"],
      limit: 1,
    });
    if (
      !Array.isArray(currencyPayload) ||
      currencyPayload.length !== 1 ||
      !isOdooCurrency(currencyPayload[0])
    ) {
      throw new OdooApiError("La devise de la caisse a renvoyé des données invalides.");
    }
    const currency = currencyPayload[0];
    if (currency.decimal_places !== 0) {
      throw operationError(
        "Cette caisse utilise une devise avec des décimales. Le format de montant FiSAFi doit être configuré avant encaissement.",
      );
    }
    if (config.company_id === false) {
      throw operationError("La société Odoo de cette caisse n’a pas pu être vérifiée.");
    }
    const companyPayload: unknown = await callOdoo("res.company", "search_read", {
      domain: [["id", "=", config.company_id[0]]],
      fields: ["id", "tax_calculation_rounding_method"],
      limit: 1,
    });
    if (
      !Array.isArray(companyPayload) ||
      companyPayload.length !== 1 ||
      !companyPayload[0] ||
      typeof companyPayload[0] !== "object" ||
      !("tax_calculation_rounding_method" in companyPayload[0]) ||
      companyPayload[0].tax_calculation_rounding_method !== "round_per_line"
    ) {
      throw operationError(
        "La méthode d’arrondi des taxes de la société Odoo n’est pas prise en charge par FiSAFi.",
      );
    }

    const variantIds = lines.map((line) => line.variantId);
    const variantsPayload: unknown = await callOdoo("product.product", "search_read", {
      domain: [["id", "in", variantIds]],
      fields: ["id", "product_tmpl_id", "active", "lst_price", "free_qty", "tracking"],
      limit: variantIds.length,
    });
    if (
      !Array.isArray(variantsPayload) ||
      !variantsPayload.every(isOdooSaleProduct) ||
      variantsPayload.length !== variantIds.length
    ) {
      throw operationError("Un produit du panier n’existe plus ou ne peut pas être vérifié.");
    }
    const variants = variantsPayload as OdooSaleProduct[];
    const templateIds = variants.map((variant) =>
      variant.product_tmpl_id === false ? 0 : variant.product_tmpl_id[0]
    );
    if (templateIds.includes(0)) {
      throw operationError("Un produit du panier n’est plus associé à un article.");
    }
    const locationStock = await this.getLocationStock(config, variantIds);
    const templatesPayload: unknown = await callOdoo("product.template", "search_read", {
      domain: [["id", "in", templateIds]],
      fields: ["id", "name", "active", "sale_ok", "available_in_pos", "taxes_id", "uom_name"],
      limit: templateIds.length,
    });
    if (
      !Array.isArray(templatesPayload) ||
      !templatesPayload.every(isOdooSaleTemplate) ||
      templatesPayload.length !== templateIds.length
    ) {
      throw operationError("Un article du panier n’est plus disponible dans cette caisse.");
    }
    const templates = new Map(
      (templatesPayload as OdooSaleTemplate[]).map((template) => [template.id, template]),
    );
    const taxIds = [...new Set(
      (templatesPayload as OdooSaleTemplate[]).flatMap((template) => template.taxes_id),
    )];
    const taxesPayload: unknown = taxIds.length
      ? await callOdoo("account.tax", "search_read", {
          domain: [["id", "in", taxIds]],
          fields: [
            "id",
            "amount",
            "amount_type",
            "price_include",
            "include_base_amount",
            "sequence",
          ],
          limit: taxIds.length,
        })
      : [];
    if (
      !Array.isArray(taxesPayload) ||
      !taxesPayload.every(isOdooTax) ||
      taxesPayload.length !== taxIds.length
    ) {
      throw new OdooApiError("Les taxes des articles ont renvoyé des données invalides.");
    }
    const taxes = new Map((taxesPayload as OdooTax[]).map((tax) => [tax.id, tax]));
    const orderLines: Array<Record<string, unknown>> = [];
    let amountTotal = 0;
    let amountTax = 0;

    for (let index = 0; index < lines.length; index += 1) {
      const input = lines[index];
      const variant = variants.find((candidate) => candidate.id === input.variantId);
      if (!variant || variant.product_tmpl_id === false) {
        throw operationError("Un produit du panier n’a pas pu être retrouvé.");
      }
      const template = templates.get(variant.product_tmpl_id[0]);
      if (
        !template ||
        !variant.active ||
        !template.active ||
        !template.sale_ok ||
        !template.available_in_pos
      ) {
        throw operationError("Un produit du panier n’est plus vendu dans cette caisse.");
      }
      if (variant.tracking !== "none") {
        throw operationError(
          `L’article « ${template.name} » nécessite un suivi de lot ou de numéro de série non pris en charge.`,
        );
      }
      if (input.quantity > (locationStock.get(variant.id) ?? 0)) {
        throw operationError(`Le stock disponible pour « ${template.name} » a changé.`);
      }
      if (template.taxes_id.length > 1) {
        throw operationError(
          `L’article « ${template.name} » utilise plusieurs taxes. Cette configuration doit être vérifiée avant encaissement.`,
        );
      }

      const tax = template.taxes_id.length ? taxes.get(template.taxes_id[0]) : undefined;
      if (
        template.taxes_id.length &&
        (!tax || tax.amount_type !== "percent" || tax.include_base_amount || tax.amount < 0)
      ) {
        throw operationError(
          `La règle de taxe de « ${template.name} » n’est pas prise en charge par le calcul sécurisé FiSAFi.`,
        );
      }

      const grossOrNet = roundToCurrency(variant.lst_price * input.quantity, currency.rounding);
      let subtotal = grossOrNet;
      let subtotalIncl = grossOrNet;
      if (tax) {
        if (tax.price_include) {
          const divisor = 1 + tax.amount / 100;
          if (!Number.isFinite(divisor) || divisor <= 0) {
            throw operationError(`La taxe de « ${template.name} » est invalide.`);
          }
          subtotal = roundToCurrency(grossOrNet / divisor, currency.rounding);
        } else {
          const taxAmount = roundToCurrency(grossOrNet * tax.amount / 100, currency.rounding);
          subtotalIncl = roundToCurrency(grossOrNet + taxAmount, currency.rounding);
        }
      }
      const lineTax = roundToCurrency(subtotalIncl - subtotal, currency.rounding);
      amountTotal = roundToCurrency(amountTotal + subtotalIncl, currency.rounding);
      amountTax = roundToCurrency(amountTax + lineTax, currency.rounding);
      orderLines.push({
        id: index + 1,
        uuid: `${lines[index].variantId}-${index}`,
        product_id: variant.id,
        qty: input.quantity,
        price_unit: variant.lst_price,
        discount: 0,
        price_subtotal: subtotal,
        price_subtotal_incl: subtotalIncl,
        tax_ids: [[6, 0, template.taxes_id]],
        pack_lot_ids: [],
      });
    }

    return { currency, orderLines, amountTotal, amountTax };
  }

  async quotePOSSale(options: {
    configId: number;
    sessionId: number;
    employeeId: string;
    lines: POSSaleLineInput[];
  }): Promise<POSSaleQuote> {
    if (
      !Array.isArray(options.lines) ||
      options.lines.length === 0 ||
      options.lines.length > MAX_LINES_PER_SALE ||
      options.lines.some((line) =>
        !Number.isSafeInteger(line.variantId) ||
        line.variantId < 1 ||
        !Number.isSafeInteger(line.quantity) ||
        line.quantity < 1 ||
        line.quantity > 10_000
      ) ||
      new Set(options.lines.map((line) => line.variantId)).size !== options.lines.length
    ) {
      throw operationError("Les articles du panier sont invalides.", 400);
    }
    const { config, session } = await this.getCurrentSession(options.configId, options.sessionId);
    if (session.state !== "opened") throw operationError("La caisse n’est pas ouverte.");
    this.assertSessionOwner(session, options.employeeId);
    const { amountTotal, amountTax } = await this.prepareSale(config, session, options.lines);
    return { amountTotal, amountTax };
  }

  async createPOSSale(options: {
    configId: number;
    sessionId: number;
    operationId: string;
    employeeId: string;
    lines: POSSaleLineInput[];
    paymentMethodId: number;
    amountReceived: number;
  }): Promise<POSSaleResult> {
    const {
      configId,
      sessionId,
      operationId,
      employeeId,
      lines,
      paymentMethodId,
      amountReceived,
    } = options;
    assertValidOperationId(operationId);
    if (
      !Number.isSafeInteger(sessionId) ||
      sessionId < 1 ||
      !Number.isSafeInteger(paymentMethodId) ||
      paymentMethodId < 1 ||
      !Number.isSafeInteger(amountReceived) ||
      amountReceived < 0 ||
      amountReceived > 1_000_000_000 ||
      !Array.isArray(lines) ||
      lines.length === 0 ||
      lines.length > MAX_LINES_PER_SALE ||
      lines.some((line) =>
        !Number.isSafeInteger(line.variantId) ||
        line.variantId < 1 ||
        !Number.isSafeInteger(line.quantity) ||
        line.quantity < 1 ||
        line.quantity > 10_000
      ) ||
      new Set(lines.map((line) => line.variantId)).size !== lines.length
    ) {
      throw operationError("Les données de vente sont invalides.", 400);
    }

    const config = await this.getPOSConfig(configId);
    const session = await this.getPOSSession(sessionId);
    if (session.config_id === false || session.config_id[0] !== configId) {
      throw operationError("La session ne correspond pas à ce point de vente.");
    }
    this.assertSessionOwner(session, employeeId);
    const fingerprint = digestPayload({
      employeeId,
      sessionId,
      lines: lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
      paymentMethodId,
      amountReceived,
    });
    const orderMarker = `FISAFI_ORDER:${employeeId}:${operationId}:${fingerprint};`;

    const readExistingOrder = async (): Promise<OdooPOSOrder | null> => {
      const payload: unknown = await callOdoo("pos.order", "search_read", {
        domain: [["uuid", "=", operationId]],
        fields: [
          "id",
          "name",
          "uuid",
          "state",
          "amount_total",
          "amount_tax",
          "amount_paid",
          "session_id",
          "internal_note",
        ],
        limit: 2,
      });
      if (!Array.isArray(payload) || !payload.every(isPOSOrder)) {
        throw new OdooApiError("Odoo a renvoyé une vente POS invalide.");
      }
      if (payload.length > 1) {
        throw operationError("La clé de vente est associée à plusieurs commandes.");
      }
      return payload.length ? payload[0] : null;
    };

    const existing = await readExistingOrder();
    if (existing) {
      return this.resultFromExistingOrder(existing, orderMarker, sessionId, amountReceived);
    }
    if (session.state !== "opened") throw operationError("La caisse n’est pas ouverte.");
    if (
      config.current_session_id === false ||
      config.current_session_id[0] !== sessionId
    ) {
      throw operationError("La session a changé. Actualisez la page avant de continuer.");
    }
    const { configMethods, methods } = await this.getSessionPaymentMethods(session);
    const paymentMethod = methods.find((method) => method.id === paymentMethodId);
    const odooPaymentMethod = configMethods.find((method) => method.id === paymentMethodId);
    if (!paymentMethod || !odooPaymentMethod || odooPaymentMethod.use_payment_terminal !== false) {
      throw operationError("Ce moyen de paiement n’est pas disponible dans la caisse.");
    }

    const prepared = await this.prepareSale(config, session, lines);
    if (amountReceived < prepared.amountTotal) {
      throw operationError("Le montant reçu ne couvre pas le total de la vente.", 400);
    }
    if (paymentMethod.type !== "cash" && amountReceived !== prepared.amountTotal) {
      throw operationError("Le montant reçu doit être égal au total pour ce moyen de paiement.", 400);
    }
    const change = roundToCurrency(
      amountReceived - prepared.amountTotal,
      prepared.currency.rounding,
    );
    const internalNote =
      `${orderMarker}RECEIVED:${amountReceived};CHANGE:${change}`;

    const paymentDate = normalizeOdooDate(new Date());
    await callOdoo("pos.order", "sync_from_ui", {
      orders: [{
        uuid: operationId,
        name: `FiSAFi ${operationId}`,
        session_id: session.id,
        user_id: session.user_id === false ? undefined : session.user_id[0],
        pricelist_id: config.pricelist_id === false ? undefined : config.pricelist_id[0],
        fiscal_position_id: false,
        partner_id: false,
        date_order: paymentDate,
        amount_total: prepared.amountTotal,
        amount_tax: prepared.amountTax,
        amount_paid: prepared.amountTotal,
        amount_return: 0,
        lines: prepared.orderLines.map((line) => [
          0,
          0,
          {
            ...line,
            uuid: `${operationId}-line-${String(line.id)}`,
          },
        ]),
        payment_ids: [[
          0,
          0,
          {
            uuid: `${operationId}-payment`,
            name: paymentDate,
            payment_date: paymentDate,
            payment_method_id: paymentMethodId,
            amount: prepared.amountTotal,
          },
        ]],
        last_order_preparation_change: "{}",
        internal_note: internalNote,
        general_customer_note: "",
        to_invoice: false,
      }],
    });

    const created = await readExistingOrder();
    if (!created) {
      throw new OdooApiError("Odoo n’a pas confirmé l’enregistrement de la vente.");
    }
    return this.resultFromExistingOrder(created, orderMarker, sessionId, amountReceived);
  }

  private resultFromExistingOrder(
    order: OdooPOSOrder,
    orderMarker: string,
    sessionId: number,
    amountReceived: number,
  ): POSSaleResult {
    if (
      typeof order.internal_note !== "string" ||
      !order.internal_note.startsWith(orderMarker) ||
      order.session_id === false ||
      order.session_id[0] !== sessionId
    ) {
      throw operationError("Cette clé de vente a déjà été utilisée avec d’autres données.", 409);
    }
    const changeMatch = /(?:^|;)CHANGE:(\d+(?:\.\d+)?)$/.exec(order.internal_note);
    const receivedMatch = /(?:^|;)RECEIVED:(\d+(?:\.\d+)?);CHANGE:\d+(?:\.\d+)?$/.exec(order.internal_note);
    if (
      !changeMatch ||
      !receivedMatch ||
      Number(receivedMatch[1]) !== amountReceived ||
      !Number.isFinite(Number(changeMatch[1])) ||
      Number(changeMatch[1]) < 0
    ) {
      throw operationError("La vente existante ne correspond pas à la demande d’encaissement.", 409);
    }
    if (!["paid", "done", "invoiced"].includes(order.state)) {
      throw operationError(
        "Une commande portant cette clé existe mais n’est pas confirmée. Vérifiez-la dans Odoo avant de réessayer.",
        409,
      );
    }
    return {
      orderId: order.id,
      reference: order.name,
      amountTotal: order.amount_total,
      amountTax: order.amount_tax,
      amountReceived,
      change: Number(changeMatch[1]),
    };
  }

  private async getClosingSummary(
    config: OdooPOSConfigDetails,
    session: OdooPOSSessionDetails,
  ): Promise<POSClosingSummary> {
    if (session.currency_id === false) {
      throw operationError("La devise de la session de caisse n’a pas pu être vérifiée.");
    }
    const currencyPayload: unknown = await callOdoo("res.currency", "search_read", {
      domain: [["id", "=", session.currency_id[0]]],
      fields: ["id", "rounding", "decimal_places"],
      limit: 1,
    });
    if (
      !Array.isArray(currencyPayload) ||
      currencyPayload.length !== 1 ||
      !isOdooCurrency(currencyPayload[0]) ||
      currencyPayload[0].decimal_places !== 0
    ) {
      throw operationError(
        "La devise de cette caisse ne correspond pas au format de comptage utilisé par FiSAFi.",
      );
    }
    const { configMethods, methods } = await this.getSessionPaymentMethods(session);
    const cashMethods = configMethods.filter((method) => method.active && method.is_cash_count);
    if (cashMethods.length > 1) {
      throw operationError(
        "Cette caisse utilise plusieurs journaux espèces. La clôture FiSAFi doit être configurée pour cette caisse.",
      );
    }

    const ordersPayload: unknown = await callOdoo("pos.order", "search_read", {
      domain: [["session_id", "=", session.id]],
      fields: ["id", "state", "payment_ids"],
      limit: MAX_ORDERS_PER_SESSION + 1,
    });
    if (
      !Array.isArray(ordersPayload) ||
      ordersPayload.length > MAX_ORDERS_PER_SESSION ||
      !ordersPayload.every(isPOSOrderSummary)
    ) {
      throw operationError(
        "La caisse contient trop de commandes pour une clôture FiSAFi ou les données sont invalides.",
      );
    }
    const paymentIds = [...new Set(
      (ordersPayload as OdooPOSOrderSummary[]).flatMap((order) => order.payment_ids),
    )];
    const paymentsPayload: unknown = paymentIds.length
      ? await callOdoo("pos.payment", "search_read", {
          domain: [["id", "in", paymentIds]],
          fields: ["id", "amount", "payment_method_id", "is_change"],
          limit: paymentIds.length,
        })
      : [];
    if (
      !Array.isArray(paymentsPayload) ||
      !paymentsPayload.every(isPOSPayment) ||
      paymentsPayload.length !== paymentIds.length
    ) {
      throw new OdooApiError("Odoo n’a pas renvoyé les paiements de caisse attendus.");
    }

    const bankExpected = new Map<number, number>();
    for (const payment of paymentsPayload as OdooPOSPayment[]) {
      if (payment.payment_method_id === false || payment.is_change) continue;
      const methodId = payment.payment_method_id[0];
      if (methods.some((method) => method.id === methodId && method.type === "bank")) {
        bankExpected.set(methodId, (bankExpected.get(methodId) ?? 0) + payment.amount);
      }
    }
    const resultMethods: POSClosingMethod[] = methods.map((method) => ({
      ...method,
      expectedAmount: method.type === "cash"
        ? session.cash_register_balance_end
        : bankExpected.get(method.id) ?? 0,
    }));
    return {
      sessionId: session.id,
      cashControl: config.cash_control,
      methods: resultMethods,
    };
  }

  async getPOSClosingSummary(options: {
    configId: number;
    sessionId: number;
    employeeId: string;
  }): Promise<POSClosingSummary> {
    const { config, session } = await this.getCurrentSession(options.configId, options.sessionId);
    this.assertSessionOwner(session, options.employeeId);
    if (session.state !== "opened" && session.state !== "closing_control") {
      throw operationError("La session n’est pas dans un état qui permet la clôture.");
    }
    return this.getClosingSummary(config, session);
  }

  async closePOSSession(options: {
    configId: number;
    sessionId: number;
    operationId: string;
    employeeId: string;
    countedAmounts: Record<number, number>;
  }): Promise<POSSession> {
    const { configId, sessionId, operationId, employeeId, countedAmounts } = options;
    assertValidOperationId(operationId);
    if (
      !Number.isSafeInteger(sessionId) ||
      sessionId < 1 ||
      !countedAmounts ||
      typeof countedAmounts !== "object"
    ) {
      throw operationError("Les données de clôture sont invalides.", 400);
    }
    const config = await this.getPOSConfig(configId);
    const session = await this.getPOSSession(sessionId);
    if (session.config_id === false || session.config_id[0] !== configId) {
      throw operationError("La session ne correspond pas à ce point de vente.");
    }
    this.assertSessionOwner(session, employeeId);
    if (session.state === "closed") {
      const expectedFingerprint = digestPayload(
        Object.fromEntries(
          Object.entries(countedAmounts)
            .map(([id, amount]) => [Number(id), amount] as const)
            .sort(([left], [right]) => left - right),
        ),
      );
      const expectedMarker = `FISAFI_CLOSE:${employeeId}:${operationId}:${expectedFingerprint}`;
      if (
        typeof session.closing_notes === "string" &&
        session.closing_notes.includes(expectedMarker)
      ) {
        return sessionResult(session);
      }
      throw operationError("Cette caisse a déjà été clôturée avec une autre demande.");
    }
    if (
      session.state !== "opened" &&
      session.state !== "closing_control"
    ) {
      throw operationError("La session n’est pas ouverte ou ne peut pas être clôturée.");
    }
    if (
      config.current_session_id === false ||
      config.current_session_id[0] !== sessionId
    ) {
      throw operationError("La session a changé. Actualisez la page avant de continuer.");
    }
    const summary = await this.getClosingSummary(config, session);
    const methodIds = summary.methods
      .filter((method) => method.type === "bank" || summary.cashControl)
      .map((method) => method.id);
    const suppliedIds = Object.keys(countedAmounts).map(Number).sort((a, b) => a - b);
    const expectedIds = [...methodIds].sort((a, b) => a - b);
    if (
      suppliedIds.length !== expectedIds.length ||
      suppliedIds.some((id, index) => id !== expectedIds[index]) ||
      suppliedIds.some((id) =>
        !Number.isSafeInteger(countedAmounts[id]) ||
        countedAmounts[id] < 0 ||
        countedAmounts[id] > 1_000_000_000
      )
    ) {
      throw operationError("Les montants comptés ne correspondent pas aux moyens de paiement de la caisse.", 400);
    }
    const fingerprint = digestPayload(
      Object.fromEntries(suppliedIds.map((id) => [id, countedAmounts[id]])),
    );
    const closingMarker = `FISAFI_CLOSE:${employeeId}:${operationId}:${fingerprint}`;

    const bankDiffs = summary.methods
      .filter((method) => method.type === "bank")
      .map((method) => [
        method.id,
        countedAmounts[method.id] - method.expectedAmount,
      ]);
    if (session.state === "opened") {
      if (summary.cashControl) {
        const cashMethod = summary.methods.find((method) => method.type === "cash");
        if (!cashMethod) {
          throw operationError("Aucun moyen de paiement espèces n’est configuré pour cette caisse.");
        }
        const cashResult: unknown = await callOdoo(
          "pos.session",
          "post_closing_cash_details",
          {
            ids: [sessionId],
            counted_cash: countedAmounts[cashMethod.id],
          },
        );
        if (
          !cashResult ||
          typeof cashResult !== "object" ||
          !("successful" in cashResult) ||
          cashResult.successful !== true
        ) {
          throw operationError("Odoo a refusé le comptage de caisse. Vérifiez les commandes en attente.");
        }
      }
      await callOdoo("pos.session", "update_closing_control_state_session", {
        ids: [sessionId],
        notes: closingMarker,
      });
    } else if (session.closing_notes !== closingMarker) {
      throw operationError("La clôture a déjà commencé avec une autre clé ou un autre comptage.");
    }

    const closeResult: unknown = await callOdoo("pos.session", "close_session_from_ui", {
      ids: [sessionId],
      bank_payment_method_diff_pairs: bankDiffs,
    });
    if (
      !closeResult ||
      typeof closeResult !== "object" ||
      !("successful" in closeResult) ||
      closeResult.successful !== true
    ) {
      throw operationError(
        "Odoo n’a pas clôturé la caisse. Des commandes, écarts ou contrôles restent à traiter dans Odoo.",
      );
    }
    const closed = await this.getPOSSession(sessionId);
    if (closed.state !== "closed" || closed.closing_notes !== closingMarker) {
      throw new OdooApiError("Odoo n’a pas confirmé la clôture de la caisse.");
    }
    return sessionResult(closed);
  }
}
