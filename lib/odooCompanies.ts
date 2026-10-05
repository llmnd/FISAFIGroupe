import { callOdoo, OdooApiError } from "@/lib/marketOdoo";

export type FiSafiCompanyType = "groupe" | "market";

export type FiSafiCompany = {
  id: number;
  name: string;
  type: FiSafiCompanyType;
};

type OdooCompanyRecord = {
  id: number;
  name: string;
  parent_id: [number, string] | false;
};

let cachedCompanies: FiSafiCompany[] | null = null;
let cacheExpiresAt = 0;

function classifyCompany(name: string): FiSafiCompanyType | null {
  const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (normalized.includes("market")) return "market";
  if (normalized.includes("groupe")) return "groupe";
  return null;
}

function isOdooCompany(value: unknown): value is OdooCompanyRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const company = value as Partial<OdooCompanyRecord>;
  return (
    Number.isSafeInteger(company.id) &&
    Number(company.id) > 0 &&
    typeof company.name === "string" &&
    (company.parent_id === false ||
      (Array.isArray(company.parent_id) &&
        Number.isSafeInteger(company.parent_id[0]) &&
        typeof company.parent_id[1] === "string"))
  );
}

export async function listFiSafiCompanies(): Promise<FiSafiCompany[]> {
  if (cachedCompanies && cacheExpiresAt > Date.now()) return cachedCompanies;

  const payload: unknown = await callOdoo("res.company", "search_read", {
    domain: [],
    fields: ["id", "name", "parent_id"],
    limit: 100,
    order: "id asc",
  });
  if (
    !Array.isArray(payload) ||
    payload.length >= 100 ||
    !payload.every(isOdooCompany) ||
    new Set(payload.map((company) => company.id)).size !== payload.length
  ) {
    console.error("[Odoo/Companies] Company list returned an invalid or incomplete response.");
    throw new OdooApiError("Odoo a renvoyé une liste de sociétés invalide ou incomplète.");
  }

  cachedCompanies = payload.reduce<FiSafiCompany[]>((companies, record) => {
    if (record.parent_id !== false) return companies;
    const type = classifyCompany(record.name);
    if (type) companies.push({ id: record.id, name: record.name, type });
    return companies;
  }, []);
  cacheExpiresAt = Date.now() + 60_000;
  return cachedCompanies;
}
