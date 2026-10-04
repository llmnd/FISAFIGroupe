import type { NextApiRequest, NextApiResponse } from "next";
import { callOdoo, getTemplateStock, OdooApiError } from "@/lib/marketOdoo";
import { authenticateMarketUser, MarketAuthError } from "@/lib/marketAuth";
import { prisma } from "@/backend/lib/db";
import { emailService } from "@/backend/services/emailService";

type OrderRequest = {
  customerName: string;
  phone: string;
  address: string;
  fulfillment: "delivery" | "pickup";
  note: string;
  items: Array<{ productId: number; quantity: number }>;
};

type ProductTemplate = {
  id: number;
  name: string;
  list_price: number;
};

type OdooPartner = { id: number };
type OdooOrder = {
  id: number;
  name: string;
  amount_total: number;
  state: MarketOrderStatus;
  date_order: string;
  order_line: number[];
};

type OdooOrderLine = {
  id: number;
  order_id: [number, string];
  product_id: [number, string] | false;
  product_uom_qty: number;
  price_unit: number;
  price_subtotal: number;
};

type OdooVariantTemplate = {
  id: number;
  product_tmpl_id: [number, string];
};

type OdooProductTemplateDetails = {
  id: number;
  categ_id: [number, string] | false;
  uom_name: string;
};

type MarketOrderStatus = "draft" | "sent" | "sale" | "done" | "cancel";
type QuotationItem = {
  id: number;
  productId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  imageUrl: string | null;
  categoryName: string | null;
  unitName: string;
};
type ApiResponse = {
  orderReference?: string;
  total?: number;
  orders?: Array<{
    id: number;
    reference: string;
    state: MarketOrderStatus;
    statusLabel: string;
    amountTotal: number;
    date: string;
    items: QuotationItem[];
  }>;
  emailVerified?: boolean;
  error?: string;
};

type MarketAccount = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  emailVerifiedAt: Date | null;
  odooPartnerId: number | null;
};

const MAX_ORDER_LINES = 30;
const MAX_QUANTITY = 99;

function isOrderRequest(value: unknown): value is OrderRequest {
  if (!value || typeof value !== "object") return false;
  const order = value as Partial<OrderRequest>;
  return (
    typeof order.customerName === "string" &&
    order.customerName.trim().length >= 2 &&
    order.customerName.trim().length <= 120 &&
    typeof order.phone === "string" &&
    order.phone.replace(/\D/g, "").length >= 9 &&
    order.phone.replace(/\D/g, "").length <= 15 &&
    typeof order.address === "string" &&
    order.address.length <= 500 &&
    (order.fulfillment === "delivery" || order.fulfillment === "pickup") &&
    typeof order.note === "string" &&
    order.note.length <= 300 &&
    Array.isArray(order.items) &&
    order.items.length > 0 &&
    order.items.length <= MAX_ORDER_LINES &&
    order.items.every(
      (item) =>
        item !== null &&
        typeof item === "object" &&
        Number.isSafeInteger(item.productId) &&
        item.productId > 0 &&
        typeof item.quantity === "number" &&
        Number.isFinite(item.quantity) &&
        item.quantity > 0 &&
        item.quantity <= MAX_QUANTITY,
    ) &&
    (order.fulfillment !== "delivery" || order.address.trim().length >= 6)
  );
}

function isProductTemplate(value: unknown): value is ProductTemplate {
  if (!value || typeof value !== "object") return false;
  const product = value as Partial<ProductTemplate>;
  return (
    Number.isSafeInteger(product.id) &&
    typeof product.name === "string" &&
    typeof product.list_price === "number" &&
    Number.isFinite(product.list_price) &&
    product.list_price >= 0
  );
}

function isPartner(value: unknown): value is OdooPartner {
  if (!value || typeof value !== "object" || !("id" in value)) return false;
  return typeof value.id === "number" && Number.isSafeInteger(value.id) && value.id > 0;
}

function getCreatedId(value: unknown): number | null {
  if (Number.isSafeInteger(value) && Number(value) > 0) return Number(value);
  if (
    Array.isArray(value) &&
    value.length === 1 &&
    Number.isSafeInteger(value[0]) &&
    value[0] > 0
  ) {
    return value[0];
  }
  return null;
}

function isOdooOrder(value: unknown): value is OdooOrder {
  if (!value || typeof value !== "object") return false;
  const order = value as Partial<OdooOrder>;
  return (
    Number.isSafeInteger(order.id) &&
    typeof order.name === "string" &&
    typeof order.amount_total === "number" &&
    Number.isFinite(order.amount_total) &&
    isMarketOrderStatus(order.state) &&
    typeof order.date_order === "string" &&
    Array.isArray(order.order_line) &&
    order.order_line.every((lineId) => Number.isSafeInteger(lineId) && lineId > 0)
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
    (line.product_id === false ||
      (Array.isArray(line.product_id) &&
        Number.isSafeInteger(line.product_id[0]) &&
        typeof line.product_id[1] === "string")) &&
    typeof line.product_uom_qty === "number" &&
    Number.isFinite(line.product_uom_qty) &&
    typeof line.price_unit === "number" &&
    Number.isFinite(line.price_unit) &&
    typeof line.price_subtotal === "number" &&
    Number.isFinite(line.price_subtotal)
  );
}

function isOdooVariantTemplate(value: unknown): value is OdooVariantTemplate {
  if (!value || typeof value !== "object") return false;
  const variant = value as Partial<OdooVariantTemplate>;
  return (
    Number.isSafeInteger(variant.id) &&
    Array.isArray(variant.product_tmpl_id) &&
    Number.isSafeInteger(variant.product_tmpl_id[0]) &&
    typeof variant.product_tmpl_id[1] === "string"
  );
}

function isOdooProductTemplateDetails(value: unknown): value is OdooProductTemplateDetails {
  if (!value || typeof value !== "object") return false;
  const product = value as Partial<OdooProductTemplateDetails>;
  return (
    Number.isSafeInteger(product.id) &&
    (product.categ_id === false ||
      (Array.isArray(product.categ_id) &&
        Number.isSafeInteger(product.categ_id[0]) &&
        typeof product.categ_id[1] === "string")) &&
    typeof product.uom_name === "string"
  );
}

const STATUS_LABELS: Record<MarketOrderStatus, string> = {
  draft: "En attente de validation",
  sent: "Devis envoyé par le vendeur",
  sale: "Confirmé",
  done: "Terminé",
  cancel: "Annulé",
};

function isMarketOrderStatus(value: unknown): value is MarketOrderStatus {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(STATUS_LABELS, value)
  );
}

async function getCustomerOrders(
  res: NextApiResponse<ApiResponse>,
  user: MarketAccount,
) {
  try {
    const quotations = await prisma.marketQuotation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    if (quotations.length === 0) {
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ orders: [], emailVerified: Boolean(user.emailVerifiedAt) });
    }

    const ids = quotations.map((quotation) => quotation.odooOrderId);
    const payload: unknown = await callOdoo("sale.order", "search_read", {
      domain: [["id", "in", ids]],
      fields: ["id", "name", "state", "amount_total", "date_order", "order_line"],
      limit: ids.length,
      order: "date_order desc",
    });
    if (
      !Array.isArray(payload) ||
      !payload.every(isOdooOrder) ||
      payload.some((order) => !ids.includes(order.id))
    ) {
      console.error("[Market/Odoo] Customer quotation response has an unexpected format.");
      throw new OdooApiError("Odoo a renvoyé des données de devis invalides.");
    }

    const orderLineIds = [...new Set(payload.flatMap((order) => order.order_line))];
    const linePayload: unknown = orderLineIds.length
      ? await callOdoo("sale.order.line", "search_read", {
          domain: [["id", "in", orderLineIds]],
          fields: ["id", "order_id", "product_id", "product_uom_qty", "price_unit", "price_subtotal"],
          limit: orderLineIds.length,
        })
      : [];
    if (
      !Array.isArray(linePayload) ||
      !linePayload.every(isOdooOrderLine) ||
      linePayload.some((line) => !orderLineIds.includes(line.id))
    ) {
      console.error("[Market/Odoo] Quotation line response has an unexpected format.");
      throw new OdooApiError("Odoo a renvoyé des lignes de devis invalides.");
    }

    const productLines = linePayload.filter(
      (line): line is OdooOrderLine & { product_id: [number, string] } =>
        line.product_id !== false,
    );
    const productIds = [...new Set(productLines.map((line) => line.product_id[0]))];
    const variantPayload: unknown = productIds.length
      ? await callOdoo("product.product", "search_read", {
          domain: [["id", "in", productIds]],
          fields: ["id", "product_tmpl_id"],
          limit: productIds.length,
        })
      : [];
    if (
      !Array.isArray(variantPayload) ||
      !variantPayload.every(isOdooVariantTemplate) ||
      variantPayload.some((variant) => !productIds.includes(variant.id))
    ) {
      console.error("[Market/Odoo] Quotation product response has an unexpected format.");
      throw new OdooApiError("Odoo a renvoyé des produits de devis invalides.");
    }

    const templateByVariantId = new Map(
      variantPayload.map((variant) => [variant.id, variant.product_tmpl_id[0]]),
    );
    const templateIds = [...new Set(variantPayload.map((variant) => variant.product_tmpl_id[0]))];
    const templatePayload: unknown = templateIds.length
      ? await callOdoo("product.template", "search_read", {
          domain: [["id", "in", templateIds]],
          fields: ["id", "categ_id", "uom_name"],
          limit: templateIds.length,
        })
      : [];
    if (
      !Array.isArray(templatePayload) ||
      !templatePayload.every(isOdooProductTemplateDetails) ||
      templatePayload.some((product) => !templateIds.includes(product.id))
    ) {
      console.error("[Market/Odoo] Quotation product template response has an unexpected format.");
      throw new OdooApiError("Odoo a renvoyé des catégories de produits invalides.");
    }
    const templateById = new Map(templatePayload.map((product) => [product.id, product]));
    const linesByOrderId = new Map<number, QuotationItem[]>();
    for (const line of productLines) {
      const orderId = line.order_id[0];
      if (!ids.includes(orderId)) {
        console.error("[Market/Odoo] Quotation line belongs to an unexpected order.");
        throw new OdooApiError("Odoo a renvoyé des lignes de devis invalides.");
      }
      const templateId = templateByVariantId.get(line.product_id[0]);
      const template = templateId ? templateById.get(templateId) : undefined;
      if (!templateId || !template) {
        console.error("[Market/Odoo] A quotation line references a missing product template.");
        throw new OdooApiError("Un produit de ce devis n’est plus disponible dans Odoo.");
      }
      const orderItems = linesByOrderId.get(orderId) ?? [];
      orderItems.push({
        id: line.id,
        productId: templateId,
        name: line.product_id[1],
        quantity: line.product_uom_qty,
        unitPrice: line.price_unit,
        subtotal: line.price_subtotal,
        imageUrl: `/api/market/products/${templateId}/image`,
        categoryName: template.categ_id ? template.categ_id[1] : null,
        unitName: template.uom_name,
      });
      linesByOrderId.set(orderId, orderItems);
    }

    const quotationById = new Map(quotations.map((quotation) => [quotation.odooOrderId, quotation]));
    const orders = await Promise.all(payload.map(async (order) => {
      const previous = quotationById.get(order.id);
      if (previous && previous.state !== order.state) {
        const update = await prisma.marketQuotation.updateMany({
          where: { id: previous.id, state: previous.state },
          data: { state: order.state, amountTotal: order.amount_total },
        });
        if (update.count === 1 && user.emailVerifiedAt && isMarketOrderStatus(order.state)) {
          const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email;
          const sent = await emailService.sendMarketQuotationStatus(
            user.email,
            fullName,
            order.name,
            STATUS_LABELS[order.state],
            order.amount_total,
          );
          if (!sent) {
            console.error(`[Market] Status email for quotation ${order.name} was not delivered.`);
          }
        }
      } else if (previous && previous.amountTotal !== order.amount_total) {
        await prisma.marketQuotation.updateMany({
          where: { id: previous.id, state: previous.state },
          data: { amountTotal: order.amount_total },
        });
      }
      return {
        id: order.id,
        reference: order.name,
        state: order.state,
        statusLabel: STATUS_LABELS[order.state],
        amountTotal: order.amount_total,
        date: order.date_order || previous?.createdAt.toISOString() || "",
        items: linesByOrderId.get(order.id) ?? [],
      };
    }));

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      orders: orders.sort((left, right) => right.date.localeCompare(left.date)),
      emailVerified: Boolean(user.emailVerifiedAt),
    });
  } catch (error) {
    if (error instanceof OdooApiError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("[Market] Could not load customer quotations:", error);
    return res.status(502).json({ error: "Impossible de charger vos devis pour le moment." });
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  if (req.method !== "POST" && req.method !== "GET") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  let account;
  try {
    account = await authenticateMarketUser(req);
  } catch (error) {
    if (error instanceof MarketAuthError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("[Market/Auth] Unexpected account authentication error:", error);
    return res.status(502).json({ error: "Impossible de vérifier votre compte." });
  }

  let user: MarketAccount | null;
  try {
    user = await prisma.user.findUnique({
      where: { id: account.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        emailVerifiedAt: true,
        odooPartnerId: true,
      },
    });
  } catch (error) {
    console.error("[Market/DB] Could not load the authenticated account:", error);
    return res.status(503).json({ error: "Le service de commande est temporairement indisponible." });
  }
  if (!user || user.email.toLowerCase() !== account.email.toLowerCase()) {
    return res.status(401).json({ error: "Votre compte n’est plus disponible. Connectez-vous à nouveau." });
  }

  if (req.method === "GET") {
    return getCustomerOrders(res, user);
  }

  if (!isOrderRequest(req.body)) {
    return res.status(400).json({ error: "Vérifiez les coordonnées et les produits de votre commande." });
  }

  const requestedItems = new Map<number, number>();
  for (const item of req.body.items) {
    requestedItems.set(
      item.productId,
      (requestedItems.get(item.productId) ?? 0) + item.quantity,
    );
  }
  if ([...requestedItems.values()].some((quantity) => quantity > MAX_QUANTITY)) {
    return res.status(400).json({ error: "La quantité demandée dépasse la limite autorisée." });
  }

  try {
    const productIds = [...requestedItems.keys()];
    const templates: unknown = await callOdoo("product.template", "search_read", {
      domain: [
        ["id", "in", productIds],
        ["active", "=", true],
        ["sale_ok", "=", true],
        ["available_in_pos", "=", true],
      ],
      fields: ["id", "name", "list_price"],
      limit: MAX_ORDER_LINES,
    });

    if (!Array.isArray(templates) || !templates.every(isProductTemplate)) {
      console.error("[Market/Odoo] Order product response has an unexpected format.");
      throw new OdooApiError("Odoo a renvoyé des données produit invalides.");
    }
    if (templates.length !== productIds.length) {
      return res.status(409).json({
        error: "Un produit de votre panier n’est plus disponible dans le catalogue. Actualisez le marché puis réessayez.",
      });
    }

    const stockByTemplate = await getTemplateStock(productIds);
    const variants = new Map<number, number>();
    for (const productId of productIds) {
      const stock = stockByTemplate.get(productId);
      if (!stock || stock.variants.length !== 1) {
        return res.status(409).json({
          error: "Un produit de votre panier nécessite un choix de variante. Contactez FiSAFi pour finaliser cette demande.",
        });
      }
      variants.set(productId, stock.variants[0].id);
    }

    const productsById = new Map(templates.map((product) => [product.id, product]));
    const unavailable = productIds
      .map((productId) => {
        const product = productsById.get(productId);
        const quantity = requestedItems.get(productId) ?? 0;
        const available = stockByTemplate.get(productId)?.availableQuantity ?? 0;
        return product && available < quantity
          ? `${product.name} (disponible : ${available})`
          : null;
      })
      .filter((name): name is string => name !== null);

    if (unavailable.length > 0) {
      return res.status(409).json({
        error: `Stock insuffisant pour : ${unavailable.join(", ")}. Modifiez votre panier puis réessayez.`,
      });
    }

    const phone = req.body.phone.trim();
    let partnerId = user.odooPartnerId;
    if (!partnerId) {
      const partnerResult: unknown = await callOdoo("res.partner", "create", {
        vals_list: [{
          name: req.body.customerName.trim(),
          phone,
          customer_rank: 1,
          ...(user.emailVerifiedAt ? { email: user.email } : {}),
        }],
      });
      partnerId = getCreatedId(partnerResult) ?? 0;
      if (!partnerId) {
        console.error("[Market/Odoo] Customer creation returned an unexpected response.");
        throw new OdooApiError("Odoo n’a pas pu enregistrer la fiche client.");
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { odooPartnerId: partnerId },
      });
    } else {
      await callOdoo("res.partner", "write", {
        ids: [partnerId],
        vals: {
          name: req.body.customerName.trim(),
          phone,
          ...(user.emailVerifiedAt ? { email: user.email } : {}),
        },
      });
    }
    if (!partnerId) {
      throw new OdooApiError("Odoo n’a pas pu retrouver la fiche client.");
    }
    const customerPartnerId = partnerId;

    const fulfillmentNote = req.body.fulfillment === "delivery"
      ? `Livraison demandée à Dakar. Adresse : ${req.body.address.trim()}`
      : "Retrait en magasin demandé.";
    const orderNote = [
      "Demande reçue depuis FiSAFi Market. À vérifier et confirmer par le vendeur.",
      fulfillmentNote,
      req.body.note.trim() ? `Précision client : ${req.body.note.trim()}` : "",
    ].filter(Boolean).join("\n");
    let deliveryPartnerId = customerPartnerId;
    if (req.body.fulfillment === "delivery") {
      const deliveryPartners: unknown = await callOdoo("res.partner", "search_read", {
        domain: [
          ["parent_id", "=", customerPartnerId],
          ["type", "=", "delivery"],
          ["street", "=", req.body.address.trim()],
        ],
        fields: ["id"],
        limit: 1,
      });
      if (!Array.isArray(deliveryPartners) || !deliveryPartners.every(isPartner)) {
        console.error("[Market/Odoo] Delivery contact response has an unexpected format.");
        throw new OdooApiError("Odoo n’a pas renvoyé une adresse de livraison valide.");
      }
      deliveryPartnerId = deliveryPartners[0]?.id ?? 0;
      if (!deliveryPartnerId) {
        const deliveryPartnerResult: unknown = await callOdoo("res.partner", "create", {
          vals_list: [{
            name: req.body.customerName.trim(),
            type: "delivery",
            parent_id: customerPartnerId,
            phone,
            street: req.body.address.trim(),
            city: "Dakar",
          }],
        });
        deliveryPartnerId = getCreatedId(deliveryPartnerResult) ?? 0;
        if (!deliveryPartnerId) {
          console.error("[Market/Odoo] Delivery contact creation returned an unexpected response.");
          throw new OdooApiError("Odoo n’a pas pu enregistrer l’adresse de livraison.");
        }
      }
    }

    const orderLines: unknown[] = productIds.map((productId) => [
      0,
      0,
      {
        product_id: variants.get(productId),
        product_uom_qty: requestedItems.get(productId),
      },
    ]);
    orderLines.push([0, 0, { display_type: "line_note", name: orderNote }]);
    const createResult: unknown = await callOdoo("sale.order", "create", {
      vals_list: [{
        partner_id: customerPartnerId,
        partner_shipping_id: deliveryPartnerId,
        client_order_ref: "FiSAFi Market",
        order_line: orderLines,
      }],
    });
    const orderId = getCreatedId(createResult);
    if (!orderId) {
      console.error("[Market/Odoo] Quotation creation returned an unexpected response.");
      throw new OdooApiError("Odoo n’a pas pu créer le devis.");
    }

    const createdOrders: unknown = await callOdoo("sale.order", "search_read", {
      domain: [["id", "=", orderId]],
      fields: ["id", "name", "amount_total", "state", "date_order"],
      limit: 1,
    });
    if (!Array.isArray(createdOrders) || !createdOrders.every(isOdooOrder) || !createdOrders[0]) {
      console.error("[Market/Odoo] Created quotation could not be read back.");
      throw new OdooApiError("Le devis a été créé mais Odoo n’a pas renvoyé sa référence.");
    }
    if (createdOrders[0].state !== "draft" && createdOrders[0].state !== "sent") {
      console.error("[Market/Odoo] New quotation was not left in a reviewable draft state.");
      throw new OdooApiError("Le devis a été créé dans un état inattendu.");
    }

    await prisma.marketQuotation.create({
      data: {
        userId: user.id,
        odooOrderId: orderId,
        reference: createdOrders[0].name,
        state: createdOrders[0].state,
        amountTotal: createdOrders[0].amount_total,
      },
    });

    res.setHeader("Cache-Control", "no-store");
    return res.status(201).json({
      orderReference: createdOrders[0].name,
      total: createdOrders[0].amount_total,
    });
  } catch (error) {
    if (error instanceof OdooApiError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("[Market/Odoo] Order creation failed:", error);
    return res.status(502).json({ error: "Impossible de transmettre la demande à Odoo. Réessayez ou contactez FiSAFi." });
  }
}
