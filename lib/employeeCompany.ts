import type { NextApiRequest, NextApiResponse } from "next";
import { callOdoo } from "@/lib/marketOdoo";
import { listFiSafiCompanies, type FiSafiCompany } from "@/lib/odooCompanies";

export const EMPLOYEE_COMPANY_COOKIE = "fisafi_employee_company";

export class EmployeeCompanyError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
    this.name = "EmployeeCompanyError";
  }
}

export async function resolveEmployeeCompany(
  req: NextApiRequest,
  requestedId?: unknown,
): Promise<FiSafiCompany> {
  const companies = await listFiSafiCompanies();
  if (!companies.length) {
    throw new EmployeeCompanyError("Aucune société FiSAFi Groupe ou FiSAFi Market n’est accessible.", 403);
  }

  const rawId = requestedId === undefined
    ? req.cookies[EMPLOYEE_COMPANY_COOKIE]
    : requestedId;
  if (rawId === undefined) {
    return companies.find((company) => company.type === "market") ?? companies[0];
  }

  const companyId = typeof rawId === "number"
    ? rawId
    : typeof rawId === "string" && /^\d+$/.test(rawId)
      ? Number(rawId)
      : NaN;
  if (!Number.isSafeInteger(companyId) || companyId <= 0) {
    throw new EmployeeCompanyError("La société sélectionnée est invalide.", 400);
  }

  const company = companies.find((item) => item.id === companyId);
  if (!company) {
    throw new EmployeeCompanyError("La société sélectionnée n’est pas accessible.", 403);
  }
  return company;
}

export function setEmployeeCompanyCookie(
  req: NextApiRequest,
  res: NextApiResponse,
  company: FiSafiCompany,
): void {
  const forwardedProtocol = req.headers["x-forwarded-proto"];
  const protocol = Array.isArray(forwardedProtocol) ? forwardedProtocol[0] : forwardedProtocol;
  const secure = protocol
    ? protocol.split(",")[0].trim() === "https"
    : process.env.NODE_ENV === "production";
  const attributes = [
    `${EMPLOYEE_COMPANY_COOKIE}=${company.id}`,
    "Path=/",
    "Max-Age=2592000",
    "SameSite=Lax",
    "HttpOnly",
  ];
  if (secure) attributes.push("Secure");
  res.setHeader("Set-Cookie", attributes.join("; "));
}

export async function assertEmployeePOSCompany(configId: number, companyId: number): Promise<void> {
  if (!Number.isSafeInteger(configId) || configId < 1) {
    throw new EmployeeCompanyError("Le point de vente demandé est invalide.", 400);
  }

  const payload: unknown = await callOdoo("pos.config", "search_read", {
    domain: [["id", "=", configId]],
    fields: ["id", "company_id"],
    limit: 1,
  });
  if (
    !Array.isArray(payload) ||
    payload.length !== 1 ||
    !payload[0] ||
    typeof payload[0] !== "object" ||
    !("id" in payload[0]) ||
    payload[0].id !== configId ||
    !("company_id" in payload[0]) ||
    !Array.isArray(payload[0].company_id) ||
    payload[0].company_id[0] !== companyId
  ) {
    throw new EmployeeCompanyError("Ce point de vente n’appartient pas à l’entreprise sélectionnée.", 403);
  }
}

export async function assertEmployeeProductCompany(productId: number, companyId: number): Promise<void> {
  const payload: unknown = await callOdoo("product.template", "search_read", {
    domain: [["id", "=", productId]],
    fields: ["id", "company_id"],
    limit: 1,
  });
  if (
    !Array.isArray(payload) ||
    payload.length !== 1 ||
    !payload[0] ||
    typeof payload[0] !== "object" ||
    !("id" in payload[0]) ||
    payload[0].id !== productId ||
    !("company_id" in payload[0]) ||
    !Array.isArray(payload[0].company_id) ||
    payload[0].company_id[0] !== companyId
  ) {
    throw new EmployeeCompanyError("Ce produit n’appartient pas à l’entreprise sélectionnée.", 403);
  }
}
