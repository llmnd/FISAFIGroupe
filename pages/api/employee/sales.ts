import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateEmployee, EmployeeAuthError, requireAdmin } from "@/lib/employeeAuth";
import {
  createSalesOrder,
  listSalesOrders,
  searchSalesCustomers,
  searchSalesProducts,
  type SalesOrderInput,
} from "@/lib/erp/sales";
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

function getQueryString(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function getInteger(value: string | string[] | undefined, fallback: number): number {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : fallback;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }
  try {
    const employee = await authenticateEmployee(req);
    requireAdmin(employee);
    const company = await resolveEmployeeCompany(req);

    if (req.method === "GET") {
      const resource = getQueryString(req.query.resource);
      const search = getQueryString(req.query.search);
      if (resource === "customers") {
        return res.status(200).json({ customers: await searchSalesCustomers(search, company.id) });
      }
      if (resource === "products") {
        return res.status(200).json({ products: await searchSalesProducts(search, company.id) });
      }
      return res.status(200).json(await listSalesOrders({
        companyId: company.id,
        search,
        offset: getInteger(req.query.offset, 0),
        limit: getInteger(req.query.limit, 25),
      }));
    }

    if (!isSalesOrderInput(req.body)) {
      return res.status(400).json({ error: "Vérifiez le client, les lignes et les quantités du devis." });
    }
    const order = await createSalesOrder(req.body, company.id);
    return res.status(201).json({ order });
  } catch (error) {
    if (error instanceof EmployeeAuthError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error instanceof EmployeeCompanyError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error instanceof OdooApiError) {
      console.error("[Employee/Sales] Odoo request failed:", error);
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("[Employee/Sales] Unexpected sales request error:", error);
    return res.status(502).json({ error: "Le module ventes est temporairement indisponible." });
  }
}
