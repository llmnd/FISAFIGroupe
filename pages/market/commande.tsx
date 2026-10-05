import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Footer from "@/components/Footer";
import useMarketCart from "@/hooks/useMarketCart";
import { getMarketImageSource } from "@/lib/marketCart";
import type { DeliveryCoordinates, DeliveryEstimate } from "@/lib/marketDelivery";
import {
  isMarketDeliverySelection,
  MARKET_DELIVERY_SELECTION_KEY,
} from "@/lib/marketDeliverySelection";

type Fulfillment = "delivery" | "pickup";
type Field = "name" | "phone" | "address";

const WHATSAPP_NUMBER = "221787812297";
const THEME_KEY = "fisafi-market-theme";
const CUSTOMER_KEY = "fisafi-market-customer";
const MAX_QUANTITY = 99;
const CUSTOMER_SAVE_DELAY = 400;
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

type OrderConfirmation = {
  reference: string;
  total: number;
  deliveryFee: number;
  deliveryDistanceKm: number;
  whatsappUrl: string;
};

type CreateOrderResponse = {
  orderReference: string;
  total: number;
  deliveryFee: number;
  deliveryDistanceKm: number;
};

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(amount);

const roundQuantity = (value: number) => Math.round(value * 100) / 100;

const toCents = (amount: number) => Math.round(amount * 100);

function isCreateOrderResponse(value: unknown): value is CreateOrderResponse {
  if (!value || typeof value !== "object") return false;
  return (
    "orderReference" in value &&
    typeof value.orderReference === "string" &&
    value.orderReference.length > 0 &&
    "total" in value &&
    typeof value.total === "number" &&
    Number.isFinite(value.total) &&
    "deliveryFee" in value &&
    typeof value.deliveryFee === "number" &&
    Number.isFinite(value.deliveryFee) &&
    "deliveryDistanceKm" in value &&
    typeof value.deliveryDistanceKm === "number" &&
    Number.isFinite(value.deliveryDistanceKm)
  );
}

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

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p className="market-field-error" id={id} role="alert">
      {message}
    </p>
  );
}

function CartProductImage({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="market-cart-art" aria-hidden="true">
        F
      </span>
    );
  }
  return (
    <img
      src={src}
      alt=""
      width={72}
      height={72}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export default function MarketOrderPage() {
  const router = useRouter();
  const { items, ready, storageError, setQuantity, removeItem, clearCart } = useMarketCart();

  const [isDark, setIsDark] = useState(false);
  const [fulfillment, setFulfillment] = useState<Fulfillment>("delivery");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryCoordinates, setDeliveryCoordinates] = useState<DeliveryCoordinates | null>(null);
  const [deliveryCoordinatesAddress, setDeliveryCoordinatesAddress] = useState("");
  const [deliveryEstimate, setDeliveryEstimate] = useState<DeliveryEstimate | null>(null);
  const [estimateFor, setEstimateFor] = useState("");
  const [estimateStatus, setEstimateStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [estimateError, setEstimateError] = useState("");
  const [note, setNote] = useState("");
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [detailsLoaded, setDetailsLoaded] = useState(false);
  const [accountChecked, setAccountChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accountEmail, setAccountEmail] = useState("");
  const [orderConfirmation, setOrderConfirmation] = useState<OrderConfirmation | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  const hasItems = items.length > 0;
  const deliveryCoordinatesKey = deliveryCoordinates
    ? `${deliveryCoordinates.latitude.toFixed(6)},${deliveryCoordinates.longitude.toFixed(6)}`
    : "";
  const isEstimateCurrent =
    Boolean(deliveryEstimate) &&
    estimateFor === deliveryCoordinatesKey &&
    estimateStatus === "ready";

  useEffect(() => {
    if (fulfillment !== "delivery" || !deliveryCoordinates) {
      setEstimateStatus("idle");
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
          body: JSON.stringify({ coordinates: deliveryCoordinates }),
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
        setDeliveryEstimate(payload);
        setEstimateFor(deliveryCoordinatesKey);
        setEstimateStatus("ready");
      } catch (error) {
        if (controller.signal.aborted) return;
        setDeliveryEstimate(null);
        setEstimateFor("");
        setEstimateStatus("error");
        setEstimateError(error instanceof Error ? error.message : "Impossible de calculer le trajet.");
      }
    }, 350);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [fulfillment, deliveryCoordinates, deliveryCoordinatesKey]);

  const openDeliverySelection = () => {
    try {
      window.sessionStorage.setItem(
        MARKET_DELIVERY_SELECTION_KEY,
        JSON.stringify({ address, coordinates: deliveryCoordinates }),
      );
      const deliveryPath = window.location.hostname === "market.fisafigroupe.com"
        ? "/livraison"
        : "/market/livraison";
      void router.push(deliveryPath);
    } catch (error) {
      console.error("[Market/Delivery] Could not open the delivery selection:", error);
      setSubmitError("Impossible d’ouvrir la sélection d’adresse. Vérifiez le stockage du navigateur puis réessayez.");
    }
  };

  const updateDeliveryAddress = (value: string) => {
    setAddress(value);
    if (deliveryCoordinates && value.trim() !== deliveryCoordinatesAddress.trim()) {
      setDeliveryCoordinates(null);
      setDeliveryEstimate(null);
      setEstimateFor("");
      setDeliveryCoordinatesAddress("");
    }
  };

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) return;
        const payload: unknown = await response.json();
        if (
          payload &&
          typeof payload === "object" &&
          "data" in payload &&
          payload.data &&
          typeof payload.data === "object"
        ) {
          if ("email" in payload.data && typeof payload.data.email === "string") {
            setAccountEmail(payload.data.email);
          }
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error("[Market] Could not verify the customer session:", error);
      } finally {
        setAccountChecked(true);
      }
    })();
  }, []);

  /* Thème : préférence enregistrée, sinon thème du système */
  useIsomorphicLayoutEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(THEME_KEY);
    } catch {
      /* stockage indisponible */
    }
    const initialIsDark = saved === "dark" || (saved !== "light" && media.matches);
    document.documentElement.setAttribute("data-market-theme", initialIsDark ? "dark" : "light");
    setIsDark(initialIsDark);

    const onChange = (event: MediaQueryListEvent) => {
      if (!saved) {
        document.documentElement.setAttribute("data-market-theme", event.matches ? "dark" : "light");
        setIsDark(event.matches);
      }
    };

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    }
    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, []);

  /* Coordonnées : on retient nom, téléphone, adresse et mode pour la prochaine commande */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CUSTOMER_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<{
          name: string;
          phone: string;
          address: string;
          fulfillment: Fulfillment;
        }>;
        if (typeof saved.name === "string") setCustomerName(saved.name);
        if (typeof saved.phone === "string") setPhone(saved.phone);
        if (typeof saved.address === "string") setAddress(saved.address);
        if (saved.fulfillment === "pickup" || saved.fulfillment === "delivery") {
          setFulfillment(saved.fulfillment);
        }
      }
      const savedSelection = window.sessionStorage.getItem(MARKET_DELIVERY_SELECTION_KEY);
      if (savedSelection) {
        const parsed: unknown = JSON.parse(savedSelection);
        if (isMarketDeliverySelection(parsed)) {
          setAddress(parsed.address);
          setDeliveryCoordinates(parsed.coordinates);
          setDeliveryCoordinatesAddress(parsed.address);
        }
      }
    } catch {
      /* données illisibles : on repart de zéro */
    }
    setDetailsLoaded(true);
  }, []);

  /* Écriture différée : on ne touche pas au stockage à chaque frappe */
  useEffect(() => {
    if (!detailsLoaded) return;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          CUSTOMER_KEY,
          JSON.stringify({ name: customerName, phone, address, fulfillment }),
        );
      } catch {
        /* stockage indisponible */
      }
    }, CUSTOMER_SAVE_DELAY);
    return () => window.clearTimeout(timer);
  }, [detailsLoaded, customerName, phone, address, fulfillment]);

  /* La barre mobile n'apparaît que lorsque le formulaire n'est pas à l'écran */
  useEffect(() => {
    const node = panelRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setPanelVisible(entry.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ready, hasItems]);

  /* Confirmation « Vider le panier » : se referme seule */
  useEffect(() => {
    if (!confirmClear) return;
    const timer = window.setTimeout(() => setConfirmClear(false), 5000);
    return () => window.clearTimeout(timer);
  }, [confirmClear]);

  const totalCents = items.reduce(
    (sum, item) => sum + toCents(item.unitPrice) * item.quantity,
    0,
  );
  const total = totalCents / 100;
  const deliveryFee = fulfillment === "delivery" && isEstimateCurrent
    ? deliveryEstimate?.fee ?? 0
    : 0;
  const estimatedTotal = total + deliveryFee;
  const lineAmount = (item: (typeof items)[number]) =>
    (toCents(item.unitPrice) * item.quantity) / 100;

  const phoneDigits = phone.replace(/\D/g, "");
  const errors: Partial<Record<Field, string>> = {};
  if (customerName.trim().length < 2) errors.name = "Indiquez votre nom.";
  if (phoneDigits.length < 9 || phoneDigits.length > 15) {
    errors.phone = "Saisissez un numéro valide, par exemple +221 77 000 00 00.";
  }
  if (fulfillment === "delivery" && address.trim().length < 6) {
    errors.address = "Indiquez votre quartier et votre rue.";
  }
  const showError = (field: Field) => (touched[field] ? errors[field] : undefined);
  const markTouched = (field: Field) => setTouched((current) => ({ ...current, [field]: true }));

  const changeQuantity = (item: (typeof items)[number], delta: number) => {
    const next = roundQuantity(Math.min(MAX_QUANTITY, item.quantity + delta));
    setQuantity(item.id, next);
  };

  const scrollToOrder = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    panelRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    window.setTimeout(
      () => {
        (formRef.current?.elements.namedItem("name") as HTMLElement | null)?.focus({
          preventScroll: true,
        });
      },
      reduce ? 0 : 450,
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasItems || submitting) return;
    setTouched({ name: true, phone: true, address: true });
    const firstInvalid = (["name", "phone", "address"] as Field[]).find((field) => errors[field]);
    if (firstInvalid) {
      (formRef.current?.elements.namedItem(firstInvalid) as HTMLElement | null)?.focus();
      return;
    }
    if (fulfillment === "delivery") {
      if (!deliveryCoordinates || !isEstimateCurrent || !deliveryEstimate) {
        setSubmitError("Choisissez votre position sur la carte et attendez le calcul des frais de livraison.");
        return;
      }
      if (!deliveryEstimate.serviceable) {
        setSubmitError("Cette adresse dépasse la zone de livraison en ligne. Contactez le vendeur pour vérifier une livraison spéciale.");
        return;
      }
    }
    const linkedItems = items.filter(
      (item): item is typeof item & { odooProductId: number } =>
        Number.isSafeInteger(item.odooProductId) && Boolean(item.odooProductId),
    );
    if (linkedItems.length !== items.length) {
      setSubmitError(
        "Un article de ce panier est ancien et n’est plus associé au catalogue Odoo. Retirez-le puis ajoutez-le à nouveau depuis le marché.",
      );
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const response = await fetch("/api/market/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName,
          phone,
          address,
          fulfillment,
          ...(fulfillment === "delivery" && deliveryCoordinates
            ? { coordinates: deliveryCoordinates }
            : {}),
          note,
          items: linkedItems.map((item) => ({
            productId: item.odooProductId,
            quantity: item.quantity,
          })),
        }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
            ? payload.error
            : "Impossible d’enregistrer la demande dans Odoo.";
        throw new Error(message);
      }
      if (!isCreateOrderResponse(payload)) {
        throw new Error("La réponse de confirmation est invalide. Contactez FiSAFi avant de recommencer.");
      }

      const orderMessage = [
        "Salam FiSAFi Market ! Une nouvelle demande de commande attend votre validation dans Odoo.",
        `Référence du devis : ${payload.orderReference}`,
        `Nom du client : ${customerName.trim()}`,
        `Téléphone du client : ${phone.trim()}`,
        `Mode : ${fulfillment === "delivery" ? "Livraison" : "Retrait en magasin"}`,
        ...(fulfillment === "delivery"
          ? [
              `Adresse : ${address.trim()}`,
              `Trajet routier estimé : ${formatAmount(payload.deliveryDistanceKm)} km`,
              `Frais de livraison estimés : ${formatAmount(payload.deliveryFee)} FCFA (à confirmer par le vendeur)`,
            ]
          : []),
        "",
        "Produits :",
        ...items.map((item) => {
          const isKg = item.priceUnit === "kg";
          return `- ${item.name} x${formatAmount(item.quantity)}${isKg ? " kg" : ""}`;
        }),
        `Total du devis Odoo : ${formatAmount(payload.total)} FCFA`,
        ...(fulfillment === "delivery"
          ? [`Estimation produits + livraison : ${formatAmount(payload.total + payload.deliveryFee)} FCFA (hors confirmation vendeur)`]
          : []),
        ...(note.trim() ? [`Précision : ${note.trim()}`] : []),
        "Merci de vérifier le stock et de confirmer le devis dans Odoo.",
      ].join("\n");
      setOrderConfirmation({
        reference: payload.orderReference,
        total: payload.total,
        deliveryFee: payload.deliveryFee,
        deliveryDistanceKm: payload.deliveryDistanceKm,
        whatsappUrl: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(orderMessage)}`,
      });
      clearCart();
    } catch (error) {
      console.error("[Market] Could not create the Odoo quotation:", error);
      setSubmitError(error instanceof Error ? error.message : "Impossible de transmettre la demande à Odoo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Mon panier — FiSAFi Market</title>
        <meta
          name="description"
          content="Vérifiez le stock de votre panier FiSAFi Market et envoyez une demande de devis à valider par le vendeur dans Odoo."
        />
      </Head>
      <main
        className="market-page"
        data-theme={isDark ? "dark" : "light"}
        suppressHydrationWarning
      >
        <nav
          className={`market-store-nav market-checkout-nav${isDark ? " is-dark" : ""}`}
          suppressHydrationWarning
          aria-label="Navigation panier"
        >
          <Link href="/market#rayons" className="market-back" aria-label="Retourner au marché">
            <span aria-hidden="true">←</span>
            <span className="market-checkout-back-label">Continuer mes achats</span>
          </Link>
          <Link href="/market" className="market-wordmark">
            FiSAFi <strong>Market</strong>
          </Link>
        </nav>

        <section className="market-checkout">
          {storageError && (
            <p className="market-checkout-alert" role="alert">
              {storageError}
            </p>
          )}

          {!ready ? (
            <p className="market-checkout-loading" role="status">
              Chargement de votre panier…
            </p>
          ) : !accountChecked ? (
            <p className="market-checkout-loading" role="status">
              Vérification de votre compte…
            </p>
          ) : !isLoggedIn ? (
            <div className="market-cart-empty">
              <h1>Connectez-vous pour commander.</h1>
              <p>Vos demandes et leur statut seront ensuite disponibles dans votre espace client.</p>
              <Link href="/login?next=%2Fmarket%2Fcommande">Se connecter ou créer un compte</Link>
            </div>
          ) : orderConfirmation ? (
            <div className="market-order-confirmation">
              <span>Demande enregistrée</span>
              <h1>Votre devis est dans Odoo.</h1>
              <p>
                Référence <strong>{orderConfirmation.reference}</strong> · Total du devis{" "}
                <strong>{formatAmount(orderConfirmation.total)} FCFA</strong>.
              </p>
              {orderConfirmation.deliveryDistanceKm > 0 && (
                <p>
                  Livraison estimée à {formatAmount(orderConfirmation.deliveryDistanceKm)} km :{" "}
                  <strong>{formatAmount(orderConfirmation.deliveryFee)} FCFA</strong>. Le total
                  produits + livraison estimé est de{" "}
                  <strong>
                    {formatAmount(orderConfirmation.total + orderConfirmation.deliveryFee)} FCFA
                  </strong>
                  ; le vendeur confirmera les frais.
                </p>
              )}
              <p>
                Le vendeur doit vérifier le stock et confirmer le devis dans Odoo. Prévenez-le sur
                WhatsApp pour qu’il puisse traiter votre demande.
              </p>
              <div>
                <a href={orderConfirmation.whatsappUrl} target="_blank" rel="noreferrer">
                  Prévenir le vendeur sur WhatsApp
                </a>
                <Link href="/market#rayons">Retour au marché</Link>
              </div>
            </div>
          ) : !hasItems ? (
            <div className="market-cart-empty">
              <h1>Votre panier est vide.</h1>
              <p>Parcourez les rayons et ajoutez les produits qui vous font envie.</p>
              <Link href="/market#rayons">Voir les rayons</Link>
            </div>
          ) : (
            <div className="market-checkout-layout">
              <div className="market-cart-column">
                <header className="market-checkout-heading">
                  <h1>Votre panier</h1>
                  <p>
                    Le stock sera vérifié dans Odoo. Votre demande deviendra un devis que le vendeur
                    vérifiera et validera avant la commande définitive.
                  </p>
                </header>

                <section className="market-cart-panel" aria-labelledby="market-cart-title">
                  <div className="market-cart-panel-heading">
                    <h2 id="market-cart-title">
                      Vos produits <span>{items.length}</span>
                    </h2>
                    {confirmClear ? (
                      <span
                        className="market-clear-confirm"
                        role="group"
                        aria-label="Vider le panier ?"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            clearCart();
                            setConfirmClear(false);
                          }}
                        >
                          Oui, tout retirer
                        </button>
                        <button type="button" onClick={() => setConfirmClear(false)}>
                          Annuler
                        </button>
                      </span>
                    ) : (
                      <button type="button" onClick={() => setConfirmClear(true)}>
                        Vider le panier
                      </button>
                    )}
                  </div>

                  <ul className="market-cart-items">
                    {items.map((item) => {
                      const isKg = item.priceUnit === "kg";
                      const step = isKg ? 0.5 : 1;
                      const atMin = item.quantity <= step;
                      const atMax = item.quantity >= MAX_QUANTITY;
                      const imageSource = getMarketImageSource(item.image);
                      return (
                        <li className="market-cart-item" key={item.id}>
                          {imageSource ? (
                            <CartProductImage src={imageSource} />
                          ) : (
                            <span className="market-cart-art" aria-hidden="true">
                              F
                            </span>
                          )}
                          <div className="market-cart-item-copy">
                            <span>{item.departmentName}</span>
                            <h3>{item.name}</h3>
                            <p>
                              {item.priceLabel} FCFA{isKg ? " / kg" : ""}
                            </p>
                          </div>
                          <div
                            className="market-cart-quantity"
                            role="group"
                            aria-label={`Quantité de ${item.name}`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                if (!atMin) changeQuantity(item, -step);
                              }}
                              aria-disabled={atMin}
                              aria-label={`Diminuer ${item.name}`}
                            >
                              −
                            </button>
                            <span aria-live="polite">
                              {formatAmount(item.quantity)}
                              {isKg ? " kg" : ""}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (!atMax) changeQuantity(item, step);
                              }}
                              aria-disabled={atMax}
                              aria-label={`Augmenter ${item.name}`}
                            >
                              +
                            </button>
                          </div>
                          <strong className="market-cart-line-total">
                            {formatAmount(lineAmount(item))} FCFA
                          </strong>
                          <button
                            className="market-cart-remove"
                            type="button"
                            onClick={() => removeItem(item.id)}
                            aria-label={`Retirer ${item.name} du panier`}
                          >
                            ×
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="market-cart-price-note">
                    Les prix affichés sont indicatifs. Le stock et le montant final sont confirmés
                    par FiSAFi.
                  </p>
                </section>
              </div>

              <section
                className="market-order-panel"
                aria-labelledby="market-order-title"
                ref={panelRef}
              >
                <h2 id="market-order-title">Votre commande</h2>
                {accountEmail && (
                  <p className="market-account-email">
                    Connecté en tant que <strong>{accountEmail}</strong>
                  </p>
                )}
                <form ref={formRef} onSubmit={handleSubmit} noValidate>
                  <fieldset className="market-fulfillment">
                    <legend className="market-sr">Mode de récupération</legend>
                    <label>
                      <input
                        type="radio"
                        name="fulfillment"
                        value="delivery"
                        checked={fulfillment === "delivery"}
                        onChange={() => setFulfillment("delivery")}
                      />
                      <span>
                        <strong>Livraison</strong>
                        <small>À Dakar</small>
                      </span>
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="fulfillment"
                        value="pickup"
                        checked={fulfillment === "pickup"}
                        onChange={() => setFulfillment("pickup")}
                      />
                      <span>
                        <strong>Retrait</strong>
                        <small>En magasin</small>
                      </span>
                    </label>
                  </fieldset>

                  <div className="market-fulfillment-info" role="status">
                    <span className="market-fulfillment-info-icon" aria-hidden="true">
                      {fulfillment === "delivery" ? "↗" : "⌖"}
                    </span>
                    <p>
                      {fulfillment === "delivery"
                        ? "Le vendeur vous confirmera les frais de livraison et le délai estimatif après vérification de votre adresse, avant de valider le devis."
                        : "Le vendeur vous communiquera les modalités et le délai de retrait avant de valider le devis."}
                    </p>
                  </div>

                  <div className="market-field">
                    <label htmlFor="market-name">Votre nom</label>
                    <input
                      id="market-name"
                      name="name"
                      autoComplete="name"
                      required
                      aria-required="true"
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                      onBlur={() => markTouched("name")}
                      aria-invalid={Boolean(showError("name"))}
                      aria-describedby={showError("name") ? "market-name-error" : undefined}
                      placeholder="Aïssatou Diallo"
                    />
                    <FieldError id="market-name-error" message={showError("name")} />
                  </div>

                  <div className="market-field">
                    <label htmlFor="market-phone">Téléphone</label>
                    <input
                      id="market-phone"
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      required
                      aria-required="true"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      onBlur={() => markTouched("phone")}
                      aria-invalid={Boolean(showError("phone"))}
                      aria-describedby={showError("phone") ? "market-phone-error" : undefined}
                      placeholder="+221 77 000 00 00"
                    />
                    <FieldError id="market-phone-error" message={showError("phone")} />
                  </div>

                  {fulfillment === "delivery" && (
                    <>
                      <div className="market-field">
                        <label htmlFor="market-address">Adresse de livraison à Dakar</label>
                        <textarea
                          id="market-address"
                          name="address"
                          autoComplete="street-address"
                          rows={3}
                          required
                          aria-required="true"
                          value={address}
                          onChange={(event) => updateDeliveryAddress(event.target.value)}
                          onBlur={() => markTouched("address")}
                          aria-invalid={Boolean(showError("address"))}
                          aria-describedby={showError("address") ? "market-address-error" : undefined}
                          placeholder="Quartier, rue, repère pour vous trouver"
                        />
                        <FieldError id="market-address-error" message={showError("address")} />
                      </div>

                      <section className="market-delivery-summary" aria-labelledby="market-delivery-summary-title">
                        <div className="market-delivery-summary-icon" aria-hidden="true">⌖</div>
                        <div className="market-delivery-summary-copy">
                          <span className="market-delivery-eyebrow">Livraison à Dakar</span>
                          <h3 id="market-delivery-summary-title">
                            {isEstimateCurrent && deliveryEstimate?.serviceable
                              ? "Adresse sélectionnée"
                              : "Choisir sur la carte"}
                          </h3>
                          {isEstimateCurrent && deliveryEstimate?.serviceable ? (
                            <p>
                              {formatAmount(deliveryEstimate.distanceKm)} km ·{" "}
                              {formatAmount(deliveryEstimate.fee)} FCFA estimés
                            </p>
                          ) : (
                            <p>Positionner le repère et estimer les frais</p>
                          )}
                        </div>
                        <button
                          className="market-delivery-summary-button"
                          type="button"
                          onClick={openDeliverySelection}
                        >
                          {deliveryCoordinates ? "Modifier" : "Choisir"}
                        </button>
                      </section>
                      {estimateStatus === "loading" && (
                        <p className="market-delivery-feedback" role="status">
                          Actualisation de l’itinéraire et des frais…
                        </p>
                      )}
                      {estimateStatus === "error" && (
                        <p className="market-delivery-feedback market-delivery-error" role="alert">
                          {estimateError}
                        </p>
                      )}
                      {isEstimateCurrent && deliveryEstimate && !deliveryEstimate.serviceable && (
                        <p className="market-delivery-feedback market-delivery-error" role="alert">
                          Cette adresse dépasse 15 km. Contactez le vendeur pour vérifier une livraison spéciale.
                        </p>
                      )}
                    </>
                  )}

                  <div className="market-field">
                    <label htmlFor="market-note">
                      Une précision ? <span>facultatif</span>
                    </label>
                    <textarea
                      id="market-note"
                      name="note"
                      rows={2}
                      maxLength={300}
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="Créneau souhaité, détail utile…"
                    />
                  </div>

                  <div className="market-order-total">
                    <span>
                      Estimation des produits
                      <small>{fulfillment === "delivery" ? "Hors frais de livraison" : "Retrait en magasin"}</small>
                    </span>
                    <strong>{formatAmount(total)} FCFA</strong>
                  </div>
                  {fulfillment === "delivery" && (
                    <>
                      <div className="market-order-total market-order-delivery-total">
                        <span>
                          Livraison estimée
                          <small>
                            {isEstimateCurrent && deliveryEstimate
                              ? `${formatAmount(deliveryEstimate.distanceKm)} km · à confirmer par le vendeur`
                              : "Choisissez un point sur la carte"}
                          </small>
                        </span>
                        <strong>{isEstimateCurrent ? `${formatAmount(deliveryFee)} FCFA` : "—"}</strong>
                      </div>
                      <div className="market-order-total market-order-grand-total">
                        <span>
                          Total estimé
                          <small>Produits + livraison estimée</small>
                        </span>
                        <strong>{formatAmount(estimatedTotal)} FCFA</strong>
                      </div>
                    </>
                  )}

                  <button
                    className="market-order-submit"
                    type="submit"
                    disabled={
                      submitting ||
                      (fulfillment === "delivery" &&
                        (!isEstimateCurrent || !deliveryEstimate?.serviceable))
                    }
                  >
                    {submitting
                      ? "Vérification du stock et création du devis…"
                      : fulfillment === "delivery" && !deliveryCoordinates
                        ? "Choisissez votre adresse sur la carte"
                        : fulfillment === "delivery" && estimateStatus === "loading"
                          ? "Calcul des frais de livraison…"
                          : "Envoyer ma demande au vendeur"}
                  </button>
                  <p className="market-order-disclaimer">
                    Le stock est vérifié dans Odoo avant l’enregistrement d’un devis à valider par
                    le vendeur. Les frais de livraison sont estimatifs, calculés hors devis Odoo et
                    confirmés par le vendeur. Vos coordonnées et l’adresse de livraison sont transmises à FiSAFi.
                  </p>

                  {submitError && (
                    <p className="market-checkout-alert" role="alert">
                      {submitError}
                    </p>
                  )}
                </form>
              </section>
            </div>
          )}
        </section>

        {ready && hasItems && !panelVisible && (
          <div className="market-mobile-bar">
            <div>
              <span>
                {fulfillment === "delivery" && isEstimateCurrent
                  ? "Estimation avec livraison"
                  : "Estimation produits"}
              </span>
              <strong>{formatAmount(estimatedTotal)} FCFA</strong>
            </div>
            <button type="button" onClick={scrollToOrder}>
              Commander
            </button>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}