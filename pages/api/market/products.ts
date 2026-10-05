import type { NextApiRequest, NextApiResponse } from "next";
import { callOdoo, getTemplateStock, OdooApiError } from "@/lib/marketOdoo";
import { listFiSafiCompanies } from "@/lib/odooCompanies";

type OdooProduct = {
  id: number;
  name: string;
  list_price: number;
  categ_id: [number, string] | false;
  uom_name: string;
  image_128: string | false | null;
  compare_list_price: number;
  write_date: string;
  company_id: [number, string] | false;
};

type MarketProduct = {
  id: number;
  name: string;
  price: number;
  categoryName: string | null;
  unitName: string;
  hasImage: boolean;
  imageUrl: string;
  isPromotion: boolean;
  availableQuantity: number;
  variantChoiceRequired: boolean;
};

type ApiResponse = { products?: MarketProduct[]; error?: string };

const ODOO_PRODUCT_LIMIT = 2_000;

function isOdooProduct(value: unknown): value is OdooProduct {
  if (!value || typeof value !== "object") return false;
  const product = value as Partial<OdooProduct>;
  return (
    Number.isInteger(product.id) &&
    typeof product.name === "string" &&
    typeof product.list_price === "number" &&
    Number.isFinite(product.list_price) &&
    (product.categ_id === false ||
      (Array.isArray(product.categ_id) &&
        Number.isInteger(product.categ_id[0]) &&
        typeof product.categ_id[1] === "string")) &&
    typeof product.uom_name === "string" &&
    (typeof product.image_128 === "string" || product.image_128 === false || product.image_128 === null) &&
    typeof product.compare_list_price === "number" &&
    typeof product.write_date === "string" &&
    (product.company_id === false ||
      (Array.isArray(product.company_id) &&
        Number.isSafeInteger(product.company_id[0]) &&
        typeof product.company_id[1] === "string"))
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  try {
    const companies = await listFiSafiCompanies();
    const market = companies.find((company) => company.type === "market");
    if (!market) throw new OdooApiError("La société FiSAFi Market n’est pas configurée dans Odoo.", 503);

    const payload: unknown = await callOdoo("product.template", "search_read", {
      domain: [
        ["active", "=", true],
        ["sale_ok", "=", true],
        ["available_in_pos", "=", true],
        ["company_id", "in", [false, market.id]],
      ],
      fields: [
        "id", "name", "list_price", "categ_id", "uom_name", "image_128",
        "compare_list_price", "write_date", "company_id",
      ],
      limit: ODOO_PRODUCT_LIMIT,
      order: "name asc",
    });

    if (
      !Array.isArray(payload) ||
      !payload.every(isOdooProduct) ||
      payload.some((product) =>
        product.company_id !== false && product.company_id[0] !== market.id
      )
    ) {
      console.error("[Market/Odoo] Product response has an unexpected format.");
      return res.status(502).json({ error: "Le catalogue Odoo a renvoyé des données invalides." });
    }

    const stockByTemplate = await getTemplateStock(payload.map((product) => product.id));
    const products = payload.map((product) => {
      const categoryName = product.categ_id ? product.categ_id[1] : null;
      return {
        id: product.id,
        name: product.name,
        price: product.list_price,
        categoryName,
        unitName: product.uom_name,
        hasImage: typeof product.image_128 === "string" && product.image_128.length > 0,
        imageUrl: `/api/market/products/${product.id}/image?v=${encodeURIComponent(product.write_date)}`,
        isPromotion: product.compare_list_price > product.list_price,
        availableQuantity: stockByTemplate.get(product.id)?.availableQuantity ?? 0,
        variantChoiceRequired: (stockByTemplate.get(product.id)?.variants.length ?? 0) > 1,
      };
    });

    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=300");
    return res.status(200).json({ products });
  } catch (error) {
    if (error instanceof OdooApiError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("[Market/Odoo] Product request failed:", error);
    return res.status(502).json({ error: "Impossible de joindre le catalogue Odoo." });
  }
}
