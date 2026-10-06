import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateEmployee, EmployeeAuthError, requireAdmin } from "@/lib/employeeAuth";
import { OdooApiError, callOdoo } from "@/lib/marketOdoo";
import { EmployeeCompanyError, resolveEmployeeCompany } from "@/lib/employeeCompany";

type OdooRelation = [number, string] | false;
type OdooPOSOrder = {
  id: number;
  name: string;
  state: "draft" | "paid" | "done" | "invoiced" | "cancel";
  company_id: [number, string];
  date_order: string;
  partner_id: OdooRelation;
  user_id: OdooRelation;
  session_id: OdooRelation;
  config_id: OdooRelation;
  pos_reference: string | false;
  amount_total: number;
  amount_tax: number;
  amount_paid: number;
  currency_id: OdooRelation;
  lines: number[];
  payment_ids: number[];
};

type OdooPOSOrderLine = {
  id: number;
  product_id: OdooRelation;
  qty: number;
  price_unit: number;
  discount: number;
  price_subtotal: number;
  price_subtotal_incl: number;
};

type OdooPOSPayment = {
  id: number;
  amount: number;
  payment_method_id: OdooRelation;
  is_change: boolean;
};

function getPositiveId(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string" || !/^\d+$/.test(raw)) return 0;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : 0;
}

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
  return Array.isArray(value) && value.every((id) => Number.isSafeInteger(id) && id > 0);
}

function isOdooPOSOrder(value: unknown): value is OdooPOSOrder {
  if (!value || typeof value !== "object") return false;
  const order = value as Partial<OdooPOSOrder>;
  return (
    Number.isSafeInteger(order.id) &&
    typeof order.name === "string" &&
    (order.state === "draft" ||
      order.state === "paid" ||
      order.state === "done" ||
      order.state === "invoiced" ||
      order.state === "cancel") &&
    Array.isArray(order.company_id) &&
    order.company_id.length === 2 &&
    Number.isSafeInteger(order.company_id[0]) &&
    typeof order.company_id[1] === "string" &&
    typeof order.date_order === "string" &&
    isRelation(order.partner_id) &&
    isRelation(order.user_id) &&
    isRelation(order.session_id) &&
    isRelation(order.config_id) &&
    (typeof order.pos_reference === "string" || order.pos_reference === false) &&
    typeof order.amount_total === "number" &&
    Number.isFinite(order.amount_total) &&
    typeof order.amount_tax === "number" &&
    Number.isFinite(order.amount_tax) &&
    typeof order.amount_paid === "number" &&
    Number.isFinite(order.amount_paid) &&
    isRelation(order.currency_id) &&
    isIdArray(order.lines) &&
    isIdArray(order.payment_ids)
  );
}

function isOdooPOSOrderLine(value: unknown): value is OdooPOSOrderLine {
  if (!value || typeof value !== "object") return false;
  const line = value as Partial<OdooPOSOrderLine>;
  return (
    Number.isSafeInteger(line.id) &&
    isRelation(line.product_id) &&
    typeof line.qty === "number" &&
    Number.isFinite(line.qty) &&
    typeof line.price_unit === "number" &&
    Number.isFinite(line.price_unit) &&
    typeof line.discount === "number" &&
    Number.isFinite(line.discount) &&
    typeof line.price_subtotal === "number" &&
    Number.isFinite(line.price_subtotal) &&
    typeof line.price_subtotal_incl === "number" &&
    Number.isFinite(line.price_subtotal_incl)
  );
}

function isOdooPOSPayment(value: unknown): value is OdooPOSPayment {
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

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function formatAmount(value: number, currency: OdooRelation): string {
  const amount = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(value);
  return `${amount}${currency === false ? "" : ` ${escapeHtml(currency[1])}`}`;
}

function formatQuantity(value: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 3 }).format(value);
}

function relationLabel(value: OdooRelation): string {
  return value === false ? "" : value[1];
}

function renderReceipt(
  companyName: string,
  order: OdooPOSOrder,
  lines: OdooPOSOrderLine[],
  payments: OdooPOSPayment[],
): string {
  const lineRows = lines
    .map((line) => {
      const name = escapeHtml(relationLabel(line.product_id) || "Article");
      const discount = line.discount > 0 ? `<small>Remise : ${line.discount}%</small>` : "";
      return `<tr>
        <td>${name}${discount}<small>${formatAmount(line.price_unit, order.currency_id)} × ${formatQuantity(line.qty)}</small></td>
        <td class="number">${formatAmount(line.price_subtotal_incl, order.currency_id)}</td>
      </tr>`;
    })
    .join("");
  const paymentRows = payments
    .filter((payment) => !payment.is_change)
    .map((payment) => `<div class="total-row">
      <span>${escapeHtml(relationLabel(payment.payment_method_id) || "Paiement")}</span>
      <strong>${formatAmount(payment.amount, order.currency_id)}</strong>
    </div>`)
    .join("");
  const orderDate = new Date(`${order.date_order.replace(" ", "T")}Z`);
  const formattedDate = Number.isNaN(orderDate.getTime())
    ? escapeHtml(order.date_order)
    : escapeHtml(orderDate.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }));
  const reference = escapeHtml(order.pos_reference === false ? order.name : order.pos_reference);
  const stateLabel =
    order.state === "invoiced" ? "Facturée" :
    order.state === "done" ? "Comptabilisée" :
    order.state === "paid" ? "Payée" : order.state;
  const customer = relationLabel(order.partner_id);
  const operator = relationLabel(order.user_id);
  const session = relationLabel(order.session_id);
  const pointOfSale = relationLabel(order.config_id);

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Reçu ${escapeHtml(order.name)}</title>
  <style>
    :root { color-scheme: light; font-family: Arial, Helvetica, sans-serif; color: #182230; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 24px; background: #f3f4f6; }
    .receipt { max-width: 420px; margin: 0 auto; padding: 28px; background: #fff; }
    header { text-align: center; padding-bottom: 18px; border-bottom: 1px dashed #9ca3af; }
    h1 { margin: 0 0 8px; font-size: 22px; }
    .subtitle, small, .meta { color: #586474; }
    .subtitle { font-size: 13px; }
    .meta { display: grid; gap: 5px; margin: 16px 0; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { padding: 8px 0; border-bottom: 1px solid #d1d5db; text-align: left; }
    td { padding: 10px 0; vertical-align: top; border-bottom: 1px solid #e5e7eb; }
    .number { text-align: right; white-space: nowrap; }
    small { display: block; margin-top: 4px; font-size: 11px; }
    .totals { margin-top: 14px; }
    .total-row { display: flex; justify-content: space-between; gap: 12px; padding: 4px 0; font-size: 13px; }
    .grand-total { margin-top: 8px; padding-top: 10px; border-top: 1px solid #182230; font-size: 18px; }
    footer { margin-top: 22px; padding-top: 14px; border-top: 1px dashed #9ca3af; text-align: center; font-size: 12px; }
    .print { display: block; margin: 18px auto 0; padding: 10px 18px; border: 0; border-radius: 4px; color: #fff; background: #173f7a; font-size: 14px; cursor: pointer; }
    @media print { body { padding: 0; background: #fff; } .receipt { max-width: none; padding: 0; } .print { display: none; } }
  </style>
</head>
<body>
  <main class="receipt">
    <header><h1>${escapeHtml(companyName)}</h1><div class="subtitle">Ticket de caisse</div></header>
    <section class="meta">
      <div><strong>Référence :</strong> ${reference}</div>
      <div><strong>Date :</strong> ${formattedDate}</div>
      ${pointOfSale ? `<div><strong>Point de vente :</strong> ${escapeHtml(pointOfSale)}</div>` : ""}
      ${session ? `<div><strong>Session :</strong> ${escapeHtml(session)}</div>` : ""}
      ${customer ? `<div><strong>Client :</strong> ${escapeHtml(customer)}</div>` : ""}
      ${operator ? `<div><strong>Opérateur :</strong> ${escapeHtml(operator)}</div>` : ""}
      <div><strong>Statut :</strong> ${escapeHtml(stateLabel)}</div>
    </section>
    <table>
      <thead><tr><th>Article</th><th class="number">Montant</th></tr></thead>
      <tbody>${lineRows}</tbody>
    </table>
    <section class="totals">
      <div class="total-row"><span>Taxes comprises</span><strong>${formatAmount(order.amount_total, order.currency_id)}</strong></div>
      <div class="total-row"><span>Taxes</span><span>${formatAmount(order.amount_tax, order.currency_id)}</span></div>
      ${paymentRows}
      <div class="total-row grand-total"><strong>Total payé</strong><strong>${formatAmount(order.amount_paid, order.currency_id)}</strong></div>
    </section>
    <footer>Merci de votre confiance.</footer>
    <button class="print" type="button" onclick="window.print()">Imprimer / Enregistrer en PDF</button>
  </main>
</body>
</html>`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  const orderId = getPositiveId(req.query.id);
  const companyId = getPositiveId(req.query.companyId);
  if (!orderId || !companyId) {
    return res.status(400).json({ error: "La commande ou la société sélectionnée est invalide." });
  }

  try {
    const employee = await authenticateEmployee(req);
    requireAdmin(employee);
    const company = await resolveEmployeeCompany(req, companyId);
    const orderPayload: unknown = await callOdoo("pos.order", "search_read", {
      domain: [["id", "=", orderId], ["company_id", "=", company.id]],
      fields: [
        "id",
        "name",
        "state",
        "company_id",
        "date_order",
        "partner_id",
        "user_id",
        "session_id",
        "config_id",
        "pos_reference",
        "amount_total",
        "amount_tax",
        "amount_paid",
        "currency_id",
        "lines",
        "payment_ids",
      ],
      limit: 1,
    });
    if (
      !Array.isArray(orderPayload) ||
      orderPayload.length > 1 ||
      !orderPayload.every(isOdooPOSOrder) ||
      orderPayload.some((order) => order.id !== orderId || order.company_id[0] !== company.id)
    ) {
      console.error(`[Admin/POS] Odoo returned an invalid company-filtered record for order ${orderId}.`);
      throw new OdooApiError("Odoo a renvoyé des données de reçu invalides.");
    }
    const order = orderPayload[0];
    if (!order) {
      return res.status(404).json({ error: "Ce reçu n’est pas disponible pour la société sélectionnée." });
    }
    if (order.state !== "paid" && order.state !== "done" && order.state !== "invoiced") {
      return res.status(409).json({ error: "Le reçu est disponible uniquement pour une vente validée." });
    }

    const linePayload: unknown = order.lines.length
      ? await callOdoo("pos.order.line", "search_read", {
          domain: [["id", "in", order.lines], ["order_id", "=", order.id]],
          fields: [
            "id",
            "product_id",
            "qty",
            "price_unit",
            "discount",
            "price_subtotal",
            "price_subtotal_incl",
          ],
          limit: order.lines.length,
        })
      : [];
    const paymentPayload: unknown = order.payment_ids.length
      ? await callOdoo("pos.payment", "search_read", {
          domain: [["id", "in", order.payment_ids], ["pos_order_id", "=", order.id]],
          fields: ["id", "amount", "payment_method_id", "is_change"],
          limit: order.payment_ids.length,
        })
      : [];
    if (
      !Array.isArray(linePayload) ||
      !linePayload.every(isOdooPOSOrderLine) ||
      linePayload.length !== order.lines.length ||
      !Array.isArray(paymentPayload) ||
      !paymentPayload.every(isOdooPOSPayment) ||
      paymentPayload.length !== order.payment_ids.length
    ) {
      console.error(`[Admin/POS] Odoo returned incomplete line or payment data for order ${orderId}.`);
      throw new OdooApiError("Odoo a renvoyé des lignes ou paiements incomplets pour ce reçu.");
    }

    const receiptHtml = renderReceipt(company.name, order, linePayload, paymentPayload);
    const safeReference = order.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100) || `ticket-${order.id}`;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="recu-${safeReference}.html"`);
    return res.status(200).send(receiptHtml);
  } catch (error) {
    if (error instanceof EmployeeAuthError || error instanceof EmployeeCompanyError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error instanceof OdooApiError) {
      console.error(`[Admin/POS] Could not generate the receipt for order ${orderId}:`, error);
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error(`[Admin/POS] Unexpected receipt request error for order ${orderId}:`, error);
    return res.status(502).json({ error: "Impossible de récupérer le reçu FiSAFi pour le moment." });
  }
}
