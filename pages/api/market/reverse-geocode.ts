import type { NextApiRequest, NextApiResponse } from "next";
import { isDeliveryCoordinates } from "../../../lib/marketDelivery";
import { authenticateMarketUser, MarketAuthError } from "../../../lib/marketAuth";

function isNominatimResponse(value: unknown): value is { address: Record<string, unknown> } {
  return (
    typeof value === "object" &&
    value !== null &&
    "address" in value &&
    typeof value.address === "object" &&
    value.address !== null
  );
}

function isReverseGeocodeResult(value: unknown): value is { address: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "address" in value &&
    typeof value.address === "string" &&
    value.address.trim().length >= 3
  );
}

function getAddressPart(address: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = address[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function formatAddress(address: Record<string, unknown>): string {
  const street = getAddressPart(address, "road", "pedestrian", "footway");
  const houseNumber = getAddressPart(address, "house_number");
  const neighborhoods = [
    getAddressPart(address, "neighbourhood", "quarter", "residential", "hamlet"),
    getAddressPart(address, "suburb"),
    getAddressPart(address, "city_district"),
  ].filter((part): part is string => Boolean(part));
  const city = getAddressPart(address, "city", "town", "village", "municipality", "county");
  const parts = [
    street ? [street, houseNumber].filter(Boolean).join(" ") : "",
    ...neighborhoods,
    city,
  ].filter((part): part is string => Boolean(part));
  return parts.filter((part, index) =>
    parts.findIndex((candidate) => candidate.toLocaleLowerCase("fr") === part.toLocaleLowerCase("fr")) === index
  ).join(", ");
}

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
    console.error("[Market/Delivery] Unexpected reverse geocoding authentication error:", error);
    return res.status(502).json({ error: "Impossible de vérifier votre compte." });
  }

  const coordinates = req.body?.coordinates;
  if (!isDeliveryCoordinates(coordinates)) {
    return res.status(400).json({ error: "Choisissez une position valide dans la zone de Dakar." });
  }

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("zoom", "18");
  url.searchParams.set("accept-language", "fr");
  url.searchParams.set("lat", String(coordinates.latitude));
  url.searchParams.set("lon", String(coordinates.longitude));

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "FiSAFiMarket/1.0 (+https://fisafigroupe.com)",
        "Accept-Language": "fr",
      },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) {
      console.error(`[Market/Delivery] Reverse geocoding service returned HTTP ${response.status}.`);
      return res.status(503).json({ error: "L’adresse ne peut pas être détectée pour le moment." });
    }

    const payload: unknown = await response.json();
    if (!isNominatimResponse(payload)) {
      return res.status(404).json({ error: "Aucune adresse détaillée n’a été trouvée à cet endroit." });
    }

    const address = formatAddress(payload.address);
    if (!address) {
      return res.status(404).json({ error: "Aucune adresse détaillée n’a été trouvée à cet endroit." });
    }

    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).json({ address });
  } catch (error) {
    console.error("[Market/Delivery] Reverse geocoding request failed:", error);
    return res.status(503).json({ error: "L’adresse ne peut pas être détectée pour le moment." });
  }
}
