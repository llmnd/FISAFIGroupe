import type { NextApiRequest, NextApiResponse } from "next";
import { isDeliveryCoordinates, type DeliveryCoordinates } from "../../../lib/marketDelivery";
import { authenticateMarketUser, MarketAuthError } from "../../../lib/marketAuth";

type LocationResult = {
  coordinates: DeliveryCoordinates;
  label: string;
};

type NominatimSearchResult = {
  lat: string;
  lon: string;
  display_name: string;
};

function isNominatimSearchResults(value: unknown): value is NominatimSearchResult[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        "lat" in item &&
        typeof item.lat === "string" &&
        "lon" in item &&
        typeof item.lon === "string" &&
        "display_name" in item &&
        typeof item.display_name === "string",
    )
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  try {
    await authenticateMarketUser(req);
  } catch (error) {
    if (error instanceof MarketAuthError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("[Market/Delivery] Unexpected location search authentication error:", error);
    return res.status(502).json({ error: "Impossible de vérifier votre compte." });
  }

  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (query.length < 3 || query.length > 120) {
    return res.status(400).json({ error: "Saisissez une adresse ou un lieu (3 à 120 caractères)." });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "sn");
  url.searchParams.set("viewbox", "-17.8,14.9,-17.1,14.45");
  url.searchParams.set("bounded", "1");
  url.searchParams.set("limit", "5");
  url.searchParams.set("accept-language", "fr");
  url.searchParams.set("q", query);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "FiSAFiMarket/1.0 (+https://fisafigroupe.com)",
        "Accept-Language": "fr",
      },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) {
      console.error(`[Market/Delivery] Location search service returned HTTP ${response.status}.`);
      return res.status(503).json({ error: "La recherche de lieu est momentanément indisponible." });
    }

    const payload: unknown = await response.json();
    if (!isNominatimSearchResults(payload)) {
      console.error("[Market/Delivery] Location search service returned an invalid response.");
      return res.status(503).json({ error: "La recherche de lieu est momentanément indisponible." });
    }

    const results: LocationResult[] = payload.flatMap((item) => {
      const coordinates = {
        latitude: Number(item.lat),
        longitude: Number(item.lon),
      };
      const label = item.display_name.trim();
      return isDeliveryCoordinates(coordinates) && label
        ? [{ coordinates, label }]
        : [];
    });

    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).json({ results });
  } catch (error) {
    console.error("[Market/Delivery] Location search request failed:", error);
    return res.status(503).json({ error: "La recherche de lieu est momentanément indisponible." });
  }
}
