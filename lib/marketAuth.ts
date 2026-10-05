import type { NextApiRequest } from "next";
import { getRequestAuthorization } from "@/lib/authCookie";

export type MarketUser = {
  id: string;
  email: string;
};

export class MarketAuthError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
    this.name = "MarketAuthError";
  }
}

export async function authenticateMarketUser(req: NextApiRequest): Promise<MarketUser> {
  const authorization = getRequestAuthorization(req);
  if (!authorization?.startsWith("Bearer ")) {
    throw new MarketAuthError("Connectez-vous à votre compte pour continuer.", 401);
  }

  const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) {
    throw new MarketAuthError("Le service de connexion n’est pas configuré.", 503);
  }

  let response: Response;
  try {
    response = await fetch(`${backendUrl.replace(/\/$/, "")}/api/auth/me`, {
      headers: { Authorization: authorization },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    console.error("[Market/Auth] Could not verify the account session:", error);
    throw new MarketAuthError("Impossible de vérifier votre session. Réessayez.", 503);
  }

  if (response.status === 401 || response.status === 403) {
    throw new MarketAuthError("Votre session a expiré. Connectez-vous à nouveau.", 401);
  }
  if (!response.ok) {
    console.error(`[Market/Auth] Account verification failed with HTTP ${response.status}.`);
    throw new MarketAuthError("Impossible de vérifier votre compte.", 502);
  }

  const payload: unknown = await response.json();
  if (
    !payload ||
    typeof payload !== "object" ||
    !("data" in payload) ||
    !payload.data ||
    typeof payload.data !== "object" ||
    !("id" in payload.data) ||
    typeof payload.data.id !== "string" ||
    !("email" in payload.data) ||
    typeof payload.data.email !== "string"
  ) {
    console.error("[Market/Auth] Account service returned an unexpected response.");
    throw new MarketAuthError("Le service de connexion a renvoyé une réponse invalide.", 502);
  }

  return { id: payload.data.id, email: payload.data.email };
}
