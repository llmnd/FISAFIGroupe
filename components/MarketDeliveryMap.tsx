"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { DeliveryCoordinates } from "@/lib/marketDelivery";

type Props = {
  origin: DeliveryCoordinates | null;
  destination: DeliveryCoordinates | null;
  route: [number, number][];
  onChooseDestination: (coordinates: DeliveryCoordinates) => void;
};

type TileStatus = "loading" | "ready" | "error";
type TileProvider = "osm" | "osmfr";

const MARKET_ORIGIN: DeliveryCoordinates = {
  latitude: 14.725752,
  longitude: -17.469695,
};

const TILE_URLS: Record<TileProvider, string> = {
  osm: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  osmfr: "https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
};

const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const TILE_FALLBACK_DELAY = 4000;
const TILE_ERROR_LIMIT = 8;
const INITIAL_ZOOM = 13;
const ROUTE_MAX_ZOOM = 15;

const toLatLng = (c: DeliveryCoordinates): L.LatLngTuple => [
  c.latitude,
  c.longitude,
];

const originIcon = L.divIcon({
  className: "market-map-pin-icon market-map-pin-origin",
  html: '<span aria-hidden="true">F</span>',
  iconSize: [38, 38],
  iconAnchor: [19, 36],
  popupAnchor: [0, -32],
});

const destinationIcon = L.divIcon({
  className: "market-map-pin-icon market-map-pin-destination",
  html: '<span aria-hidden="true"></span>',
  iconSize: [30, 38],
  iconAnchor: [15, 36],
  popupAnchor: [0, -32],
});

export default function MarketDeliveryMap({
  origin,
  destination,
  route,
  onChooseDestination,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const originMarkerRef = useRef<LeafletMarker | null>(null);
  const destinationMarkerRef = useRef<LeafletMarker | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const retryTilesRef = useRef<(() => void) | null>(null);
  const onChooseRef = useRef(onChooseDestination);
  // Capturé au premier rendu pour éviter une dépendance à `origin` dans l'effet de montage.
  const initialCenterRef = useRef<L.LatLngTuple>(
    toLatLng(origin ?? MARKET_ORIGIN),
  );
  const [tileStatus, setTileStatus] = useState<TileStatus>("loading");

  useEffect(() => {
    onChooseRef.current = onChooseDestination;
  }, [onChooseDestination]);

  // -------- Initialisation de la carte (une seule fois) --------
  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const map = L.map(container, {
      scrollWheelZoom: false,
      fadeAnimation: false,
      zoomControl: false,
      attributionControl: true,
      preferCanvas: false,
    }).setView(initialCenterRef.current, INITIAL_ZOOM);

    mapRef.current = map;
    map.attributionControl.setPrefix(false);
    L.control.zoom({ position: "topright" }).addTo(map);

    let activeTileLayer: L.TileLayer | null = null;
    let tileTimer: number | undefined;
    let disposed = false;

    const loadTiles = (provider: TileProvider) => {
      if (disposed) return;
      window.clearTimeout(tileTimer);
      if (activeTileLayer) {
        activeTileLayer.off();
        map.removeLayer(activeTileLayer);
        activeTileLayer = null;
      }

      setTileStatus("loading");

      const layer = L.tileLayer(TILE_URLS[provider], {
        maxZoom: 19,
        crossOrigin: true,
        attribution: TILE_ATTRIBUTION,
        detectRetina: true,
      });
      activeTileLayer = layer;

      let settled = false;
      let errorCount = 0;

      const succeed = () => {
        if (settled || disposed) return;
        settled = true;
        window.clearTimeout(tileTimer);
        setTileStatus("ready");
      };

      const fail = () => {
        if (settled || disposed) return;
        settled = true;
        window.clearTimeout(tileTimer);
        if (provider === "osm") loadTiles("osmfr");
        else setTileStatus("error");
      };

      layer.on("tileload", succeed);
      layer.on("load", succeed);
      layer.on("tileerror", () => {
        errorCount += 1;
        if (errorCount >= TILE_ERROR_LIMIT) fail();
      });

      layer.addTo(map);
      tileTimer = window.setTimeout(fail, TILE_FALLBACK_DELAY);
    };

    loadTiles("osm");
    retryTilesRef.current = () => loadTiles("osm");

    // -------- Marqueur d'origine --------
    const marketOrigin = origin ?? MARKET_ORIGIN;
    originMarkerRef.current = L.marker(toLatLng(marketOrigin), {
      icon: originIcon,
      riseOnHover: true,
      keyboard: false,
      alt: "FiSAFi Market",
    })
      .bindPopup("FiSAFi Market · Dakar 00153")
      .bindTooltip("FiSAFi Market", {
        permanent: true,
        direction: "right",
        offset: [10, -12],
        className: "market-map-tooltip market-map-tooltip-origin",
      })
      .addTo(map);

    // -------- Clic sur la carte : choisir la destination --------
    const handleMapClick = (event: L.LeafletMouseEvent) => {
      onChooseRef.current({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    };
    map.on("click", handleMapClick);

    // -------- Resize : ResizeObserver + orientation + font --------
    let resizeFrame = 0;
    const invalidateSize = () => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(() => {
        if (!disposed) map.invalidateSize({ animate: false, pan: false });
      });
    };

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(invalidateSize);
    resizeObserver?.observe(container);
    window.addEventListener("orientationchange", invalidateSize);

    const initialResizeTimer = window.setTimeout(
      () => map.invalidateSize(),
      120,
    );

    return () => {
      disposed = true;
      window.clearTimeout(tileTimer);
      window.clearTimeout(initialResizeTimer);
      window.cancelAnimationFrame(resizeFrame);
      resizeObserver?.disconnect();
      window.removeEventListener("orientationchange", invalidateSize);
      map.off("click", handleMapClick);
      map.remove();
      mapRef.current = null;
      originMarkerRef.current = null;
      destinationMarkerRef.current = null;
      routeLayerRef.current = null;
      retryTilesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------- Mise à jour du marqueur d'origine --------
  useEffect(() => {
    const marker = originMarkerRef.current;
    if (!marker || !origin) return;
    marker.setLatLng(toLatLng(origin));
  }, [origin]);

  // -------- Marqueur de destination (création + suivi) --------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !destination) return;

    const latLng = toLatLng(destination);

    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.setLatLng(latLng);
    } else {
      destinationMarkerRef.current = L.marker(latLng, {
        icon: destinationIcon,
        draggable: true,
        autoPan: true,
        autoPanPadding: [40, 40],
        riseOnHover: true,
        keyboard: false,
        title: "Déplacez pour ajuster votre adresse de livraison",
        alt: "Votre adresse de livraison",
      })
        .bindPopup("Votre adresse de livraison")
        .bindTooltip("Votre adresse", {
          permanent: true,
          direction: "right",
          offset: [8, -10],
          className: "market-map-tooltip market-map-tooltip-destination",
        })
        .on("dragend", (event) => {
          const position = (event.target as LeafletMarker).getLatLng();
          onChooseRef.current({
            latitude: position.lat,
            longitude: position.lng,
          });
        })
        .addTo(map);
    }

    // Recentrage "doux" : on ne bouge que si le point sort de la zone visible
    // (évite que la carte "saute" à chaque clic ou drag du marqueur).
    if (!map.getBounds().pad(-0.2).contains(latLng)) {
      map.panTo(latLng, { animate: true, duration: 0.4 });
    }
  }, [destination]);

  // -------- Tracé de l'itinéraire --------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    if (route.length < 2) return;

    const casing = L.polyline(route, {
      color: "#ffffff",
      weight: 12,
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round",
      interactive: false,
    });
    const line = L.polyline(route, {
      color: "#d9252a",
      weight: 6,
      opacity: 1,
      lineCap: "round",
      lineJoin: "round",
      interactive: false,
    });

    routeLayerRef.current = L.layerGroup([casing, line]).addTo(map);

    const isMobile = window.matchMedia("(max-width: 700px)").matches;
    map.fitBounds(line.getBounds(), {
      paddingTopLeft: isMobile ? [24, 100] : [420, 100],
      paddingBottomRight: isMobile
        ? [24, Math.round(window.innerHeight * 0.62)]
        : [32, 40],
      maxZoom: ROUTE_MAX_ZOOM,
      animate: true,
    });
  }, [route]);

  return (
    <div
      className="market-delivery-map"
      ref={containerRef}
      role="application"
      aria-label="Carte pour choisir et ajuster votre adresse de livraison"
    >
      {tileStatus === "loading" && (
        <div
          className="market-map-status market-map-status-loading"
          role="status"
          aria-live="polite"
        >
          <span className="market-map-spinner" aria-hidden="true" />
          <span>Chargement de la carte…</span>
        </div>
      )}
      {tileStatus === "error" && (
        <div className="market-map-status market-map-status-error" role="alert">
          <strong>Le fond de carte ne répond pas.</strong>
          <span>Vous pouvez réessayer ou utiliser votre position GPS.</span>
          <button type="button" onClick={() => retryTilesRef.current?.()}>
            Réessayer la carte
          </button>
        </div>
      )}
    </div>
  );
}