import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateEmployee, EmployeeAuthError, requireAdmin } from "@/lib/employeeAuth";
import { confirmSalesOrder } from "@/lib/erp/sales";
import { OdooApiError } from "@/lib/marketOdoo";
import { EmployeeCompanyError, resolveEmployeeCompany } from "@/lib/employeeCompany";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }
  const idValue = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const id = typeof idValue === "string" && /^\d+$/.test(idValue) ? Number(idValue) : 0;
  try {
    const employee = await authenticateEmployee(req);
    requireAdmin(employee);
    const company = await resolveEmployeeCompany(req);
    return res.status(200).json({ order: await confirmSalesOrder(id, company.id) });
  } catch (error) {
    if (error instanceof EmployeeAuthError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error instanceof EmployeeCompanyError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error instanceof OdooApiError) {
      console.error(`[Employee/Sales] Odoo confirmation for order ${id} failed:`, error);
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error(`[Employee/Sales] Unexpected confirmation error for order ${id}:`, error);
    return res.status(502).json({ error: "Odoo n’a pas pu confirmer ce devis." });
  }
}
