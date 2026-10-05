import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import L from "leaflet";
import type { DeliveryCoordinates } from "@/lib/marketDelivery";

type Props = {
  origin: DeliveryCoordinates | null;
  destination: DeliveryCoordinates | null;
  route: [number, number][];
  onChooseDestination: (coordinates: DeliveryCoordinates) => void;
};

const MARKET_ORIGIN: DeliveryCoordinates = { latitude: 14.7334942, longitude: -17.4671607 };
const originIcon = L.divIcon({
  className: "market-map-pin-icon market-map-pin-origin",
  html: '<span aria-hidden="true">F</span>',
  iconSize: [38, 38],
  iconAnchor: [19, 36],
});
const destinationIcon = L.divIcon({
  className: "market-map-pin-icon market-map-pin-destination",
  html: '<span aria-hidden="true"></span>',
  iconSize: [30, 38],
  iconAnchor: [15, 36],
});

export default function MarketDeliveryMap({ origin, destination, route, onChooseDestination }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const destinationMarkerRef = useRef<LeafletMarker | null>(null);
  const originMarkerRef = useRef<LeafletMarker | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const retryTilesRef = useRef<(() => void) | null>(null);
  const onChooseRef = useRef(onChooseDestination);
  const [tileStatus, setTileStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    onChooseRef.current = onChooseDestination;
  }, [onChooseDestination]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      fadeAnimation: false,
      zoomControl: false,
    }).setView(
      [origin?.latitude ?? MARKET_ORIGIN.latitude, origin?.longitude ?? MARKET_ORIGIN.longitude],
      13,
    );
    mapRef.current = map;
    L.control.zoom({ position: "topright" }).addTo(map);
    let activeTileLayer: L.TileLayer | null = null;
    let tileTimer: number | undefined;
    let disposed = false;

    const loadTiles = (provider: "osm" | "osmfr") => {
      if (disposed) return;
      if (tileTimer !== undefined) window.clearTimeout(tileTimer);
      if (activeTileLayer) map.removeLayer(activeTileLayer);
      setTileStatus("loading");
      const url = provider === "osm"
        ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        : "https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png";
      activeTileLayer = L.tileLayer(url, {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      let loaded = false;
      activeTileLayer.on("tileload", () => {
        loaded = true;
        if (tileTimer !== undefined) window.clearTimeout(tileTimer);
        setTileStatus("ready");
      });
      tileTimer = window.setTimeout(() => {
        if (loaded || disposed) return;
        if (provider === "osm") {
          loadTiles("osmfr");
        } else {
          setTileStatus("error");
        }
      }, 4_000);
    };
    loadTiles("osm");
    retryTilesRef.current = () => loadTiles("osm");

    const marketOrigin = origin ?? MARKET_ORIGIN;
    originMarkerRef.current = L.marker([marketOrigin.latitude, marketOrigin.longitude], { icon: originIcon })
      .bindPopup("FiSAFi Market · Liberté 6 Extension")
      .addTo(map);

    map.on("click", (event: L.LeafletMouseEvent) => {
      onChooseRef.current({ latitude: event.latlng.lat, longitude: event.latlng.lng });
    });

    const resizeTimer = window.setTimeout(() => map.invalidateSize(), 100);
    return () => {
      disposed = true;
      if (tileTimer !== undefined) window.clearTimeout(tileTimer);
      window.clearTimeout(resizeTimer);
      map.remove();
      mapRef.current = null;
      destinationMarkerRef.current = null;
      originMarkerRef.current = null;
      routeLayerRef.current = null;
      retryTilesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!originMarkerRef.current || !origin) return;
    originMarkerRef.current.setLatLng([origin.latitude, origin.longitude]);
  }, [origin]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !destination) return;

    const latLng: L.LatLngExpression = [destination.latitude, destination.longitude];
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.setLatLng(latLng);
    } else {
      destinationMarkerRef.current = L.marker(latLng, {
        icon: destinationIcon,
        draggable: true,
        title: "Déplacez pour ajuster votre adresse de livraison",
      })
        .bindPopup("Votre adresse de livraison")
        .on("dragend", (event) => {
          const position = event.target.getLatLng();
          onChooseRef.current({ latitude: position.lat, longitude: position.lng });
        })
        .addTo(map);
    }
    map.panTo(latLng, { animate: true });
  }, [destination]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    if (route.length > 1) {
      routeLayerRef.current = L.polyline(route, {
        color: "#ef6a32",
        weight: 5,
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);
      map.fitBounds(routeLayerRef.current.getBounds(), { padding: [28, 28], maxZoom: 14 });
    }
  }, [route]);

  return (
    <div
      className="market-delivery-map"
      ref={containerRef}
      role="application"
      aria-label="Carte pour choisir et ajuster votre adresse de livraison"
    >
      {tileStatus === "loading" && (
        <div className="market-map-status" role="status">
          Chargement de la carte…
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
