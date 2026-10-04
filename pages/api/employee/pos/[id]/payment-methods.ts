import type { NextApiRequest, NextApiResponse } from "next";
import {
  authenticateEmployee,
  EmployeeAuthError,
  requirePOSSale,
} from "@/lib/employeeAuth";
import { ERPOperationError } from "@/lib/erp/errors";
import { getERPProvider } from "@/lib/erp";
import { OdooApiError } from "@/lib/marketOdoo";

function parsePositiveInteger(value: string | string[] | undefined): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }
  try {
    const account = await authenticateEmployee(req);
    requirePOSSale(account);
    const configId = parsePositiveInteger(req.query.id);
    const sessionId = parsePositiveInteger(req.query.sessionId);
    if (configId === null || sessionId === null) {
      return res.status(400).json({ error: "La session de caisse demandée est invalide." });
    }
    const methods = await getERPProvider().getPOSPaymentMethods({
      configId,
      sessionId,
      employeeId: account.id,
    });
    return res.status(200).json({ methods });
  } catch (error) {
    if (error instanceof EmployeeAuthError || error instanceof ERPOperationError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error instanceof OdooApiError) {
      console.error("[Employee/POS] Could not load payment methods:", error);
      return res.status(error.statusCode).json({
        error: "Les moyens de paiement sont temporairement indisponibles.",
      });
    }
    console.error("[Employee/POS] Unexpected payment-method error:", error);
    return res.status(502).json({ error: "Impossible de charger les moyens de paiement." });
  }
}
