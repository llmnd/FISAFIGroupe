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
import { assertEmployeePOSCompany, EmployeeCompanyError, resolveEmployeeCompany } from "@/lib/employeeCompany";

type SaleBody = {
  operationId: string;
  sessionId: number;
  paymentMethodId: number;
  amountReceived: number;
  lines: POSSaleLineInput[];
};

function parsePositiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : null;
}

function parseBody(value: unknown): SaleBody | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Partial<SaleBody>;
  if (
    typeof body.operationId !== "string" ||
    parsePositiveInteger(body.sessionId) === null ||
    parsePositiveInteger(body.paymentMethodId) === null ||
    typeof body.amountReceived !== "number" ||
    !Number.isSafeInteger(body.amountReceived) ||
    !Array.isArray(body.lines) ||
    body.lines.length === 0 ||
    body.lines.length > 100 ||
    !body.lines.every((line) =>
      !!line &&
      typeof line === "object" &&
      parsePositiveInteger(line.variantId) !== null &&
      Number.isSafeInteger(line.quantity) &&
      line.quantity > 0
    )
  ) {
    return null;
  }
  return {
    operationId: body.operationId,
    sessionId: body.sessionId as number,
    paymentMethodId: body.paymentMethodId as number,
    amountReceived: body.amountReceived,
    lines: body.lines,
  };
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
    const company = await resolveEmployeeCompany(req);
    const rawConfigId = typeof req.query.id === "string" ? Number(req.query.id) : NaN;
    const configId = Number.isSafeInteger(rawConfigId) && rawConfigId > 0 ? rawConfigId : null;
    const body = parseBody(req.body);
    if (configId === null || !body) {
      return res.status(400).json({ error: "Les données de vente sont invalides." });
    }
    await assertEmployeePOSCompany(configId, company.id);
    const sale = await withPOSConfigLock(configId, () =>
      getERPProvider().createPOSSale({
        configId,
        sessionId: body.sessionId,
        operationId: body.operationId,
        employeeId: account.id,
        lines: body.lines,
        paymentMethodId: body.paymentMethodId,
        amountReceived: body.amountReceived,
      })
    );
    return res.status(200).json({ sale });
  } catch (error) {
    if (error instanceof EmployeeAuthError || error instanceof EmployeeCompanyError || error instanceof ERPOperationError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error instanceof OdooApiError) {
      console.error("[Employee/POS] Odoo could not register sale:", error);
      return res.status(error.statusCode).json({
        error: "La vente n’a pas pu être confirmée. Actualisez la caisse avant de réessayer.",
      });
    }
    console.error("[Employee/POS] Unexpected sale error:", error);
    return res.status(502).json({ error: "Impossible d’enregistrer la vente." });
  }
}
