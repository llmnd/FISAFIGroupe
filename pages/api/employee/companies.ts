import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateEmployee, EmployeeAuthError, requireEmployee } from "@/lib/employeeAuth";
import {
  EmployeeCompanyError,
  resolveEmployeeCompany,
  setEmployeeCompanyCookie,
} from "@/lib/employeeCompany";
import { listFiSafiCompanies } from "@/lib/odooCompanies";
import { OdooApiError } from "@/lib/marketOdoo";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "GET" && req.method !== "PUT") {
    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  try {
    const account = await authenticateEmployee(req);
    requireEmployee(account);

    if (req.method === "GET") {
      const [companies, selected] = await Promise.all([
        listFiSafiCompanies(),
        resolveEmployeeCompany(req),
      ]);
      setEmployeeCompanyCookie(req, res, selected);
      return res.status(200).json({ companies, selectedCompanyId: selected.id });
    }

    const company = await resolveEmployeeCompany(req, req.body?.companyId);
    setEmployeeCompanyCookie(req, res, company);
    return res.status(200).json({ selectedCompanyId: company.id });
  } catch (error) {
    if (error instanceof EmployeeAuthError || error instanceof EmployeeCompanyError || error instanceof OdooApiError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("[Employee/Companies] Could not resolve Odoo company context:", error);
    return res.status(502).json({ error: "Impossible de charger les sociétés Odoo." });
  }
}
