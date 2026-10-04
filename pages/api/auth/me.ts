import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ success: false, error: "Méthode non autorisée." });
  }
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
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
    return res.status(response.status).json(payload);
  } catch (error) {
    console.error("[Auth] Session validation proxy failed:", error);
    return res.status(502).json({ success: false, error: "Impossible de vérifier votre session." });
  }
}
