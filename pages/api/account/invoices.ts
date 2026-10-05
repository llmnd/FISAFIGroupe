import type { NextApiRequest, NextApiResponse } from "next";
import { UserProfile } from "@prisma/client";
import { prisma } from "@/backend/lib/db";
import { authenticateMarketUser, MarketAuthError } from "@/lib/marketAuth";
import { callOdoo, OdooApiError } from "@/lib/marketOdoo";
import { listFiSafiCompanies } from "@/lib/odooCompanies";

type OdooInvoice = {
  id: number;
  name: string;
  move_type: string;
  state: string;
  payment_state: string;
  invoice_date: string | false;
  invoice_date_due: string | false;
  amount_total: number;
  amount_residual: number;
  currency_id: [number, string] | false;
  ref: string | false;
  partner_id: [number, string];
  company_id: [number, string];
};

type OdooPartner = {
  id: number;
  email: string | false;
  company_id: [number, string] | false;
  commercial_partner_id: [number, string];
};
type OdooIdRecord = { id: number };

function isOdooPartner(value: unknown): value is OdooPartner {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const partner = value as Partial<OdooPartner>;
  return (
    Number.isSafeInteger(partner.id) &&
    (typeof partner.email === "string" || partner.email === false) &&
    (partner.company_id === false ||
      (Array.isArray(partner.company_id) &&
        Number.isSafeInteger(partner.company_id[0]) &&
        typeof partner.company_id[1] === "string")) &&
    Array.isArray(partner.commercial_partner_id) &&
    Number.isSafeInteger(partner.commercial_partner_id[0]) &&
    typeof partner.commercial_partner_id[1] === "string"
  );
}

function isOdooIdRecord(value: unknown): value is OdooIdRecord {
  return !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "id" in value &&
    Number.isSafeInteger(value.id) &&
    Number(value.id) > 0;
}

function isOdooInvoice(value: unknown): value is OdooInvoice {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const invoice = value as Partial<OdooInvoice>;
  const validRelation = (relation: unknown) =>
    Array.isArray(relation) &&
    Number.isSafeInteger(relation[0]) &&
    typeof relation[1] === "string";
  return (
    Number.isSafeInteger(invoice.id) &&
    typeof invoice.name === "string" &&
    (invoice.move_type === "out_invoice" || invoice.move_type === "out_refund") &&
    invoice.state === "posted" &&
    typeof invoice.payment_state === "string" &&
    (typeof invoice.invoice_date === "string" || invoice.invoice_date === false) &&
    (typeof invoice.invoice_date_due === "string" || invoice.invoice_date_due === false) &&
    typeof invoice.amount_total === "number" &&
    Number.isFinite(invoice.amount_total) &&
    typeof invoice.amount_residual === "number" &&
    Number.isFinite(invoice.amount_residual) &&
    (invoice.currency_id === false || validRelation(invoice.currency_id)) &&
    (typeof invoice.ref === "string" || invoice.ref === false) &&
    validRelation(invoice.partner_id) &&
    validRelation(invoice.company_id)
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  try {
    const requestedCompany = Array.isArray(req.query.company) ? req.query.company[0] : req.query.company;
    const companyType = requestedCompany === undefined ? "market" : requestedCompany;
    if (companyType !== "market" && companyType !== "groupe") {
      return res.status(400).json({ error: "L’entreprise de facturation demandée est invalide." });
    }
    const requiredProfile = companyType === "market"
      ? UserProfile.MARKET_CUSTOMER
      : UserProfile.TRAINING_PARTICIPANT;
    const companyLabel = companyType === "market" ? "FiSAFi Market" : "FiSAFi Groupe";

    const account = await authenticateMarketUser(req);
    const localUser = await prisma.user.findUnique({
      where: { id: account.id },
      select: { profiles: true, odooPartnerId: true, emailVerifiedAt: true },
    });
    if (!localUser?.profiles.includes(requiredProfile)) {
      return res.status(403).json({ error: `Votre compte n’est pas associé à ${companyLabel}.` });
    }

    const companies = await listFiSafiCompanies();
    const company = companies.find((item) => item.type === companyType);
    if (!company) {
      throw new OdooApiError(`La société ${companyLabel} n’est pas configurée dans Odoo.`, 503);
    }

    let partnerId = localUser.odooPartnerId;
    let commercialPartnerId: number | null = null;
    if (partnerId !== null) {
      const linkedPartners: unknown = await callOdoo("res.partner", "search_read", {
        domain: [["id", "=", partnerId]],
        fields: ["id", "email", "company_id", "commercial_partner_id"],
        limit: 1,
      });
      if (!Array.isArray(linkedPartners) || !linkedPartners.every(isOdooPartner)) {
        throw new OdooApiError("Odoo a renvoyé un contact client invalide.");
      }
      const linkedPartner = linkedPartners[0];
      if (
        !linkedPartner ||
        (linkedPartner.company_id !== false && linkedPartner.company_id[0] !== company.id)
      ) {
        partnerId = null;
      } else {
        commercialPartnerId = linkedPartner.commercial_partner_id[0];
      }
    }

    if (partnerId === null && localUser.emailVerifiedAt) {
      const partners: unknown = await callOdoo("res.partner", "search_read", {
        domain: [
          ["email", "ilike", account.email.trim()],
          ["company_id", "in", [false, company.id]],
        ],
        fields: ["id", "email", "company_id", "commercial_partner_id"],
        limit: 100,
      });
      if (!Array.isArray(partners) || !partners.every(isOdooPartner)) {
        throw new OdooApiError("Odoo a renvoyé des contacts clients invalides.");
      }
      if (partners.length >= 100) {
        throw new OdooApiError("Odoo a renvoyé trop de contacts pour vérifier le compte client.");
      }
      const matchingPartners = partners.filter((partner) =>
        typeof partner.email === "string" &&
        partner.email.trim().toLowerCase() === account.email.trim().toLowerCase() &&
        (partner.company_id === false || partner.company_id[0] === company.id)
      );
      const matchingCommercialIds = new Set(
        matchingPartners.map((partner) => partner.commercial_partner_id[0]),
      );
      if (matchingCommercialIds.size > 1) {
        return res.status(409).json({
          error: "Le rattachement de votre compte à cette société doit être vérifié avant d’afficher les factures.",
        });
      }
      const matchedPartner = matchingPartners[0];
      if (matchedPartner) {
        partnerId = matchedPartner.id;
        commercialPartnerId = matchedPartner.commercial_partner_id[0];
      }
    }
    if (partnerId === null || commercialPartnerId === null) {
      return res.status(200).json({ invoices: [] });
    }

    const contacts: unknown = await callOdoo("res.partner", "search_read", {
      domain: [["commercial_partner_id", "=", commercialPartnerId]],
      fields: ["id"],
      limit: 1_000,
    });
    if (
      !Array.isArray(contacts) ||
      !contacts.every(isOdooIdRecord)
    ) {
      throw new OdooApiError("Odoo a renvoyé une liste de contacts clients invalide.");
    }
    if (contacts.length >= 1_000) {
      throw new OdooApiError("Le compte client possède trop de contacts pour vérifier ses factures.");
    }
    const partnerIds = [...new Set([partnerId, ...contacts.map((contact) => contact.id)])];
    const payload: unknown = await callOdoo("account.move", "search_read", {
      domain: [
        ["company_id", "=", company.id],
        ["partner_id", "in", partnerIds],
        ["move_type", "in", ["out_invoice", "out_refund"]],
        ["state", "=", "posted"],
      ],
      fields: [
        "id", "name", "move_type", "state", "payment_state", "invoice_date",
        "invoice_date_due", "amount_total", "amount_residual", "currency_id",
        "ref", "partner_id", "company_id",
      ],
      limit: 100,
      order: "invoice_date desc, id desc",
    });
    if (
      !Array.isArray(payload) ||
      !payload.every(isOdooInvoice) ||
      payload.some((invoice) =>
        invoice.company_id[0] !== company.id || !partnerIds.includes(invoice.partner_id[0])
      )
    ) {
      throw new OdooApiError("Odoo a renvoyé une liste de factures invalide.");
    }

    return res.status(200).json({
      invoices: payload.map((invoice) => ({
        id: invoice.id,
        reference: invoice.name,
        type: invoice.move_type === "out_refund" ? "credit_note" : "invoice",
        date: invoice.invoice_date || null,
        dueDate: invoice.invoice_date_due || null,
        total: invoice.amount_total,
        remaining: invoice.amount_residual,
        currency: invoice.currency_id === false ? null : invoice.currency_id[1],
        paymentStatus: invoice.payment_state,
        referenceNote: invoice.ref || null,
      })),
    });
  } catch (error) {
    if (error instanceof MarketAuthError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error instanceof OdooApiError) {
      console.error("[Account/Invoices] Odoo request failed:", error);
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("[Account/Invoices] Could not load customer invoices:", error);
    return res.status(502).json({ error: "Impossible de charger vos factures FiSAFi." });
  }
}
