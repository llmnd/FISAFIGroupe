import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateEmployee, EmployeeAuthError, requireAdmin } from "@/lib/employeeAuth";
import { getSalesOrderInvoicePdf } from "@/lib/erp/sales";
import { OdooApiError } from "@/lib/marketOdoo";
import { EmployeeCompanyError, resolveEmployeeCompany } from "@/lib/employeeCompany";

function getPositiveId(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : 0;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  const orderId = getPositiveId(req.query.id);
  const invoiceId = getPositiveId(req.query.invoiceId);
  try {
    const employee = await authenticateEmployee(req);
    requireAdmin(employee);
    const company = await resolveEmployeeCompany(req);
    const invoicePdf = await getSalesOrderInvoicePdf(orderId, invoiceId, company.id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${invoicePdf.fileName}"`);
    res.setHeader("Content-Length", String(invoicePdf.content.length));
    return res.status(200).send(invoicePdf.content);
  } catch (error) {
    if (error instanceof EmployeeAuthError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error instanceof EmployeeCompanyError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error instanceof OdooApiError) {
      console.error(`[Employee/Sales] Invoice PDF request for order ${orderId} failed:`, error);
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error(`[Employee/Sales] Unexpected invoice PDF request for order ${orderId}:`, error);
    return res.status(502).json({ error: "Impossible de récupérer le PDF de la facture Odoo." });
  }
}
