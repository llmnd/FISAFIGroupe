import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateEmployee, EmployeeAuthError, requireAdmin } from "@/lib/employeeAuth";
import { getSalesOrder, updateSalesOrder, type SalesOrderInput } from "@/lib/erp/sales";
import { OdooApiError } from "@/lib/marketOdoo";
import { EmployeeCompanyError, resolveEmployeeCompany } from "@/lib/employeeCompany";

function isSalesOrderInput(value: unknown): value is SalesOrderInput {
  if (!value || typeof value !== "object") return false;
  const input = value as Partial<SalesOrderInput>;
  return (
    Number.isSafeInteger(input.partnerId) &&
    typeof input.clientOrderRef === "string" &&
    typeof input.note === "string" &&
    Array.isArray(input.lines) &&
    input.lines.every((line) =>
      !!line &&
      typeof line === "object" &&
      Number.isSafeInteger(line.productId) &&
      typeof line.quantity === "number" &&
      Number.isFinite(line.quantity)
    )
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET" && req.method !== "PUT") {
    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }
  const idValue = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const id = typeof idValue === "string" && /^\d+$/.test(idValue) ? Number(idValue) : 0;
  try {
    const employee = await authenticateEmployee(req);
    requireAdmin(employee);
    const company = await resolveEmployeeCompany(req);
    if (req.method === "GET") {
      return res.status(200).json({ order: await getSalesOrder(id, company.id) });
    }
    if (!isSalesOrderInput(req.body)) {
      return res.status(400).json({ error: "Vérifiez le client, les lignes et les quantités du devis." });
    }
    return res.status(200).json({ order: await updateSalesOrder(id, req.body, company.id) });
  } catch (error) {
    if (error instanceof EmployeeAuthError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error instanceof EmployeeCompanyError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error instanceof OdooApiError) {
      console.error(`[Employee/Sales] Odoo request for order ${id} failed:`, error);
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error(`[Employee/Sales] Unexpected request error for order ${id}:`, error);
    return res.status(502).json({ error: "Le module ventes est temporairement indisponible." });
  }
}
