import type { NextApiRequest, NextApiResponse } from "next";

type OdooProduct = {
  id: number;
  name: string;
  list_price: number;
  categ_id: [number, string] | false;
  uom_name: string;
  compare_list_price: number;
};

type MarketProduct = {
  id: number;
  name: string;
  price: number;
  categoryName: string | null;
  unitName: string;
  imageUrl: string;
  isPromotion: boolean;
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
    typeof product.compare_list_price === "number"
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

  const apiKey = process.env.ODOO_API_KEY?.trim();
  if (!apiKey) {
    return res.status(503).json({ error: "Le catalogue Market n’est pas configuré." });
  }

  let odooUrl: string;
  try {
    const configuredUrl = new URL(process.env.ODOO_URL || "https://fisafigroupe.odoo.com");
    if (configuredUrl.protocol !== "https:" || configuredUrl.username || configuredUrl.password) {
      throw new Error("ODOO_URL must be an HTTPS URL without embedded credentials.");
    }
    odooUrl = configuredUrl.origin;
  } catch (error) {
    console.error("[Market/Odoo] Invalid Odoo URL configuration:", error);
    return res.status(500).json({ error: "La configuration du catalogue Odoo est invalide." });
  }

  try {
    const response = await fetch(`${odooUrl}/json/2/product.template/search_read`, {
      method: "POST",
      headers: {
        Authorization: `bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        domain: [
          ["active", "=", true],
          ["sale_ok", "=", true],
          ["available_in_pos", "=", true],
        ],
        fields: ["id", "name", "list_price", "categ_id", "uom_name", "compare_list_price"],
        limit: ODOO_PRODUCT_LIMIT,
        order: "name asc",
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      console.error(`[Market/Odoo] Product request failed with HTTP ${response.status}.`);
      return res.status(502).json({ error: "Impossible de charger le catalogue Odoo." });
    }

    const payload: unknown = await response.json();
    if (!Array.isArray(payload) || !payload.every(isOdooProduct)) {
      console.error("[Market/Odoo] Product response has an unexpected format.");
      return res.status(502).json({ error: "Le catalogue Odoo a renvoyé des données invalides." });
    }

    const products = payload.map((product) => {
      const categoryName = product.categ_id ? product.categ_id[1] : null;
      return {
        id: product.id,
        name: product.name,
        price: product.list_price,
        categoryName,
        unitName: product.uom_name,
        imageUrl: `${odooUrl}/web/image/product.template/${product.id}/image_512`,
        isPromotion: product.compare_list_price > product.list_price,
      };
    });

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json({ products });
  } catch (error) {
    console.error("[Market/Odoo] Product request failed:", error);
    return res.status(502).json({ error: "Impossible de joindre le catalogue Odoo." });
  }
}
