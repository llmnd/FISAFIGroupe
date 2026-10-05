import type { NextApiRequest, NextApiResponse } from "next";
import {
  AUTH_MIGRATION_COOKIE_NAME,
  setAuthCookie,
} from "@/lib/authCookie";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Méthode non autorisée." });
  }

  if (req.cookies[AUTH_MIGRATION_COOKIE_NAME]) {
    return res.status(409).json({ success: false, error: "La migration de session a déjà été effectuée." });
  }

  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ") || !authorization.slice(7).trim()) {
    return res.status(401).json({ success: false, error: "Connexion requise." });
  }

  const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) {
    return res.status(503).json({ success: false, error: "Le service de connexion n’est pas configuré." });
  }

  try {
    const response = await fetch(`${backendUrl.replace(/\/$/, "")}/api/auth/me`, {
      headers: { Authorization: authorization },
      signal: AbortSignal.timeout(10_000),
    });
    const payload: unknown = await response.json();
    if (!response.ok) return res.status(response.status).json(payload);

    setAuthCookie(req, res, authorization.slice(7).trim());
    return res.status(200).json(payload);
  } catch (error) {
    console.error("[Auth] Legacy session migration failed:", error);
    return res.status(502).json({ success: false, error: "Impossible de migrer votre session." });
  }
}
