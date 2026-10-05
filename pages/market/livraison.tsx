import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import dynamic from "next/dynamic";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import type { DeliveryCoordinates, DeliveryEstimate } from "@/lib/marketDelivery";
import {
  isMarketDeliverySelection,
  MARKET_DELIVERY_SELECTION_KEY,
  type MarketDeliverySelection,
} from "@/lib/marketDeliverySelection";

const MarketDeliveryMap = dynamic(() => import("@/components/MarketDeliveryMap"), {
  ssr: false,
  loading: () => <div className="market-delivery-map-loading">Préparation de la carte…</div>,
});

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(amount);

function isDeliveryEstimate(value: unknown): value is DeliveryEstimate {
  if (!value || typeof value !== "object") return false;
  return (
    "origin" in value &&
    !!value.origin &&
    typeof value.origin === "object" &&
    "latitude" in value.origin &&
    typeof value.origin.latitude === "number" &&
    Number.isFinite(value.origin.latitude) &&
    "longitude" in value.origin &&
    typeof value.origin.longitude === "number" &&
    Number.isFinite(value.origin.longitude) &&
    "distanceKm" in value &&
    typeof value.distanceKm === "number" &&
    Number.isFinite(value.distanceKm) &&
    "fee" in value &&
    typeof value.fee === "number" &&
    Number.isFinite(value.fee) &&
    "serviceable" in value &&
    typeof value.serviceable === "boolean" &&
    "route" in value &&
    Array.isArray(value.route) &&
    value.route.every(
      (point) =>
        Array.isArray(point) &&
        point.length === 2 &&
        typeof point[0] === "number" &&
        Number.isFinite(point[0]) &&
        typeof point[1] === "number" &&
        Number.isFinite(point[1]),
    )
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

function isGeolocationError(error: unknown): error is GeolocationPositionError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "number"
  );
}

export default function MarketDeliveryPage() {
  const router = useRouter();
  const [selection, setSelection] = useState<MarketDeliverySelection>({
    address: "",
    coordinates: null,
  });
  const [ready, setReady] = useState(false);
  const [estimate, setEstimate] = useState<DeliveryEstimate | null>(null);
  const [estimateRefresh, setEstimateRefresh] = useState(0);
  const [estimateStatus, setEstimateStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [estimateError, setEstimateError] = useState("");
  const [locationError, setLocationError] = useState("");
  const [locating, setLocating] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [addressStatus, setAddressStatus] = useState<"idle" | "loading" | "ready" | "error" | "manual">("idle");
  const [addressError, setAddressError] = useState("");
  const reverseGeocodeControllerRef = useRef<AbortController | null>(null);

  const coordinates = selection.coordinates;
  const coordinatesKey = coordinates
    ? `${coordinates.latitude.toFixed(6)},${coordinates.longitude.toFixed(6)}`
    : "";
  const isMarketSubdomain =
    typeof window !== "undefined" && window.location.hostname === "market.fisafigroupe.com";
  const checkoutPath = isMarketSubdomain ? "/commande" : "/market/commande";
  const marketPath = isMarketSubdomain ? "/" : "/market";

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(MARKET_DELIVERY_SELECTION_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (isMarketDeliverySelection(parsed)) setSelection(parsed);
      }
    } catch (error) {
      console.error("[Market/Delivery] Could not restore the delivery selection:", error);
    }
    setReady(true);
  }, []);

  useEffect(
    () => () => reverseGeocodeControllerRef.current?.abort(),
    [],
  );

  useEffect(() => {
    if (!ready || !coordinates) {
      setEstimateStatus("idle");
      setEstimate(null);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setEstimateStatus("loading");
      setEstimateError("");
      try {
        const response = await fetch("/api/market/delivery-estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ coordinates }),
          signal: controller.signal,
        });
        const payload: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          const message =
            payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
              ? payload.error
              : "Impossible de calculer le trajet pour cette adresse.";
          throw new Error(message);
        }
        if (!isDeliveryEstimate(payload)) {
          throw new Error("La réponse du calcul de trajet est invalide.");
        }
        setEstimate(payload);
        setEstimateStatus("ready");
      } catch (error) {
        if (controller.signal.aborted) return;
        setEstimate(null);
        setEstimateStatus("error");
        setEstimateError(error instanceof Error ? error.message : "Impossible de calculer le trajet.");
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [ready, coordinates, coordinatesKey, estimateRefresh]);

  const setDestination = (nextCoordinates: DeliveryCoordinates) => {
    reverseGeocodeControllerRef.current?.abort();
    const controller = new AbortController();
    reverseGeocodeControllerRef.current = controller;
    setSelection({ coordinates: nextCoordinates, address: "" });
    setEstimate(null);
    setLocationError("");
    setSaveError("");
    setAddressError("");
    setAddressStatus("loading");

    void (async () => {
      try {
        const response = await fetch("/api/market/reverse-geocode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ coordinates: nextCoordinates }),
          signal: controller.signal,
        });
        const payload: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          const message =
            payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
              ? payload.error
              : "L’adresse ne peut pas être détectée pour le moment.";
          throw new Error(message);
        }
        if (!isReverseGeocodeResult(payload)) {
          throw new Error("Aucune adresse détaillée n’a été trouvée à cet endroit.");
        }
        if (controller.signal.aborted) return;
        setSelection((current) => ({
          ...current,
          address: payload.address.trim(),
        }));
        setAddressStatus("ready");
      } catch (error) {
        if (controller.signal.aborted) return;
        setAddressStatus("error");
        setAddressError(
          error instanceof Error ? error.message : "L’adresse ne peut pas être détectée pour le moment.",
        );
      }
    })();
  };

  const useMyLocation = async () => {
    setLocationError("");
    setSaveError("");
    if (!window.isSecureContext) {
      setLocationError("La localisation nécessite une connexion sécurisée HTTPS. Ouvrez le site dans Safari ou Chrome à son adresse HTTPS, puis réessayez.");
      return;
    }
    if (!navigator.geolocation) {
      setLocationError("La géolocalisation n’est pas disponible sur cet appareil. Touchez un point sur la carte.");
      return;
    }
    setLocating(true);
    const locate = (options: PositionOptions) =>
      new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });

    try {
      let position: GeolocationPosition;
      try {
        position = await locate({ enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 });
      } catch (error) {
        if (
          !isGeolocationError(error) ||
          (error.code !== error.TIMEOUT && error.code !== error.POSITION_UNAVAILABLE)
        ) {
          throw error;
        }
        position = await locate({ enableHighAccuracy: false, timeout: 20_000, maximumAge: 60_000 });
      }
      setDestination({ latitude: position.coords.latitude, longitude: position.coords.longitude });
    } catch (error) {
      if (isGeolocationError(error) && error.code === error.PERMISSION_DENIED) {
        setLocationError(
          "Autorisation de localisation refusée. Dans les réglages de votre téléphone, autorisez la localisation pour Safari ou Chrome et pour ce site, puis réessayez. Vous pouvez aussi choisir le point sur la carte.",
        );
      } else if (isGeolocationError(error) && error.code === error.TIMEOUT) {
        setLocationError(
          "Votre position n’a pas pu être obtenue à temps. Activez la localisation de l’appareil, réessayez près d’une fenêtre ou choisissez le point sur la carte.",
        );
      } else {
        setLocationError(
          "Votre position est momentanément introuvable. Vérifiez que la localisation est activée, puis réessayez ou choisissez le point sur la carte.",
        );
      }
    } finally {
      setLocating(false);
    }
  };

  const confirmSelection = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!coordinates || estimateStatus !== "ready" || !estimate?.serviceable) return;
    if (selection.address.trim().length < 6) {
      setSaveError("Indiquez votre quartier et un repère pour le livreur.");
      return;
    }
    try {
      sessionStorage.setItem(
        MARKET_DELIVERY_SELECTION_KEY,
        JSON.stringify({ ...selection, address: selection.address.trim() }),
      );
      void router.push(checkoutPath);
    } catch (error) {
      console.error("[Market/Delivery] Could not save the delivery selection:", error);
      setSaveError("Impossible d’enregistrer cette adresse sur cet appareil. Vérifiez le stockage du navigateur et réessayez.");
    }
  };

  const selectedPoint = Boolean(coordinates);
  const estimateReady = estimateStatus === "ready" && Boolean(estimate);
  const canConfirm =
    selectedPoint &&
    selection.address.trim().length >= 6 &&
    estimateReady &&
    Boolean(estimate?.serviceable);

  return (
    <>
      <Head>
        <title>Choisir une adresse de livraison — FiSAFi Market</title>
        <meta
          name="description"
          content="Choisissez votre point de livraison sur la carte et consultez une estimation des frais FiSAFi Market."
        />
        <meta name="theme-color" content="#fbfaf5" />
      </Head>
      <main className="market-page market-delivery-screen">
        <MarketDeliveryMap
          origin={estimate?.origin ?? null}
          destination={coordinates}
          route={estimateReady && estimate ? estimate.route : []}
          onChooseDestination={setDestination}
        />
        {!selectedPoint && (
          <div className="market-map-center-pin" aria-hidden="true">
            <span />
          </div>
        )}

        <header className="market-delivery-topbar">
          <Link href={checkoutPath} className="market-delivery-back" aria-label="Retourner à la commande">
            <span aria-hidden="true">←</span>
            <span>Retour à la commande</span>
          </Link>
          <Link href={marketPath} className="market-delivery-brand" aria-label="FiSAFi Market, accueil">
            FiSAFi <strong>Market</strong>
          </Link>
          <span className="market-delivery-step">ÉTAPE 1 · LIVRAISON</span>
        </header>

        <form className="market-delivery-sheet" onSubmit={confirmSelection}>
          <div className="market-delivery-sheet-heading">
            <span className="market-delivery-eyebrow">Point de livraison</span>
            <h1>Où vous retrouver ?</h1>
            <p>Déplacez la carte et posez le repère à l’entrée de votre domicile.</p>
          </div>

          <label className="market-delivery-address-field" htmlFor="market-delivery-address">
            <span aria-hidden="true" />
            <span className="market-sr">Adresse et repère</span>
            <input
              id="market-delivery-address"
              name="address"
              autoComplete="street-address"
              value={selection.address}
              onChange={(event) => {
                reverseGeocodeControllerRef.current?.abort();
                setAddressStatus("manual");
                setAddressError("");
                setSelection((current) => ({ ...current, address: event.target.value }));
              }}
              placeholder={addressStatus === "loading" ? "Détection du quartier et de la rue…" : "Quartier, rue, repère"}
              maxLength={500}
              required
            />
          </label>

          {addressStatus === "loading" && (
            <p className="market-delivery-screen-status" role="status">
              Recherche automatique de votre rue et de votre quartier…
            </p>
          )}
          {addressStatus === "ready" && (
            <p className="market-delivery-screen-status" role="status">
              Adresse détectée automatiquement. Vérifiez-la et ajoutez un repère si nécessaire.
            </p>
          )}
          {addressStatus === "error" && (
            <p className="market-delivery-screen-error" role="alert">
              {addressError} Vous pouvez saisir votre quartier manuellement.
            </p>
          )}

          <button
            className="market-delivery-gps-button"
            type="button"
            onClick={useMyLocation}
            disabled={locating}
          >
            <span aria-hidden="true">⌖</span>
            {locating ? "Recherche de votre position…" : "Utiliser ma position actuelle"}
          </button>

          <div className="market-delivery-map-instruction" role="status">
            <span className="market-map-instruction-pin" aria-hidden="true" />
            {selectedPoint
              ? "Le repère orange marque votre adresse. Touchez ailleurs sur la carte pour le déplacer."
              : "Touchez la carte pour placer le repère orange à votre adresse."}
          </div>

          {locationError && (
            <p className="market-delivery-screen-error" role="alert">
              {locationError}
            </p>
          )}
          {estimateStatus === "loading" && (
            <p className="market-delivery-screen-status" role="status">
              Calcul de l’itinéraire et de l’estimation…
            </p>
          )}
          {estimateStatus === "error" && (
            <div className="market-delivery-estimate-error">
              <p className="market-delivery-screen-error" role="alert">
                {estimateError}
              </p>
              <button
                type="button"
                onClick={() => setEstimateRefresh((current) => current + 1)}
              >
                Réessayer le calcul
              </button>
            </div>
          )}

          {selectedPoint && estimateReady && estimate && (
            estimate.serviceable ? (
              <div className="market-delivery-fare-card" role="status">
                <div>
                  <span>Trajet estimé</span>
                  <strong>{formatAmount(estimate.distanceKm)} km</strong>
                </div>
                <div>
                  <span>Livraison estimée</span>
                  <strong>{formatAmount(estimate.fee)} <small>FCFA</small></strong>
                </div>
              </div>
            ) : (
              <p className="market-delivery-screen-error" role="alert">
                Cette adresse dépasse notre rayon de livraison en ligne (15 km). Contactez FiSAFi
                pour vérifier une livraison spéciale.
              </p>
            )
          )}

          <p className="market-delivery-screen-privacy">
            Le point de départ est FiSAFi Market, Dakar 00153.
          </p>

          {saveError && (
            <p className="market-delivery-screen-error" role="alert">
              {saveError}
            </p>
          )}
          <button
            className="market-delivery-confirm-button"
            type="submit"
            disabled={!canConfirm}
          >
            {estimateStatus === "loading"
              ? "Calcul de l’itinéraire…"
              : !selectedPoint
                ? "Choisissez un point sur la carte"
                : selection.address.trim().length < 6
                  ? "Indiquez votre quartier et un repère"
                  : estimateReady && !estimate?.serviceable
                    ? "Adresse hors zone de livraison"
                    : "Confirmer cette adresse"}
          </button>
        </form>

        <button
          type="button"
          className="market-delivery-floating-gps"
          onClick={useMyLocation}
          disabled={locating}
          aria-label="Centrer la carte sur ma position"
        >
          <span aria-hidden="true">⌖</span>
        </button>
      </main>
    </>
  );
}
