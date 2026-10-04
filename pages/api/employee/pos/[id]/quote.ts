import type { NextApiRequest, NextApiResponse } from "next";
import {
  authenticateEmployee,
  EmployeeAuthError,
  requirePOSSale,
} from "@/lib/employeeAuth";
import { ERPOperationError } from "@/lib/erp/errors";
import { getERPProvider } from "@/lib/erp";
import { withPOSConfigLock } from "@/lib/erp/posLock";
import type { POSSaleLineInput } from "@/lib/erp/contracts";
import { OdooApiError } from "@/lib/marketOdoo";

type QuoteBody = {
  sessionId: number;
  lines: POSSaleLineInput[];
};

function positiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : null;
}

function configIdFromQuery(value: string | string[] | undefined): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function parseBody(value: unknown): QuoteBody | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Partial<QuoteBody>;
  if (
    positiveInteger(body.sessionId) === null ||
    !Array.isArray(body.lines) ||
    body.lines.length === 0 ||
    body.lines.length > 100 ||
    !body.lines.every((line) =>
      !!line &&
      typeof line === "object" &&
      positiveInteger(line.variantId) !== null &&
      Number.isSafeInteger(line.quantity) &&
      line.quantity > 0
    )
  ) {
    return null;
  }
  return { sessionId: body.sessionId as number, lines: body.lines };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }
  try {
    const account = await authenticateEmployee(req);
    requirePOSSale(account);
    const configId = configIdFromQuery(req.query.id);
    const body = parseBody(req.body);
    if (configId === null || !body) {
      return res.status(400).json({ error: "Les données du panier sont invalides." });
    }
    const quote = await withPOSConfigLock(configId, () =>
      getERPProvider().quotePOSSale({
        configId,
        sessionId: body.sessionId,
        employeeId: account.id,
        lines: body.lines,
      })
    );
    return res.status(200).json({ quote });
  } catch (error) {
    if (error instanceof EmployeeAuthError || error instanceof ERPOperationError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error instanceof OdooApiError) {
      console.error("[Employee/POS] Could not price cart:", error);
      return res.status(error.statusCode).json({
        error: "Le prix de cette vente n’a pas pu être confirmé par Odoo.",
      });
    }
    console.error("[Employee/POS] Unexpected cart-pricing error:", error);
    return res.status(502).json({ error: "Impossible de calculer le total de la vente." });
  }
}
