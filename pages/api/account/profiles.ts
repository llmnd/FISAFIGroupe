import type { NextApiRequest, NextApiResponse } from "next";
import { UserProfile } from "@prisma/client";
import { prisma } from "@/backend/lib/db";
import { authenticateMarketUser, MarketAuthError } from "@/lib/marketAuth";

type ProfileName = "MARKET_CUSTOMER" | "TRAINING_PARTICIPANT";

function isProfileName(value: unknown): value is ProfileName {
  return value === "MARKET_CUSTOMER" || value === "TRAINING_PARTICIPANT";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  try {
    const account = await authenticateMarketUser(req);
    const profile = req.body && typeof req.body === "object" ? req.body.profile : undefined;
    if (!isProfileName(profile)) {
      return res.status(400).json({ error: "Le profil demandé est invalide." });
    }

    const requestedProfile = profile === "MARKET_CUSTOMER"
      ? UserProfile.MARKET_CUSTOMER
      : UserProfile.TRAINING_PARTICIPANT;
    const user = await prisma.user.findUnique({
      where: { id: account.id },
      select: { id: true, email: true, profiles: true },
    });
    if (!user || user.email.toLowerCase() !== account.email.toLowerCase()) {
      return res.status(404).json({ error: "Votre compte n’est plus disponible." });
    }

    const profiles = [...new Set([...user.profiles, requestedProfile])];
    if (
      profiles.length !== user.profiles.length ||
      !user.profiles.includes(requestedProfile)
    ) {
      await prisma.user.update({
        where: { id: user.id },
        data: { profiles: { set: profiles } },
      });
    }

    return res.status(200).json({ profiles });
  } catch (error) {
    if (error instanceof MarketAuthError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("[Account/Profiles] Could not update account profiles:", error);
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2022"
    ) {
      return res.status(503).json({
        error: "La configuration des espaces du compte n’est pas encore appliquée sur le serveur. Réessayez plus tard ou contactez le support.",
      });
    }
    return res.status(503).json({ error: "Impossible de mettre à jour les profils du compte." });
  }
}
