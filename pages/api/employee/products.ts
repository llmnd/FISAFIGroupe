import type { NextApiRequest, NextApiResponse } from "next";
import {
  authenticateEmployee,
  canViewProductCost,
  EmployeeAuthError,
  requireProductCostWrite,
  requireProductRead,
  requireProductWrite,
} from "@/lib/employeeAuth";
import { getERPProvider } from "@/lib/erp";
import { OdooApiError } from "@/lib/marketOdoo";
import {
  assertEmployeeProductCompany,
  EmployeeCompanyError,
  resolveEmployeeCompany,
} from "@/lib/employeeCompany";

const PAGE_SIZE = 24;
const MAX_OFFSET = 100_000;

function getSingleQueryValue(value: string | string[] | undefined): string | null {
  return typeof value === "string" ? value : null;
}

function toPositiveInteger(value: string | null, fallback: number): number {
  if (!value || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function getProductIdFromRequest(req: NextApiRequest): number | null {
  const directId = getSingleQueryValue(req.query.id);
  if (directId && /^\d+$/.test(directId)) return Number(directId);
  const bodyId = req.body && typeof req.body === "object" && "id" in req.body && typeof req.body.id === "number" ? req.body.id : null;
  return bodyId && Number.isSafeInteger(bodyId) && bodyId > 0 ? bodyId : null;
}

function isProductUpdatePayload(value: unknown): value is {
  name?: string;
  reference?: string | null;
  barcode?: string | null;
  categoryId?: number | null;
  salesPrice?: number;
  costPrice?: number | null;
  active?: boolean;
} {
  if (!value || typeof value !== "object") return false;
  const input = value as Record<string, unknown>;
  return (
    (!("name" in input) || typeof input.name === "string") &&
    (!("reference" in input) || input.reference === null || typeof input.reference === "string") &&
    (!("barcode" in input) || input.barcode === null || typeof input.barcode === "string") &&
    (!("categoryId" in input) || input.categoryId === null || Number.isSafeInteger(input.categoryId)) &&
    (!("salesPrice" in input) || (typeof input.salesPrice === "number" && Number.isFinite(input.salesPrice))) &&
    (!("costPrice" in input) || input.costPrice === null || (typeof input.costPrice === "number" && Number.isFinite(input.costPrice))) &&
    (!("active" in input) || typeof input.active === "boolean")
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");

  try {
    const account = await authenticateEmployee(req);
    const company = await resolveEmployeeCompany(req);
    const productId = getProductIdFromRequest(req);

    if (req.method === "GET") {
      requireProductRead(account);
      if (productId) {
        const product = await getERPProvider().getProduct(productId, company.id);
        if (!canViewProductCost(account)) product.costPrice = null;
        return res.status(200).json({ product });
      }

      const search = (getSingleQueryValue(req.query.search) ?? "").trim().slice(0, 100);
      const categoryId = getSingleQueryValue(req.query.categoryId);
      const rawOffset = getSingleQueryValue(req.query.offset) ?? "0";
      const rawLimit = getSingleQueryValue(req.query.limit) ?? String(PAGE_SIZE);
      const onlyAvailable = getSingleQueryValue(req.query.onlyAvailable) === "true";
      const parsedCategoryId = categoryId && /^\d+$/.test(categoryId) ? Number(categoryId) : null;
      const offset = toPositiveInteger(rawOffset, 0);
      const limit = toPositiveInteger(rawLimit, PAGE_SIZE);

      if (!Number.isSafeInteger(offset) || offset > MAX_OFFSET) {
        return res.status(400).json({ error: "La page demandée est hors limites." });
      }
      if (!Number.isSafeInteger(limit) || limit < 1 || limit > 200) {
        return res.status(400).json({ error: "La taille de page est invalide." });
      }

      const page = await getERPProvider().getProducts({
        companyId: company.id,
        search,
        categoryId: parsedCategoryId,
        onlyAvailable,
        offset,
        limit,
      });
      if (!canViewProductCost(account)) {
        page.products = page.products.map((product) => ({ ...product, costPrice: null }));
      }
      return res.status(200).json(page);
    }

    if (req.method === "PATCH") {
      requireProductWrite(account);
      if (!productId) {
        return res.status(400).json({ error: "L’identifiant produit est invalide." });
      }
      const payload = req.body && typeof req.body === "object" ? req.body : {};
      if (!isProductUpdatePayload(payload)) {
        return res.status(400).json({ error: "Les données de mise à jour sont invalides." });
      }
      if ("costPrice" in payload) requireProductCostWrite(account);
      await assertEmployeeProductCompany(productId, company.id);
      const product = await getERPProvider().updateProduct(productId, payload, company.id);
      if (!canViewProductCost(account)) product.costPrice = null;
      return res.status(200).json({ product });
    }

    if (req.method === "POST") {
      requireProductWrite(account);
      if (!productId) {
        return res.status(400).json({ error: "L’identifiant produit est invalide." });
      }
      const payload = req.body && typeof req.body === "object" && "imageBase64" in req.body
        ? req.body.imageBase64
        : null;
      if (typeof payload !== "string" || !payload.trim()) {
        return res.status(400).json({ error: "Une image valide est requise." });
      }
      await assertEmployeeProductCompany(productId, company.id);
      const product = await getERPProvider().updateProductImage(productId, payload, company.id);
      return res.status(200).json({ product });
    }

    if (req.method === "DELETE") {
      requireProductWrite(account);
      if (!productId) {
        return res.status(400).json({ error: "L’identifiant produit est invalide." });
      }
      await assertEmployeeProductCompany(productId, company.id);
      const product = await getERPProvider().removeProductImage(productId, company.id);
      return res.status(200).json({ product });
    }

    res.setHeader("Allow", "GET, PATCH, POST, DELETE");
    return res.status(405).json({ error: "Méthode non autorisée." });
  } catch (error) {
    if (error instanceof EmployeeAuthError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error instanceof EmployeeCompanyError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error instanceof OdooApiError) {
      console.error("[Employee/Products] Odoo request failed:", error);
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("[Employee/Products] Unexpected catalog error:", error);
    return res.status(502).json({ error: "Le catalogue produits est temporairement indisponible." });
  }
}
