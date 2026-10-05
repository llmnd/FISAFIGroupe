import type { NextApiRequest, NextApiResponse } from "next";
import { clearAuthCookie, getRequestAuthorization } from "@/lib/authCookie";

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
    const response = await fetch(`${backendUrl.replace(/\/$/, "")}/api/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authorization },
      body: JSON.stringify(req.body),
      signal: AbortSignal.timeout(10_000),
    });
    const payload: unknown = await response.json();
    if (response.ok) clearAuthCookie(res);
    return res.status(response.status).json(payload);
  } catch (error) {
    console.error("[Auth] Password change proxy failed:", error);
    return res.status(502).json({ success: false, error: "Impossible de modifier votre mot de passe." });
  }
}
