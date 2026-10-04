import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateEmployee, EmployeeAuthError, requirePOSRead } from "@/lib/employeeAuth";
import { getERPProvider } from "@/lib/erp";
import { OdooApiError } from "@/lib/marketOdoo";

const PAGE_SIZE = 30;
const MAX_OFFSET = 100_000;

function getSingleQueryValue(value: string | string[] | undefined): string | null {
  return typeof value === "string" ? value : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  try {
    const account = await authenticateEmployee(req);
    requirePOSRead(account);

    const rawConfigId = getSingleQueryValue(req.query.configId);
    if (!rawConfigId || !/^\d+$/.test(rawConfigId)) {
      return res.status(400).json({ error: "Le point de vente demandé est invalide." });
    }
    const configId = Number(rawConfigId);
    if (!Number.isSafeInteger(configId) || configId < 1) {
      return res.status(400).json({ error: "Le point de vente demandé est invalide." });
    }
    const search = (getSingleQueryValue(req.query.q) ?? "").trim().slice(0, 100);
    const rawOffset = getSingleQueryValue(req.query.offset) ?? "0";
    if (!/^\d+$/.test(rawOffset)) {
      return res.status(400).json({ error: "La pagination est invalide." });
    }
    const offset = Number(rawOffset);
    if (!Number.isSafeInteger(offset) || offset > MAX_OFFSET) {
      return res.status(400).json({ error: "La page demandée est hors limites." });
    }

    const page = await getERPProvider().getPOSProducts({
      configId,
      search,
      offset,
      limit: PAGE_SIZE,
    });
    return res.status(200).json(page);
  } catch (error) {
    if (error instanceof EmployeeAuthError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error instanceof OdooApiError) {
      console.error("[Employee/POS] Could not load product catalog:", error);
      return res.status(error.statusCode).json({
        error: "Le catalogue caisse est temporairement indisponible. Réessayez plus tard.",
      });
    }
    console.error("[Employee/POS] Unexpected product catalog error:", error);
    return res.status(502).json({ error: "Impossible de charger le catalogue caisse." });
  }
}
