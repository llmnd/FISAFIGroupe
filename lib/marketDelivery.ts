export type DeliveryCoordinates = {
  latitude: number;
  longitude: number;
};

export type DeliveryEstimate = {
  origin: DeliveryCoordinates;
  distanceKm: number;
  fee: number;
  serviceable: boolean;
  route: [number, number][];
};

export const MARKET_ORIGIN: DeliveryCoordinates = {
  latitude: 14.7334942,
  longitude: -17.4671607,
};

export function getMarketOrigin(): DeliveryCoordinates {
  const latitude = process.env.MARKET_ORIGIN_LATITUDE;
  const longitude = process.env.MARKET_ORIGIN_LONGITUDE;
  if (latitude === undefined && longitude === undefined) return MARKET_ORIGIN;
  if (latitude === undefined || longitude === undefined) {
    throw new Error("Configurez ensemble MARKET_ORIGIN_LATITUDE et MARKET_ORIGIN_LONGITUDE.");
  }

  const origin = { latitude: Number(latitude), longitude: Number(longitude) };
  if (!isCoordinate(origin)) {
    throw new Error("Les coordonnées configurées pour FiSAFi Market ne sont pas valides pour Dakar.");
  }
  return origin;
}

const DELIVERY_ZONES = [
  { maxKm: 3, fee: 1000 },
  { maxKm: 7, fee: 1500 },
  { maxKm: 12, fee: 2500 },
  { maxKm: 15, fee: 3500 },
] as const;

function isCoordinate(value: DeliveryCoordinates): boolean {
  return (
    Number.isFinite(value.latitude) &&
    value.latitude >= 14.45 &&
    value.latitude <= 14.9 &&
    Number.isFinite(value.longitude) &&
    value.longitude >= -17.8 &&
    value.longitude <= -17.1
  );
}

export function isDeliveryCoordinates(value: unknown): value is DeliveryCoordinates {
  if (!value || typeof value !== "object") return false;
  const coordinates = value as Partial<DeliveryCoordinates>;
  return (
    typeof coordinates.latitude === "number" &&
    typeof coordinates.longitude === "number" &&
    isCoordinate(coordinates as DeliveryCoordinates)
  );
}

type OsrmRouteResponse = {
  code: string;
  routes: Array<{ distance: number; geometry: { coordinates: [number, number][] } }>;
};

function isOsrmRouteResponse(value: unknown): value is OsrmRouteResponse {
  if (!value || typeof value !== "object" || !("code" in value) || value.code !== "Ok") return false;
  if (!("routes" in value) || !Array.isArray(value.routes) || value.routes.length === 0) return false;
  const route = value.routes[0];
  return (
    !!route &&
    typeof route === "object" &&
    "distance" in route &&
    typeof route.distance === "number" &&
    Number.isFinite(route.distance) &&
    route.distance > 0 &&
    "geometry" in route &&
    !!route.geometry &&
    typeof route.geometry === "object" &&
    "coordinates" in route.geometry &&
    Array.isArray(route.geometry.coordinates) &&
    route.geometry.coordinates.length > 1 &&
    route.geometry.coordinates.every(
      (point: unknown) =>
        Array.isArray(point) &&
        point.length === 2 &&
        typeof point[0] === "number" &&
        Number.isFinite(point[0]) &&
        typeof point[1] === "number" &&
        Number.isFinite(point[1]),
    )
  );
}

export async function getMarketDeliveryEstimate(
  destination: DeliveryCoordinates,
): Promise<DeliveryEstimate> {
  if (!isDeliveryCoordinates(destination)) {
    throw new Error("La position choisie doit se trouver dans la zone de Dakar.");
  }

  const origin = getMarketOrigin();
  const routerUrl = (process.env.OSRM_ROUTING_URL || "https://router.project-osrm.org").replace(/\/$/, "");
  let response: Response;
  try {
    response = await fetch(
      `${routerUrl}/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=simplified&geometries=geojson`,
      { signal: AbortSignal.timeout(10_000) },
    );
  } catch (error) {
    console.error("[Market/Delivery] Road route request failed:", error);
    throw new Error("Le calcul de trajet est momentanément indisponible. Réessayez dans un instant.");
  }

  if (!response.ok) {
    console.error(`[Market/Delivery] Road route service returned HTTP ${response.status}.`);
    throw new Error("Le calcul de trajet est momentanément indisponible. Réessayez dans un instant.");
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    console.error("[Market/Delivery] Road route service returned invalid JSON:", error);
    throw new Error("Le calcul de trajet est momentanément indisponible. Réessayez dans un instant.");
  }
  if (!isOsrmRouteResponse(payload)) {
    throw new Error("Aucun trajet routier n’a pu être calculé vers cette position.");
  }

  const roadDistanceKm = payload.routes[0].distance / 1000;
  const distanceKm = Math.round(roadDistanceKm * 100) / 100;
  const zone = DELIVERY_ZONES.find(({ maxKm }) => roadDistanceKm <= maxKm);
  return {
    origin,
    distanceKm,
    fee: zone?.fee ?? 0,
    serviceable: Boolean(zone),
    route: payload.routes[0].geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude]),
  };
}
