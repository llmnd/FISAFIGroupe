import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Méthode non autorisée." });
  }
  const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) {
    return res.status(503).json({ success: false, error: "Le service de connexion n’est pas configuré." });
  }
  try {
    const response = await fetch(`${backendUrl.replace(/\/$/, "")}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
      signal: AbortSignal.timeout(10_000),
    });
    const payload: unknown = await response.json();
    return res.status(response.status).json(payload);
  } catch (error) {
    console.error("[Auth] Password reset proxy failed:", error);
    return res.status(502).json({ success: false, error: "Impossible de réinitialiser votre mot de passe." });
  }
}
