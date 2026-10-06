import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateEmployee, EmployeeAuthError, requireAdmin } from "@/lib/employeeAuth";
import { listFiSafiCompanies } from "@/lib/odooCompanies";
import { OdooApiError } from "@/lib/marketOdoo";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  try {
    const admin = await authenticateEmployee(req);
    requireAdmin(admin);

    const companies = await listFiSafiCompanies();
    const hasMarket = companies.some((company) => company.type === "market");
    const hasGroup = companies.some((company) => company.type === "groupe");
    if (!hasMarket || !hasGroup) {
      return res.status(403).json({
        error: "Le compte doit avoir accès aux sociétés FiSAFi Groupe et FiSAFi Market. Vérifiez ses droits.",
      });
    }
    return res.status(200).json(companies);
  } catch (error) {
    if (error instanceof EmployeeAuthError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("[Admin/Odoo] Could not load companies:", error);
    if (error instanceof OdooApiError) {
      return res.status(error.statusCode).json({ error: "Impossible de charger les sociétés FiSAFi pour le moment." });
    }
    return res.status(502).json({ error: "Impossible de charger les sociétés FiSAFi pour le moment." });
  }
}
