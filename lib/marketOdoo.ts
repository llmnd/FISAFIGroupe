type OdooProductVariant = {
  id: number;
  product_tmpl_id: [number, string];
  free_qty: number;
  lst_price: number;
  tracking: string;
};

export type OdooTemplateStock = {
  availableQuantity: number;
  variants: OdooProductVariant[];
};

const ODOO_VARIANT_LIMIT = 20_000;

export class OdooApiError extends Error {
  constructor(
    message: string,
    readonly statusCode = 502,
  ) {
    super(message);
    this.name = "OdooApiError";
  }
}

export async function callOdoo<T>(
  model: string,
  method: string,
  parameters: Record<string, unknown>,
): Promise<T> {
  const apiKey = process.env.ODOO_API_KEY?.trim();
  if (!apiKey) {
    throw new OdooApiError("Le catalogue Market n’est pas configuré.", 503);
  }

  let origin: string;
  try {
    const configuredUrl = new URL(process.env.ODOO_URL || "https://fisafigroupe.odoo.com");
    if (configuredUrl.protocol !== "https:" || configuredUrl.username || configuredUrl.password) {
      throw new Error("ODOO_URL must be an HTTPS URL without embedded credentials.");
    }
    origin = configuredUrl.origin;
  } catch (error) {
    console.error("[Market/Odoo] Invalid Odoo URL configuration:", error);
    throw new OdooApiError("La configuration du catalogue Odoo est invalide.", 500);
  }

  let response: Response;
  try {
    response = await fetch(`${origin}/json/2/${model}/${method}`, {
      method: "POST",
      headers: {
        Authorization: `bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parameters),
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    console.error(`[Market/Odoo] ${model}/${method} request failed:`, error);
    throw new OdooApiError(`Impossible de joindre Odoo pendant l’appel ${model}/${method}.`);
  }

  if (!response.ok) {
    let errorDetails = "";
    try {
      const payload: unknown = await response.json();
      if (payload && typeof payload === "object") {
        const error = payload as { name?: unknown; message?: unknown };
        const name = typeof error.name === "string" ? error.name : "";
        const message = typeof error.message === "string" ? error.message : "";
        errorDetails = [name, message].filter(Boolean).join(": ").slice(0, 800);
      }
    } catch {
      errorDetails = "";
    }
    console.error(
      `[Market/Odoo] ${model}/${method} failed with HTTP ${response.status}.`,
      errorDetails || "Odoo did not return a readable error message.",
    );
    if (response.status === 401 || response.status === 403) {
      throw new OdooApiError(
        `Odoo a refusé l’accès pendant ${model}/${method} (HTTP ${response.status}). Vérifiez les droits du compte associé à la clé API.`,
      );
    }
    if (response.status === 429) {
      throw new OdooApiError(
        `Odoo limite actuellement l’appel ${model}/${method} (HTTP 429). Réessayez dans quelques instants.`,
      );
    }
    if (response.status === 400 || response.status === 422) {
      throw new OdooApiError(
        `Odoo a rejeté les données envoyées pendant ${model}/${method} (HTTP ${response.status}). Consultez les journaux du serveur FiSAFi.`,
      );
    }
    throw new OdooApiError(
      `Odoo a échoué pendant ${model}/${method} (HTTP ${response.status}). Consultez les journaux du serveur FiSAFi.`,
    );
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    console.error(`[Market/Odoo] ${model}/${method} returned invalid JSON:`, error);
    throw new OdooApiError("Odoo a renvoyé une réponse invalide.");
  }
}

function isProductVariant(value: unknown): value is OdooProductVariant {
  if (!value || typeof value !== "object") return false;
  const variant = value as Partial<OdooProductVariant>;
  return (
    Number.isInteger(variant.id) &&
    Array.isArray(variant.product_tmpl_id) &&
    Number.isInteger(variant.product_tmpl_id[0]) &&
    typeof variant.product_tmpl_id[1] === "string" &&
    typeof variant.free_qty === "number" &&
    Number.isFinite(variant.free_qty) &&
    typeof variant.lst_price === "number" &&
    Number.isFinite(variant.lst_price) &&
    typeof variant.tracking === "string"
  );
}

export async function getTemplateStock(
  templateIds: number[],
): Promise<Map<number, OdooTemplateStock>> {
  if (templateIds.length === 0) return new Map();

  const payload: unknown = await callOdoo("product.product", "search_read", {
    domain: [["product_tmpl_id", "in", templateIds], ["active", "=", true]],
    fields: ["id", "product_tmpl_id", "free_qty", "lst_price", "tracking"],
    limit: ODOO_VARIANT_LIMIT,
    order: "id asc",
  });

  if (
    !Array.isArray(payload) ||
    payload.length >= ODOO_VARIANT_LIMIT ||
    !payload.every(isProductVariant)
  ) {
    console.error("[Market/Odoo] Product stock response has an unexpected format.");
    throw new OdooApiError("Odoo a renvoyé des données de stock invalides.");
  }

  const stockByTemplate = new Map<number, OdooTemplateStock>();
  for (const variant of payload) {
    const templateId = variant.product_tmpl_id[0];
    const stock = stockByTemplate.get(templateId) ?? { availableQuantity: 0, variants: [] };
    stock.availableQuantity += Math.max(0, variant.free_qty);
    stock.variants.push(variant);
    stockByTemplate.set(templateId, stock);
  }
  return stockByTemplate;
}
