import type { NextApiRequest, NextApiResponse } from "next";
import {
  authenticateEmployee,
  EmployeeAuthError,
  requireAdmin,
} from "@/lib/employeeAuth";
import { listFiSafiCompanies } from "@/lib/odooCompanies";
import { OdooApiError } from "@/lib/marketOdoo";
import { getMarketSimulationSnapshot } from "@/lib/marketSimulation/odooSnapshot";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  try {
    const account = await authenticateEmployee(req);
    requireAdmin(account);

    const rawCompanyId = req.query.companyId;
    if (typeof rawCompanyId !== "string" || !/^\d+$/.test(rawCompanyId)) {
      return res.status(400).json({ error: "Sélectionnez une société FiSAFi valide." });
    }
    const companyId = Number(rawCompanyId);
    if (!Number.isSafeInteger(companyId) || companyId <= 0) {
      return res.status(400).json({ error: "Sélectionnez une société FiSAFi valide." });
    }
    const companies = await listFiSafiCompanies();
    if (!companies.some((company) => company.id === companyId)) {
      return res.status(403).json({ error: "Cette société FiSAFi n’est pas accessible." });
    }

    const snapshot = await getMarketSimulationSnapshot(companyId, account);
    return res.status(200).json(snapshot);
  } catch (error) {
    if (error instanceof EmployeeAuthError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error instanceof OdooApiError) {
      console.error("[Admin/Market simulation] Odoo snapshot request failed:", error);
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("[Admin/Market simulation] Unexpected snapshot error:", error);
    return res.status(502).json({ error: "Impossible de charger les données du simulateur." });
  }
}
