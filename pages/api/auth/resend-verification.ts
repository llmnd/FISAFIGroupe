import type { NextApiRequest, NextApiResponse } from "next";
import { getRequestAuthorization } from "@/lib/authCookie";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Méthode non autorisée." });
  }
  const authorization = getRequestAuthorization(req);
  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Connexion requise." });
  }
  const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) {
    return res.status(503).json({ success: false, error: "Le service de connexion n’est pas configuré." });
  }

  try {
    const response = await fetch(
      `${backendUrl.replace(/\/$/, "")}/api/auth/resend-verification`,
      {
        method: "POST",
        headers: { Authorization: authorization },
        signal: AbortSignal.timeout(10_000),
      },
    );
    const payload: unknown = await response.json();
    return res.status(response.status).json(payload);
  } catch (error) {
    console.error("[Auth] Email verification resend proxy failed:", error);
    return res.status(502).json({ success: false, error: "Impossible d’envoyer le lien de vérification." });
  }
}
