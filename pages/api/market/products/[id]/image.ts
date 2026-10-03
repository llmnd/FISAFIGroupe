import type { NextApiRequest, NextApiResponse } from "next";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

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
    const response = await fetch(
      `${odooOrigin}/web/image/product.template/${productId}/image_512`,
      { signal: AbortSignal.timeout(20_000) },
    );

    if (!response.ok) {
      console.error(`[Market/Odoo] Product image request failed with HTTP ${response.status}.`);
      return res.status(response.status === 404 ? 404 : 502).json({
        error: "Impossible de charger l’image du produit.",
      });
    }

    const contentType = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
    if (!contentType || !ALLOWED_IMAGE_TYPES.has(contentType)) {
      console.error("[Market/Odoo] Product image response has an unexpected content type.");
      return res.status(502).json({ error: "L’image du produit renvoyée par Odoo est invalide." });
    }

    const image = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000");
    return res.status(200).send(image);
  } catch (error) {
    console.error("[Market/Odoo] Product image request failed:", error);
    return res.status(502).json({ error: "Impossible de joindre l’image du produit." });
  }
}
