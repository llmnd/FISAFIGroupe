import type { NextApiRequest, NextApiResponse } from "next";
import { listFiSafiCompanies } from "@/lib/odooCompanies";
import { OdooApiError } from "@/lib/marketOdoo";

const IMAGE_CACHE_CONTROL =
  "public, max-age=604800, s-maxage=2592000, stale-while-revalidate=2592000";
const MISSING_IMAGE_CACHE_CONTROL = "public, max-age=300, s-maxage=300";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  const productId = req.query.id;
  if (
    typeof productId !== "string" ||
    !/^[1-9]\d*$/.test(productId) ||
    !Number.isSafeInteger(Number(productId))
  ) {
    return res.status(400).json({ error: "Identifiant produit invalide." });
  }

  const apiKey = process.env.ODOO_API_KEY?.trim();
  if (!apiKey) {
    return res.status(503).json({ error: "Le catalogue Market n’est pas configuré." });
  }

  let odooOrigin: string;
  try {
    const configuredUrl = new URL(process.env.ODOO_URL || "https://fisafigroupe.odoo.com");
    if (configuredUrl.protocol !== "https:" || configuredUrl.username || configuredUrl.password) {
      throw new Error("ODOO_URL must be an HTTPS URL without embedded credentials.");
    }
    odooOrigin = configuredUrl.origin;
  } catch (error) {
    console.error("[Market/Odoo] Invalid Odoo URL configuration for product image:", error);
    return res.status(500).json({ error: "La configuration du catalogue Odoo est invalide." });
  }

  try {
    const companies = await listFiSafiCompanies();
    const market = companies.find((company) => company.type === "market");
    if (!market) {
      throw new OdooApiError("La société FiSAFi Market n’est pas configurée dans Odoo.", 503);
    }
    const response = await fetch(`${odooOrigin}/json/2/product.template/search_read`, {
      method: "POST",
      headers: {
        Authorization: `bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        domain: [
          ["id", "=", Number(productId)],
          ["company_id", "in", [false, market.id]],
          ["active", "=", true],
          ["sale_ok", "=", true],
          ["available_in_pos", "=", true],
        ],
        fields: ["image_512"],
        limit: 1,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      console.error(`[Market/Odoo] Product image request failed with HTTP ${response.status}.`);
      return res.status(502).json({ error: "Impossible de charger l’image du produit." });
    }

    const payload: unknown = await response.json();
    if (!Array.isArray(payload) || payload.length === 0) {
      res.setHeader("Cache-Control", MISSING_IMAGE_CACHE_CONTROL);
      return res.status(404).json({ error: "Ce produit n’a pas de photo." });
    }

    const firstProduct: unknown = payload[0];
    if (!firstProduct || typeof firstProduct !== "object" || !("image_512" in firstProduct)) {
      console.error("[Market/Odoo] Product image response has an unexpected format.");
      return res.status(502).json({ error: "L’image du produit renvoyée par Odoo est invalide." });
    }

    const encodedImage = firstProduct.image_512;
    if (encodedImage === false || encodedImage === null || encodedImage === "") {
      res.setHeader("Cache-Control", MISSING_IMAGE_CACHE_CONTROL);
      return res.status(404).json({ error: "Ce produit n’a pas de photo." });
    }
    if (typeof encodedImage !== "string" || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encodedImage)) {
      console.error("[Market/Odoo] Product image response has an unexpected content type.");
      return res.status(502).json({ error: "L’image du produit renvoyée par Odoo est invalide." });
    }

    const image = Buffer.from(encodedImage, "base64");
    const contentType =
      image.length >= 3 && image[0] === 0xff && image[1] === 0xd8 && image[2] === 0xff
        ? "image/jpeg"
        : image.length >= 8 &&
            image.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
          ? "image/png"
          : image.length >= 12 &&
              image.toString("ascii", 0, 4) === "RIFF" &&
              image.toString("ascii", 8, 12) === "WEBP"
            ? "image/webp"
            : image.length >= 6 && /^GIF8[79]a$/.test(image.toString("ascii", 0, 6))
              ? "image/gif"
              : null;
    if (!contentType) {
      console.error("[Market/Odoo] Product image response is not a supported image.");
      return res.status(502).json({ error: "L’image du produit renvoyée par Odoo est invalide." });
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", IMAGE_CACHE_CONTROL);
    return res.status(200).send(image);
  } catch (error) {
    console.error("[Market/Odoo] Product image request failed:", error);
    return res.status(error instanceof OdooApiError ? error.statusCode : 502).json({
      error: error instanceof OdooApiError ? error.message : "Impossible de joindre l’image du produit.",
    });
  }
}
