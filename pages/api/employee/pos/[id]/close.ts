import type { NextApiRequest, NextApiResponse } from "next";
import {
  authenticateEmployee,
  EmployeeAuthError,
  requirePOSClose,
} from "@/lib/employeeAuth";
import { ERPOperationError } from "@/lib/erp/errors";
import { getERPProvider } from "@/lib/erp";
import { withPOSConfigLock } from "@/lib/erp/posLock";
import { OdooApiError } from "@/lib/marketOdoo";
import { assertEmployeePOSCompany, EmployeeCompanyError, resolveEmployeeCompany } from "@/lib/employeeCompany";

type CloseBody = {
  operationId: string;
  sessionId: number;
  countedAmounts: Record<number, number>;
};

function parsePositiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : null;
}

function parseConfigId(value: string | string[] | undefined): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function parseCloseBody(value: unknown): CloseBody | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Partial<CloseBody>;
  if (
    typeof body.operationId !== "string" ||
    parsePositiveInteger(body.sessionId) === null ||
    !body.countedAmounts ||
    typeof body.countedAmounts !== "object" ||
    Array.isArray(body.countedAmounts)
  ) {
    return null;
  }
  const entries = Object.entries(body.countedAmounts);
  if (
    entries.length > 20 ||
    entries.some(([id, amount]) =>
      !/^\d+$/.test(id) ||
      Number(id) < 1 ||
      !Number.isSafeInteger(Number(id)) ||
      typeof amount !== "number" ||
      !Number.isSafeInteger(amount) ||
      amount < 0
    )
  ) {
    return null;
  }
  return {
    operationId: body.operationId,
    sessionId: body.sessionId as number,
    countedAmounts: body.countedAmounts,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }
  try {
    const account = await authenticateEmployee(req);
    const company = await resolveEmployeeCompany(req);
    if (req.method === "GET") {
      requirePOSClose(account);
      const configId = parseConfigId(req.query.id);
      const sessionId = parseConfigId(req.query.sessionId);
      if (configId === null || sessionId === null) {
        return res.status(400).json({ error: "La session de caisse demandée est invalide." });
      }
      await assertEmployeePOSCompany(configId, company.id);
      const summary = await getERPProvider().getPOSClosingSummary({
        configId,
        sessionId,
        employeeId: account.id,
      });
      return res.status(200).json({ summary });
    }

    requirePOSClose(account);
    const configId = parseConfigId(req.query.id);
    const body = parseCloseBody(req.body);
    if (configId === null || !body) {
      return res.status(400).json({ error: "Les données de clôture sont invalides." });
    }
    await assertEmployeePOSCompany(configId, company.id);
    const session = await withPOSConfigLock(configId, () =>
      getERPProvider().closePOSSession({
        configId,
        sessionId: body.sessionId,
        operationId: body.operationId,
        employeeId: account.id,
        countedAmounts: body.countedAmounts,
      })
    );
    return res.status(200).json({ session });
  } catch (error) {
    if (error instanceof EmployeeAuthError || error instanceof EmployeeCompanyError || error instanceof ERPOperationError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error instanceof OdooApiError) {
      console.error("[Employee/POS] Odoo could not close session:", error);
      return res.status(error.statusCode).json({
        error: "Odoo n’a pas confirmé la clôture. Vérifiez l’état de la caisse avant de réessayer.",
      });
    }
    console.error("[Employee/POS] Unexpected session-closing error:", error);
    return res.status(502).json({ error: "Impossible de clôturer la caisse." });
  }
}
