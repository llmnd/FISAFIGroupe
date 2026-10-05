import type { NextApiRequest, NextApiResponse } from "next";
import { clearAuthCookie } from "@/lib/authCookie";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Méthode non autorisée." });
  }

  clearAuthCookie(res);
  return res.status(200).json({ success: true });
}
