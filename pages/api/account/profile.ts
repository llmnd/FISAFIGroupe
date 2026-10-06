import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/backend/lib/db";
import { authenticateMarketUser, MarketAuthError } from "@/lib/marketAuth";

function isValidPhone(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  return /^\+?[\d\s().-]+$/.test(trimmed) && digits.length >= 8 && digits.length <= 15;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "PATCH") {
    res.setHeader("Allow", "PATCH");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  try {
    const account = await authenticateMarketUser(req);
    const phone = req.body && typeof req.body === "object" ? req.body.phone : undefined;
    if (!isValidPhone(phone)) {
      return res.status(400).json({ error: "Saisissez un numéro de téléphone valide." });
    }

    const user = await prisma.user.findUnique({
      where: { id: account.id },
      select: { id: true, email: true },
    });
    if (!user || user.email.toLowerCase() !== account.email.toLowerCase()) {
      return res.status(404).json({ error: "Votre compte n’est plus disponible." });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { phone: phone.trim() },
      select: { phone: true },
    });
    return res.status(200).json(updatedUser);
  } catch (error) {
    if (error instanceof MarketAuthError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("[Account/Profile] Could not update the account phone:", error);
    if (error && typeof error === "object" && "code" in error && error.code === "P2022") {
      return res.status(503).json({
        error: "La mise à jour de la base du compte n’est pas encore appliquée. Réessayez plus tard.",
      });
    }
    return res.status(503).json({ error: "Impossible de mettre à jour votre numéro." });
  }
}
