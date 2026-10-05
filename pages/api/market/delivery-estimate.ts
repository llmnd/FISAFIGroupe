import type { NextApiRequest, NextApiResponse } from "next";
import { getMarketDeliveryEstimate, isDeliveryCoordinates } from "../../../lib/marketDelivery";
import { authenticateMarketUser, MarketAuthError } from "../../../lib/marketAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  try {
    await authenticateMarketUser(req);
  } catch (error) {
    if (error instanceof MarketAuthError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("[Market/Auth] Unexpected delivery estimate authentication error:", error);
    return res.status(502).json({ error: "Impossible de vérifier votre compte." });
  }

  const coordinates = req.body?.coordinates;
  if (!isDeliveryCoordinates(coordinates)) {
    return res.status(400).json({ error: "Choisissez une position valide dans la zone de Dakar." });
  }

  try {
    const estimate = await getMarketDeliveryEstimate(coordinates);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(estimate);
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Le calcul de trajet est momentanément indisponible.";
    return res.status(503).json({ error: message });
  }
}
