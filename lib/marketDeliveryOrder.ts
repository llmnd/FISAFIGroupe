import type { DeliveryCoordinates } from "@/lib/marketDelivery";

export type MarketOrderDeliveryDetails = {
  feeEstimate: number | null;
  address: string | null;
  coordinates: DeliveryCoordinates | null;
};

export function getMarketOrderDeliveryDetails(note: string): MarketOrderDeliveryDetails {
  const feeMatch = note.match(/Frais de livraison estimés\s*:\s*(\d[\d\s\u00a0]*(?:[,.]\d{1,2})?)\s*(?:FCFA|XOF)/i);
  const feeValue = feeMatch
    ? Number(feeMatch[1].replace(/[\s\u00a0]/g, "").replace(",", "."))
    : NaN;
  const feeEstimate = Number.isFinite(feeValue) && feeValue >= 0 ? feeValue : null;

  const addressMatch = note.match(/Adresse\s*:\s*([^\r\n]+)/i);
  const address = addressMatch?.[1]?.trim() || null;
  const coordinatesMatch = note.match(
    /Position de livraison\s*:\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/i,
  );
  const latitude = coordinatesMatch ? Number(coordinatesMatch[1]) : NaN;
  const longitude = coordinatesMatch ? Number(coordinatesMatch[2]) : NaN;
  const coordinates =
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180
      ? { latitude, longitude }
      : null;

  return { feeEstimate, address, coordinates };
}
