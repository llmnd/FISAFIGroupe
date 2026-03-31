"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MapComponent = () => {
  const mapRef = useRef<L.Map | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !mapRef.current) return;

    // Initialiser la carte
    mapRef.current = L.map("map").setView([14.6928, -17.0994], 7);

    // Ajouter le tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);

    // Définir l'icône personnalisée
    const customIcon = L.icon({
      iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 40'%3E%3Cpath fill='%23f5a623' d='M16 0C9.4 0 4 5.4 4 12c0 9 12 28 12 28s12-19 12-28c0-6.6-5.4-12-12-12z'/%3E%3Ccircle cx='16' cy='12' r='4' fill='%23fff'/%3E%3C/svg%3E",
      iconSize: [32, 40],
      iconAnchor: [16, 40],
      popupAnchor: [0, -40],
    });

    // Ajouter les marqueurs
    const locations = [
      { name: "Siège Principal - Dakar", lat: 14.6928, lng: -17.0994 },
      { name: "Thiès", lat: 14.8, lng: -16.9 },
      { name: "Saint-Louis", lat: 16.0255, lng: -16.4767 },
      { name: "Kaolack", lat: 13.9667, lng: -15.9333 },
      { name: "Ziguinchor", lat: 13.3597, lng: -15.5693 },
      { name: "Tambacounda", lat: 13.775, lng: -13.7667 },
      { name: "Kolda", lat: 13.0533, lng: -14.9408 },
      { name: "Fatick", lat: 13.9533, lng: -16.4 },
    ];

    locations.forEach((location) => {
      L.marker([location.lat, location.lng], { icon: customIcon })
        .bindPopup(`<strong>${location.name}</strong>`)
        .addTo(mapRef.current!);
    });

    return () => {
      // Nettoyage si nécessaire
    };
  }, [isMounted]);

  return (
    <div id="map" style={{ width: "100%", height: "400px", borderRadius: "8px" }} />
  );
};

export default MapComponent;
