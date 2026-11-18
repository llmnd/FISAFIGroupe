import { createHash } from "crypto";

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
const JSON_RPC_TIMEOUT_MS = 20_000;
const LEGACY_UID_TTL_MS = 5 * 60_000;

type JsonRpcError = {
  code?: number;
  message?: string;
  data?: { name?: string; message?: string };
};

type JsonRpcResponse<T> = {
  result?: T;
  error?: JsonRpcError;
};

const legacyUidCache = new Map<string, { uid: number; expiresAt: number }>();
const legacyUidRequests = new Map<string, Promise<number>>();
let jsonRpcRequestId = 0;

export class OdooApiError extends Error {
  constructor(
    message: string,
    readonly statusCode = 502,
  ) {
    super(message);
    this.name = "OdooApiError";
  }
}

function getLegacyCredentials(): { database: string; username: string } | null {
  const database = process.env.ODOO_DB?.trim();
  const username = process.env.ODOO_USERNAME?.trim();
  return database && username ? { database, username } : null;
}

function getLegacyCacheKey(
  origin: string,
  database: string,
  username: string,
  apiKey: string,
): string {
  return createHash("sha256")
    .update(`${origin}\n${database}\n${username}\n${apiKey}`)
    .digest("hex");
}

async function postJsonRpc<T>(
  origin: string,
  body: Record<string, unknown>,
): Promise<JsonRpcResponse<T>> {
  let response: Response;
  try {
    response = await fetch(`${origin}/jsonrpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(JSON_RPC_TIMEOUT_MS),
    });
  } catch (error) {
    console.error("[Market/Odoo] JSON-RPC request failed:", error);
    throw new OdooApiError("Impossible de joindre le service FiSAFi. Réessayez dans quelques instants.");
  }

  if (!response.ok) {
    console.error(`[Market/Odoo] JSON-RPC endpoint failed with HTTP ${response.status}.`);
    throw new OdooApiError(
      `L’API JSON-RPC Odoo est indisponible (HTTP ${response.status}). Vérifiez l’adresse Odoo et sa configuration.`,
    );
  }

  try {
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new Error("Invalid JSON-RPC response.");
    }
    return payload as JsonRpcResponse<T>;
  } catch (error) {
    console.error("[Market/Odoo] JSON-RPC endpoint returned invalid JSON:", error);
    throw new OdooApiError("Le service FiSAFi a renvoyé une réponse invalide.");
  }
}

async function getLegacyUid(
  origin: string,
  database: string,
  username: string,
  apiKey: string,
): Promise<number> {
  const cacheKey = getLegacyCacheKey(origin, database, username, apiKey);
  const cached = legacyUidCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.uid;

  const pendingRequest = legacyUidRequests.get(cacheKey);
  if (pendingRequest) return pendingRequest;

  const authentication = (async () => {
    const payload = await postJsonRpc<unknown>(origin, {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "common",
        method: "authenticate",
        args: [database, username, apiKey, {}],
      },
      id: ++jsonRpcRequestId,
    });
    const uid = payload.result;
    if (!Number.isSafeInteger(uid) || Number(uid) <= 0) {
      const details = payload.error?.data?.message ?? payload.error?.message;
      console.error(
        "[Market/Odoo] JSON-RPC authentication failed.",
        typeof details === "string" ? details.slice(0, 800) : "Odoo rejected the credentials.",
      );
      throw new OdooApiError(
        "Odoo a refusé l’authentification. Vérifiez ODOO_DB, ODOO_USERNAME et la clé API.",
      );
    }

    legacyUidCache.set(cacheKey, {
      uid: Number(uid),
      expiresAt: Date.now() + LEGACY_UID_TTL_MS,
    });
    return Number(uid);
  })();

  legacyUidRequests.set(cacheKey, authentication);
  try {
    return await authentication;
  } finally {
    if (legacyUidRequests.get(cacheKey) === authentication) {
      legacyUidRequests.delete(cacheKey);
    }
  }
}

function getLegacyArguments(
  method: string,
  parameters: Record<string, unknown>,
): { args: unknown[]; kwargs: Record<string, unknown> } {
  const kwargs = { ...parameters };
  const args: unknown[] = [];

  if (method === "search_read" || method === "search_count") {
    args.push(kwargs.domain ?? []);
    delete kwargs.domain;
  } else if (method === "create") {
    const values = kwargs.vals_list ?? kwargs.vals;
    if (values === undefined) {
      throw new OdooApiError(`Les paramètres Odoo de ${method} sont invalides.`, 400);
    }
    args.push(values);
    delete kwargs.vals_list;
    delete kwargs.vals;
  } else if (method === "write") {
    if (kwargs.ids === undefined || kwargs.vals === undefined) {
      throw new OdooApiError(`Les paramètres Odoo de ${method} sont invalides.`, 400);
    }
    args.push(kwargs.ids, kwargs.vals);
    delete kwargs.ids;
    delete kwargs.vals;
  } else if (kwargs.ids !== undefined) {
    args.push(kwargs.ids);
    delete kwargs.ids;
  } else if (kwargs.orders !== undefined) {
    args.push(kwargs.orders);
    delete kwargs.orders;
  }

  return { args, kwargs };
}

async function callLegacyOdoo<T>(
  origin: string,
  apiKey: string,
  model: string,
  method: string,
  parameters: Record<string, unknown>,
): Promise<T> {
  const credentials = getLegacyCredentials();
  if (!credentials) {
    throw new OdooApiError(
      "Cette version d’Odoo nécessite JSON-RPC. Configurez ODOO_DB et ODOO_USERNAME avec ODOO_URL et ODOO_API_KEY.",
      503,
    );
  }

  const uid = await getLegacyUid(origin, credentials.database, credentials.username, apiKey);
  const { args, kwargs } = getLegacyArguments(method, parameters);
  const payload = await postJsonRpc<T>(origin, {
    jsonrpc: "2.0",
    method: "call",
    params: {
      service: "object",
      method: "execute_kw",
      args: [credentials.database, uid, apiKey, model, method, args, kwargs],
    },
    id: ++jsonRpcRequestId,
  });

  if (payload.error) {
    const details =
      payload.error.data?.message ??
      payload.error.data?.name ??
      payload.error.message ??
      "Odoo returned an RPC error.";
    console.error(
      `[Market/Odoo] JSON-RPC ${model}/${method} failed.`,
      details.slice(0, 800),
    );
    if (/access.?denied|accessdenied/i.test(details)) {
      legacyUidCache.delete(getLegacyCacheKey(
        origin,
        credentials.database,
        credentials.username,
        apiKey,
      ));
    }
    throw new OdooApiError(
      `Odoo a refusé la requête ${model}/${method}. Vérifiez les droits du compte connecté.`,
    );
  }

  if (!Object.prototype.hasOwnProperty.call(payload, "result")) {
    console.error(`[Market/Odoo] JSON-RPC ${model}/${method} returned no result.`);
    throw new OdooApiError("Le service FiSAFi a renvoyé une réponse incomplète.");
  }

  return payload.result as T;
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

  const configuredUrl = process.env.ODOO_URL?.trim();
  if (!configuredUrl) {
    throw new OdooApiError("Configurez ODOO_URL avec l’adresse de votre serveur Odoo.", 503);
  }

  let origin: string;
  try {
    const url = new URL(configuredUrl);
    if (url.protocol !== "https:" || url.username || url.password) {
      throw new Error("ODOO_URL must be an HTTPS URL without embedded credentials.");
    }
    origin = url.origin;
  } catch (error) {
    console.error("[Market/Odoo] Invalid Odoo URL configuration:", error);
    throw new OdooApiError("La configuration du catalogue FiSAFi est invalide.", 500);
  }

  let response: Response;
  for (let attempt = 0; ; attempt += 1) {
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
      throw new OdooApiError("Impossible de joindre le service FiSAFi. Réessayez dans quelques instants.");
    }

    if (
      method !== "search_read" ||
      attempt > 0 ||
      ![502, 503, 504].includes(response.status)
    ) {
      break;
    }
    console.warn(`[Market/Odoo] Retrying transient HTTP ${response.status} for ${model}/${method}.`);
    await response.body?.cancel();
    await new Promise((resolve) => setTimeout(resolve, 600));
  }

  if (response.status === 404) {
    return callLegacyOdoo<T>(origin, apiKey, model, method, parameters);
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
        `Le service FiSAFi a refusé l’accès (HTTP ${response.status}). Vérifiez les autorisations de votre compte.`,
      );
    }
    if (response.status === 429) {
      throw new OdooApiError(
        "Le service FiSAFi est temporairement très sollicité. Réessayez dans quelques instants.",
        429,
      );
    }
    if (response.status === 400 || response.status === 422) {
      throw new OdooApiError(
        `Le service FiSAFi n’a pas accepté la demande (HTTP ${response.status}). Réessayez ou contactez l’équipe FiSAFi.`,
      );
    }
    throw new OdooApiError(
      `Le service FiSAFi est indisponible (HTTP ${response.status}). Réessayez dans quelques instants.`,
    );
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    console.error(`[Market/Odoo] ${model}/${method} returned invalid JSON:`, error);
    throw new OdooApiError("Le service FiSAFi a renvoyé une réponse invalide.");
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
    throw new OdooApiError("Le catalogue FiSAFi a renvoyé des données de stock invalides.");
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
