import type { NextApiRequest, NextApiResponse } from "next";
import {
  authenticateEmployee,
  EmployeeAuthError,
  requirePOSOpen,
} from "@/lib/employeeAuth";
import { ERPOperationError } from "@/lib/erp/errors";
import { getERPProvider } from "@/lib/erp";
import { withPOSConfigLock } from "@/lib/erp/posLock";
import { OdooApiError } from "@/lib/marketOdoo";
import { assertEmployeePOSCompany, EmployeeCompanyError, resolveEmployeeCompany } from "@/lib/employeeCompany";

type OpenBody = {
  operationId: string;
  openingAmount: number;
};

function parseConfigId(value: string | string[] | undefined): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function parseBody(value: unknown): OpenBody | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Partial<OpenBody>;
  if (
    typeof body.operationId !== "string" ||
    typeof body.openingAmount !== "number" ||
    !Number.isSafeInteger(body.openingAmount)
  ) {
    return null;
  }
  return { operationId: body.operationId, openingAmount: body.openingAmount };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  try {
    const account = await authenticateEmployee(req);
    requirePOSOpen(account);
    const company = await resolveEmployeeCompany(req);
    const configId = parseConfigId(req.query.id);
    const body = parseBody(req.body);
    if (configId === null || !body) {
      return res.status(400).json({ error: "Les données d’ouverture sont invalides." });
    }
    await assertEmployeePOSCompany(configId, company.id);
    const session = await withPOSConfigLock(configId, () =>
      getERPProvider().openPOSSession({
        configId,
        openingAmount: body.openingAmount,
        operationId: body.operationId,
        employeeId: account.id,
      })
    );
    return res.status(200).json({ session });
  } catch (error) {
    if (error instanceof EmployeeAuthError || error instanceof EmployeeCompanyError || error instanceof ERPOperationError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error instanceof OdooApiError) {
      console.error("[Employee/POS] Could not open session:", error);
      return res.status(error.statusCode).json({
        error: "La caisse n’a pas pu être ouverte. Vérifiez l’état de la session avant de réessayer.",
      });
    }
    console.error("[Employee/POS] Unexpected session-opening error:", error);
    return res.status(502).json({ error: "Impossible d’ouvrir la caisse." });
  }
}
