import type { DeliveryCoordinates } from "@/lib/marketDelivery";

export const MARKET_DELIVERY_SELECTION_KEY = "fisafi-market-delivery-selection";

export type MarketDeliverySelection = {
  address: string;
  coordinates: DeliveryCoordinates | null;
};

export function isMarketDeliverySelection(value: unknown): value is MarketDeliverySelection {
  if (!value || typeof value !== "object") return false;
  const selection = value as Partial<MarketDeliverySelection>;
  if (typeof selection.address !== "string") return false;
  if (selection.coordinates === null) return true;
  return (
    !!selection.coordinates &&
    typeof selection.coordinates.latitude === "number" &&
    Number.isFinite(selection.coordinates.latitude) &&
    typeof selection.coordinates.longitude === "number" &&
    Number.isFinite(selection.coordinates.longitude)
  );
}
