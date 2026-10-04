import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ success: false, error: "Méthode non autorisée." });
  }

  const token = req.query.token;
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) {
    return res.status(400).json({ success: false, error: "Lien de vérification invalide." });
  }
  const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) {
    return res.status(503).json({ success: false, error: "Le service de connexion n’est pas configuré." });
  }

  try {
    const response = await fetch(
      `${backendUrl.replace(/\/$/, "")}/api/auth/verify-email?token=${encodeURIComponent(token)}`,
      { signal: AbortSignal.timeout(10_000) },
    );
    const payload: unknown = await response.json();
    return res.status(response.status).json(payload);
  } catch (error) {
    console.error("[Auth] Email verification proxy failed:", error);
    return res.status(502).json({ success: false, error: "Impossible de vérifier cette adresse email." });
  }
}
