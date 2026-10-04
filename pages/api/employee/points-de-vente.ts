import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateEmployee, EmployeeAuthError, requirePOSRead } from "@/lib/employeeAuth";
import { getERPProvider } from "@/lib/erp";
import { OdooApiError } from "@/lib/marketOdoo";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }
  try {
    const employee = await authenticateEmployee(req);
    requirePOSRead(employee);
    const pointsOfSale = await getERPProvider().getPointsOfSale();
    return res.status(200).json({ pointsOfSale });
  } catch (error) {
    if (error instanceof EmployeeAuthError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error instanceof OdooApiError) {
      console.error("[Employee/ERP] Could not load points of sale:", error);
      return res.status(502).json({
        error: "Le service est temporairement indisponible. Veuillez réessayer dans quelques instants.",
      });
    }
    console.error("[Employee/ERP] Unexpected point-of-sale error:", error);
    return res.status(502).json({
      error: "Le service est temporairement indisponible. Veuillez réessayer dans quelques instants.",
    });
  }
}
