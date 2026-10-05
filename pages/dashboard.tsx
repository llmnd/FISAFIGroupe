"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";
import UserDashboardSkeleton from "@/components/UserDashboardSkeleton";
import { ensureAuthSession } from "@/lib/clientAuthSession";
import {
  getMarketDepartmentId,
  getMarketDepartmentName,
  getMarketProductId,
  MARKET_CART_MAX_QUANTITY,
  readMarketCart,
  writeMarketCart,
} from "@/lib/marketCart";
import type { MarketCartItem } from "@/lib/marketCart";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "user" | "admin" | "moderator";
  profiles: Array<"MARKET_CUSTOMER" | "TRAINING_PARTICIPANT">;
}

function parseDashboardUser(value: unknown): User | null {
  if (!value || typeof value !== "object") return null;
  if (!("id" in value) || typeof value.id !== "string") return null;
  if (!("email" in value) || typeof value.email !== "string") return null;
  if (
    !("role" in value) ||
    (value.role !== "user" && value.role !== "admin" && value.role !== "moderator")
  ) {
    return null;
  }
  const profiles = "profiles" in value ? value.profiles : [];
  if (
    !Array.isArray(profiles) ||
    !profiles.every(
      (profile) =>
        profile === "MARKET_CUSTOMER" || profile === "TRAINING_PARTICIPANT"
    )
  ) {
    return null;
  }

  return {
    id: value.id,
    email: value.email,
    role: value.role,
    firstName:
      "firstName" in value && typeof value.firstName === "string"
        ? value.firstName
        : undefined,
    lastName:
      "lastName" in value && typeof value.lastName === "string"
        ? value.lastName
        : undefined,
    profiles,
  };
}

interface SessionFormation {
  id: number;
  formationId: number;
  startDate: string;
  endDate: string;
  location: string;
  capacity: number;
  available: number;
  status:
    | "ouverte"
    | "complète"
    | "fermée"
    | "annulée"
    | "terminée"
    | "en_attente";
}

interface Formation {
  id: number;
  name: string;
  slug: string;
  duration: string;
  level: string;
  description: string;
  content?: string;
  objectives?: string;
  price?: number;
  published: boolean;
  sessions?: SessionFormation[];
}

type InscriptionStatus =
  | "confirme"
  | "liste_attente"
  | "annule"
  | "demande_en_attente";

interface InscriptionFormation {
  id: number;
  sessionId: number;
  formationId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: InscriptionStatus;
  createdAt: string;
  formation?: { name: string };
  session?: { startDate: string; location: string };
}

interface MarketQuotation {
  id: number;
  reference: string;
  state: "draft" | "sent" | "sale" | "done" | "cancel";
  statusLabel: string;
  amountTotal: number;
  date: string;
  items: Array<{
    id: number;
    productId: number;
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    imageUrl: string | null;
    categoryName: string | null;
    unitName: string;
  }>;
}

interface MarketInvoice {
  id: number;
  reference: string;
  type: "invoice" | "credit_note";
  date: string | null;
  dueDate: string | null;
  total: number;
  remaining: number;
  currency: string | null;
  paymentStatus: string;
  referenceNote: string | null;
}

type TabId =
  | "home"
  | "inscriptions"
  | "formations"
  | "market-orders"
  | "account";

interface TabType {
  id: TabId;
  label: string;
  icon: string;
}

const ALL_TABS: TabType[] = [
  { id: "home", label: "Accueil", icon: "⌂" },
  { id: "inscriptions", label: "Mes inscriptions", icon: "◈" },
  { id: "formations", label: "Formations et sessions", icon: "◉" },
  { id: "market-orders", label: "Achats Market", icon: "▱" },
  { id: "account", label: "Mon compte", icon: "◇" },
];

function getInvoicePaymentLabel(status: string): string {
  const labels: Record<string, string> = {
    not_paid: "À régler",
    in_payment: "Paiement en cours",
    paid: "Réglée",
    partial: "Partiellement réglée",
    reversed: "Annulée",
    invoicing_legacy: "Ancienne facture",
  };
  return labels[status] ?? "Statut indisponible";
}

const numberFmt = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });
const formatNumber = (value: number) => numberFmt.format(value);

export default function DashboardPage() {
  const router = useRouter();
  const sessionRedirecting = useRef(false);
  const [sessionValidationAttempt, setSessionValidationAttempt] = useState(0);

  // ✅ Annule le padding-top global du body pendant que le dashboard user est monté
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.add("portal-has-user-dashboard");
    return () => {
      document.body.classList.remove("portal-has-user-dashboard");
    };
  }, []);

  const expireSession = () => {
    if (sessionRedirecting.current) return;
    sessionRedirecting.current = true;
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch {
      /* ignore */
    }
    try {
      void fetch("/api/auth/logout", { method: "POST", keepalive: true });
    } catch {
      /* ignore */
    }
    void router.replace("/login?session=expired");
  };

  const authenticatedFetch = async (
    input: RequestInfo | URL,
    init: RequestInit = {}
  ) => {
    const headers = new Headers(init.headers);
    const response = await fetch(input, { ...init, headers });
    if (response.status === 401) expireSession();
    return response;
  };

  const handleGoBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  };

  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [tabStateReady, setTabStateReady] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formations, setFormations] = useState<Formation[]>([]);
  const [loadingFormations, setLoadingFormations] = useState(false);
  const [userInscriptions, setUserInscriptions] = useState<InscriptionFormation[]>([]);
  const [loadingInscriptions, setLoadingInscriptions] = useState(false);
  const [inscriptionFetchError, setInscriptionFetchError] = useState("");
  const [marketQuotations, setMarketQuotations] = useState<MarketQuotation[]>([]);
  const [loadingMarketQuotations, setLoadingMarketQuotations] = useState(false);
  const [marketQuotationError, setMarketQuotationError] = useState("");
  const [marketInvoices, setMarketInvoices] = useState<MarketInvoice[]>([]);
  const [loadingMarketInvoices, setLoadingMarketInvoices] = useState(false);
  const [marketInvoiceError, setMarketInvoiceError] = useState("");
  const [groupInvoices, setGroupInvoices] = useState<MarketInvoice[]>([]);
  const [loadingGroupInvoices, setLoadingGroupInvoices] = useState(false);
  const [groupInvoiceError, setGroupInvoiceError] = useState("");
  const [reorderingQuotationId, setReorderingQuotationId] = useState<number | null>(null);
  const [marketReorderError, setMarketReorderError] = useState("");
  const [marketEmailVerified, setMarketEmailVerified] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [savingProfile, setSavingProfile] = useState<
    "MARKET_CUSTOMER" | "TRAINING_PARTICIPANT" | null
  >(null);
  const [showInscriptionModal, setShowInscriptionModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionFormation | null>(null);
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [inscriptionData, setInscriptionData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
  });
  const [submittingInscription, setSubmittingInscription] = useState(false);
  const [inscriptionError, setInscriptionError] = useState("");
  const [inscriptionSuccess, setInscriptionSuccess] = useState("");
  const [error, setError] = useState("");

  async function fetchMarketQuotations() {
    setLoadingMarketQuotations(true);
    setMarketQuotationError("");
    try {
      const token = localStorage.getItem("token");
      const response = await authenticatedFetch("/api/market/orders", {
        cache: "no-store",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message =
          payload &&
          typeof payload === "object" &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Impossible de charger vos devis.";
        throw new Error(message);
      }

      if (
        !payload ||
        typeof payload !== "object" ||
        !("orders" in payload) ||
        !Array.isArray(payload.orders) ||
        !("emailVerified" in payload) ||
        typeof payload.emailVerified !== "boolean"
      ) {
        throw new Error("La réponse de suivi des devis est invalide.");
      }
      const orders = payload.orders;
      if (
        !orders.every(
          (order) =>
            Boolean(order) &&
            typeof order === "object" &&
            "id" in order &&
            Number.isSafeInteger(order.id) &&
            "reference" in order &&
            typeof order.reference === "string" &&
            "state" in order &&
            ["draft", "sent", "sale", "done", "cancel"].includes(String(order.state)) &&
            "statusLabel" in order &&
            typeof order.statusLabel === "string" &&
            "amountTotal" in order &&
            typeof order.amountTotal === "number" &&
            "date" in order &&
            typeof order.date === "string" &&
            "items" in order &&
            Array.isArray(order.items) &&
            order.items.every(
              (item: unknown) =>
                item !== null &&
                typeof item === "object" &&
                "id" in item &&
                Number.isSafeInteger(item.id) &&
                "productId" in item &&
                Number.isSafeInteger(item.productId) &&
                "name" in item &&
                typeof item.name === "string" &&
                "quantity" in item &&
                typeof item.quantity === "number" &&
                "unitPrice" in item &&
                typeof item.unitPrice === "number" &&
                "subtotal" in item &&
                typeof item.subtotal === "number" &&
                "imageUrl" in item &&
                (typeof item.imageUrl === "string" || item.imageUrl === null) &&
                "categoryName" in item &&
                (typeof item.categoryName === "string" || item.categoryName === null) &&
                "unitName" in item &&
                typeof item.unitName === "string"
            )
        )
      ) {
        throw new Error("Les devis reçus ne sont pas valides.");
      }
      setMarketQuotations(orders as MarketQuotation[]);
      setMarketEmailVerified(payload.emailVerified);
    } catch (fetchError) {
      console.error("[Dashboard] Could not load Market quotations:", fetchError);
      setMarketQuotationError(
        fetchError instanceof Error ? fetchError.message : "Impossible de charger vos devis."
      );
    } finally {
      setLoadingMarketQuotations(false);
    }
  }

  async function fetchAccountInvoices(company: "market" | "groupe") {
    const setLoading =
      company === "market" ? setLoadingMarketInvoices : setLoadingGroupInvoices;
    const setError =
      company === "market" ? setMarketInvoiceError : setGroupInvoiceError;
    const setInvoices = company === "market" ? setMarketInvoices : setGroupInvoices;
    setLoading(true);
    setError("");
    try {
      const response = await authenticatedFetch(
        `/api/account/invoices?company=${company}`,
        { cache: "no-store" }
      );
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message =
          payload &&
          typeof payload === "object" &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Impossible de charger vos factures.";
        throw new Error(message);
      }
      if (
        !payload ||
        typeof payload !== "object" ||
        !("invoices" in payload) ||
        !Array.isArray(payload.invoices) ||
        !payload.invoices.every(
          (invoice: unknown) =>
            !!invoice &&
            typeof invoice === "object" &&
            "id" in invoice &&
            Number.isSafeInteger(invoice.id) &&
            "reference" in invoice &&
            typeof invoice.reference === "string" &&
            "type" in invoice &&
            (invoice.type === "invoice" || invoice.type === "credit_note") &&
            "date" in invoice &&
            (typeof invoice.date === "string" || invoice.date === null) &&
            "dueDate" in invoice &&
            (typeof invoice.dueDate === "string" || invoice.dueDate === null) &&
            "total" in invoice &&
            typeof invoice.total === "number" &&
            Number.isFinite(invoice.total) &&
            "remaining" in invoice &&
            typeof invoice.remaining === "number" &&
            Number.isFinite(invoice.remaining) &&
            "currency" in invoice &&
            (typeof invoice.currency === "string" || invoice.currency === null) &&
            "paymentStatus" in invoice &&
            typeof invoice.paymentStatus === "string" &&
            "referenceNote" in invoice &&
            (typeof invoice.referenceNote === "string" || invoice.referenceNote === null)
        )
      ) {
        throw new Error("Les factures reçues ne sont pas valides.");
      }
      setInvoices(payload.invoices as MarketInvoice[]);
    } catch (fetchError) {
      console.error(`[Dashboard] Could not load ${company} invoices:`, fetchError);
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Impossible de charger vos factures."
      );
    } finally {
      setLoading(false);
    }
  }

  const fetchMarketInvoices = () => fetchAccountInvoices("market");
  const fetchGroupInvoices = () => fetchAccountInvoices("groupe");

  const reorderMarketQuotation = async (quotation: MarketQuotation) => {
    if (reorderingQuotationId !== null) return;
    setReorderingQuotationId(quotation.id);
    setMarketReorderError("");

    try {
      if (quotation.items.length === 0) {
        throw new Error("Ce devis ne contient aucun produit à recommander.");
      }

      const cart = readMarketCart();
      const nextCart = [...cart];

      for (const product of quotation.items) {
        if (
          !Number.isSafeInteger(product.productId) ||
          product.productId <= 0 ||
          !Number.isFinite(product.quantity) ||
          product.quantity <= 0 ||
          product.quantity > MARKET_CART_MAX_QUANTITY ||
          !Number.isFinite(product.unitPrice) ||
          product.unitPrice < 0
        ) {
          throw new Error("Un produit de ce devis ne peut pas être ajouté au panier.");
        }

        const departmentName = getMarketDepartmentName(product.categoryName);
        const departmentId = getMarketDepartmentId(departmentName);
        const priceUnit = /kg|kilogram/i.test(product.unitName) ? "kg" : "unité";
        const itemId = getMarketProductId(departmentId, product.name, product.productId);
        const existingIndex = nextCart.findIndex((item) => item.id === itemId);
        const existing = existingIndex >= 0 ? nextCart[existingIndex] : null;
        const quantity = product.quantity + (existing?.quantity ?? 0);

        if (quantity > MARKET_CART_MAX_QUANTITY) {
          throw new Error(
            `${product.name} dépasserait la quantité maximale de ${MARKET_CART_MAX_QUANTITY} dans le panier.`
          );
        }

        const cartItem: MarketCartItem = {
          id: itemId,
          odooProductId: product.productId,
          departmentId,
          departmentName,
          name: product.name,
          image: product.imageUrl ?? undefined,
          priceLabel: formatNumber(product.unitPrice),
          unitPrice: product.unitPrice,
          priceUnit,
          quantity,
        };

        if (existingIndex >= 0) {
          nextCart[existingIndex] = cartItem;
        } else {
          nextCart.push(cartItem);
        }
      }

      writeMarketCart(nextCart);
      router.push("/market/commande");
    } catch (reorderError) {
      console.error(
        "[Dashboard] Could not add the previous quotation to the Market cart:",
        reorderError
      );
      setMarketReorderError(
        reorderError instanceof Error
          ? reorderError.message
          : "Impossible de recommander ce devis."
      );
    } finally {
      setReorderingQuotationId(null);
    }
  };

  const resendMarketEmailVerification = async () => {
    setResendingVerification(true);
    setVerificationMessage("");
    try {
      const token = localStorage.getItem("token");
      const response = await authenticatedFetch("/api/auth/resend-verification", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message =
          payload &&
          typeof payload === "object" &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Impossible d’envoyer le lien de vérification.";
        throw new Error(message);
      }
      setVerificationMessage(
        "Un nouveau lien de vérification a été envoyé à votre adresse email."
      );
    } catch (resendError) {
      console.error(
        "[Dashboard] Could not resend the verification email:",
        resendError
      );
      setVerificationMessage(
        resendError instanceof Error
          ? resendError.message
          : "Impossible d’envoyer le lien de vérification."
      );
    } finally {
      setResendingVerification(false);
    }
  };

  const handleChangePassword = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordMessage("");
    if (newPassword.length < 8) {
      setPasswordError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError("Les deux nouveaux mots de passe ne correspondent pas.");
      return;
    }
    setChangingPassword(true);
    try {
      const response = await authenticatedFetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const payload: { error?: string; message?: string } = await response.json();
      if (!response.ok) {
        setPasswordError(payload.error || "Impossible de modifier votre mot de passe.");
        return;
      }
      setPasswordMessage(
        payload.message || "Mot de passe modifié. Vous allez être déconnecté."
      );
      window.setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        void router.replace("/login?passwordChanged=1");
      }, 1200);
    } catch (changeError) {
      console.error("[Dashboard] Could not change password:", changeError);
      setPasswordError(
        "Impossible de contacter le service. Réessayez dans quelques instants."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const handleAddProfile = async (
    profile: "MARKET_CUSTOMER" | "TRAINING_PARTICIPANT"
  ) => {
    if (!user || user.profiles.includes(profile) || savingProfile) return;
    setSavingProfile(profile);
    setProfileError("");
    setProfileMessage("");
    try {
      const response = await authenticatedFetch("/api/account/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      const payload: unknown = await response.json();
      if (
        !response.ok ||
        !payload ||
        typeof payload !== "object" ||
        !("profiles" in payload) ||
        !Array.isArray(payload.profiles) ||
        !payload.profiles.every(
          (item) =>
            item === "MARKET_CUSTOMER" || item === "TRAINING_PARTICIPANT"
        )
      ) {
        const message =
          payload &&
          typeof payload === "object" &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Impossible d’ajouter ce profil à votre compte.";
        throw new Error(message);
      }
      const updatedUser = {
        ...user,
        profiles: payload.profiles as User["profiles"],
      };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setProfileMessage(
        profile === "MARKET_CUSTOMER"
          ? "Votre espace client FiSAFi Market est activé."
          : "Votre espace participant FiSAFi Groupe est activé."
      );
    } catch (err) {
      console.error("[Dashboard/Account] Could not add account profile:", err);
      setProfileError(
        err instanceof Error
          ? err.message
          : "Impossible de mettre à jour les profils du compte."
      );
    } finally {
      setSavingProfile(null);
    }
  };

  // Validate the server session before loading private dashboard data.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        if (!(await ensureAuthSession())) {
          expireSession();
          return;
        }
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if ([401, 403, 404].includes(response.status)) {
          expireSession();
          return;
        }
        if (!response.ok) {
          throw new Error(`Session validation returned HTTP ${response.status}.`);
        }
        const payload: unknown = await response.json();
        if (!payload || typeof payload !== "object" || !("data" in payload)) {
          throw new Error("Session validation returned invalid account data.");
        }
        const freshUser = parseDashboardUser(
          (payload as { data: unknown }).data
        );
        if (!freshUser) {
          throw new Error("Session validation returned invalid account data.");
        }
        if (cancelled) return;
        setUser(freshUser);
        setError("");
        localStorage.setItem("user", JSON.stringify(freshUser));
        if (freshUser.role === "admin") {
          void router.replace("/admin-dashboard");
        }
      } catch (sessionError) {
        if (cancelled) return;
        console.error("[Dashboard] Session validation failed:", sessionError);
        setError(
          "Impossible de vérifier votre session pour le moment. Vérifiez votre connexion puis réessayez."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionValidationAttempt, router]);

  useEffect(() => {
    if (!user || !router.isReady || tabStateReady) return;
    const requestedTab = router.query.tab;
    const tab =
      typeof requestedTab === "string"
        ? ALL_TABS.find((item) => item.id === requestedTab)?.id
        : undefined;
    const hasAccess =
      tab === "market-orders"
        ? user.profiles.includes("MARKET_CUSTOMER")
        : tab === "formations" || tab === "inscriptions"
          ? user.profiles.includes("TRAINING_PARTICIPANT")
          : Boolean(tab);
    setActiveTab(hasAccess && tab ? tab : "home");
    setTabStateReady(true);
  }, [router.isReady, router.query.tab, tabStateReady, user]);

  useEffect(() => {
    if (!user || !router.isReady || !tabStateReady) return;
    if (router.query.tab === activeTab) return;
    void router
      .replace(
        { pathname: router.pathname, query: { ...router.query, tab: activeTab } },
        undefined,
        { shallow: true, scroll: false }
      )
      .catch((navigationError: unknown) => {
        console.error(
          "[Dashboard/Navigation] Could not synchronize the active tab:",
          navigationError
        );
      });
  }, [activeTab, router, tabStateReady, user]);

  // Chargement des données au changement d'onglet
  const profileKey = user?.profiles.join(",") ?? "";
  useEffect(() => {
    if (!user || !tabStateReady) return;
    if (activeTab === "home") {
      if (user.profiles.includes("MARKET_CUSTOMER")) {
        void fetchMarketQuotations();
        void fetchMarketInvoices();
      }
      if (user.profiles.includes("TRAINING_PARTICIPANT")) {
        void fetchUserInscriptions();
        void fetchGroupInvoices();
      }
    } else if (
      activeTab === "formations" &&
      user.profiles.includes("TRAINING_PARTICIPANT")
    ) {
      void fetchFormations();
    } else if (
      activeTab === "inscriptions" &&
      user.profiles.includes("TRAINING_PARTICIPANT")
    ) {
      void fetchUserInscriptions();
      void fetchGroupInvoices();
    } else if (
      activeTab === "market-orders" &&
      user.profiles.includes("MARKET_CUSTOMER")
    ) {
      void fetchMarketQuotations();
      void fetchMarketInvoices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, tabStateReady, user?.id, user?.role, profileKey]);

  // Rafraîchissement automatique (polling) sur l'accueil et les commandes
  useEffect(() => {
    if (
      !["home", "market-orders"].includes(activeTab) ||
      !user?.profiles.includes("MARKET_CUSTOMER")
    ) {
      return;
    }
    const interval = window.setInterval(() => {
      void fetchMarketQuotations();
      void fetchMarketInvoices();
    }, 60_000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user?.id, profileKey]);

  const fetchFormations = async () => {
    setLoadingFormations(true);
    try {
      const res = await fetch("/api/formations?limit=100", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setFormations(data.data?.formations || []);
      }
    } catch (err) {
      console.error("Error fetching formations:", err);
    } finally {
      setLoadingFormations(false);
    }
  };

  const fetchUserInscriptions = async () => {
    setLoadingInscriptions(true);
    setInscriptionFetchError("");
    try {
      const token = localStorage.getItem("token");
      if (!user?.email) {
        setUserInscriptions([]);
        setLoadingInscriptions(false);
        return;
      }

      const res = await authenticatedFetch("/api/my-inscriptions", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token || ""}` },
      });

      if (res.ok) {
        const data = await res.json();
        const list: InscriptionFormation[] = (data.data || []).filter(
          (insc: InscriptionFormation) => insc.status !== "annule"
        );
        setUserInscriptions(list);
      } else {
        console.error("Error fetching inscriptions:", res.status);
        setUserInscriptions([]);
        setInscriptionFetchError("Impossible de charger vos inscriptions.");
      }
    } catch (err) {
      console.error("Error fetching user inscriptions:", err);
      setUserInscriptions([]);
      setInscriptionFetchError("Impossible de contacter le service des inscriptions.");
    } finally {
      setLoadingInscriptions(false);
    }
  };

  const handleInscriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInscriptionError("");
    setInscriptionSuccess("");

    if (
      !inscriptionData.firstName ||
      !inscriptionData.lastName ||
      !inscriptionData.email ||
      !inscriptionData.phone
    ) {
      setInscriptionError("Tous les champs obligatoires doivent être remplis");
      return;
    }

    if (!selectedSession || !selectedFormation) {
      setInscriptionError("Sélection invalide");
      return;
    }

    setSubmittingInscription(true);
    try {
      const res = await authenticatedFetch("/api/inscriptions-formations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedSession.id,
          formationId: selectedFormation.id,
          ...inscriptionData,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setInscriptionSuccess(`Inscription confirmée! ${data.message ?? ""}`);
        setUser((currentUser) => {
          if (!currentUser || currentUser.profiles.includes("TRAINING_PARTICIPANT")) {
            return currentUser;
          }
          const updatedUser = {
            ...currentUser,
            profiles: [
              ...currentUser.profiles,
              "TRAINING_PARTICIPANT" as const,
            ],
          };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          return updatedUser;
        });
        setInscriptionData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          company: "",
        });
        setShowInscriptionModal(false);
        await fetchUserInscriptions();
        setTimeout(() => setInscriptionSuccess(""), 3000);
      } else {
        setInscriptionError(data.error || "Erreur lors de l'inscription");
      }
    } catch (err) {
      setInscriptionError("Erreur lors de l'inscription");
      console.error(err);
    } finally {
      setSubmittingInscription(false);
    }
  };

  const handleCancelInscription = async (inscriptionId: number) => {
    if (!confirm("Confirmer l'annulation de cette inscription ?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await authenticatedFetch(`/api/inscriptions/${inscriptionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token || ""}` },
      });

      if (res.ok) {
        setInscriptionSuccess("Inscription annulée");
        await fetchUserInscriptions();
        await fetchFormations();
        setTimeout(() => setInscriptionSuccess(""), 3000);
      } else {
        const data = await res.json().catch(() => null);
        setInscriptionError(data?.error || "Erreur lors de l'annulation");
        setTimeout(() => setInscriptionError(""), 3000);
      }
    } catch (err) {
      console.error(err);
      setInscriptionError("Erreur lors de l'annulation");
      setTimeout(() => setInscriptionError(""), 3000);
    }
  };

  const openInscriptionModal = (formation: Formation, session: SessionFormation) => {
    setSelectedFormation(formation);
    setSelectedSession(session);
    setInscriptionData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: "",
      company: "",
    });
    setInscriptionError("");
    setInscriptionSuccess("");
    setShowInscriptionModal(true);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    } catch {
      /* ignore */
    }
    void fetch("/api/auth/logout", { method: "POST", keepalive: true }).finally(
      () => {
        window.dispatchEvent(new Event("fisafi:session-expired"));
        router.push("/");
      }
    );
  };

  const handleTab = (id: TabId) => {
    if (!user) return;
    if (id === "market-orders" && !user.profiles.includes("MARKET_CUSTOMER")) {
      return;
    }
    if (
      (id === "inscriptions" || id === "formations") &&
      !user.profiles.includes("TRAINING_PARTICIPANT")
    ) {
      return;
    }
    setActiveTab(id);
    if (typeof window !== "undefined") {
      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth";
      window.scrollTo({ top: 0, left: 0, behavior });
    }
  };

  if (loading) return <UserDashboardSkeleton />;

  // Rendu explicite quand la session est indisponible
  if (!user) {
    return (
      <>
        <Head>
          <title>Dashboard — FiSAFi Groupe</title>
          <meta name="robots" content="noindex" />
        </Head>
        <div className="dashboard-session-fallback">
          <div className="dashboard-session-fallback-icon" aria-hidden="true">
            ⚠
          </div>
          <h1 className="dashboard-session-fallback-title">Session indisponible</h1>
          <p className="dashboard-session-fallback-text">
            {error || "Impossible de vérifier votre session. Veuillez vous reconnecter."}
          </p>
          {error && (
            <button
              type="button"
              className="dashboard-session-retry"
              onClick={() => {
                setError("");
                setLoading(true);
                setSessionValidationAttempt((attempt) => attempt + 1);
              }}
            >
              Réessayer
            </button>
          )}
          <Link href="/login" className="dashboard-session-login">
            Se reconnecter
          </Link>
        </div>
      </>
    );
  }

  const hasMarketProfile = user.profiles.includes("MARKET_CUSTOMER");
  const hasTrainingProfile = user.profiles.includes("TRAINING_PARTICIPANT");
  const tabs = ALL_TABS.filter((tab) => {
    if (tab.id === "market-orders") return hasMarketProfile;
    if (tab.id === "inscriptions" || tab.id === "formations") return hasTrainingProfile;
    return true;
  });
  const registeredSessionIds = new Set<number>(
    userInscriptions
      .filter((i) => i.status !== "annule")
      .map((i) => i.sessionId)
  );
  const pendingQuotationCount = marketQuotations.filter(
    (q) => q.state === "draft" || q.state === "sent"
  ).length;
  const confirmedOrderCount = marketQuotations.filter(
    (q) => q.state === "sale" || q.state === "done"
  ).length;
  const recentMarketQuotations = [...marketQuotations]
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, 3);
  const recentInscriptions = [...userInscriptions]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 3);

  return (
    <>
      <Head>
        <title>Dashboard — FiSAFi Groupe</title>
        <meta name="robots" content="noindex" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </Head>

      <DashboardShell
        user={user}
        tabs={tabs}
        activeTab={activeTab}
        onSelectTab={handleTab}
        onLogout={handleLogout}
        onGoBack={handleGoBack}
      >
        {activeTab === "home" && (
          <section className="dashboard-home" aria-labelledby="dashboard-home-title">
            <div className="page-eyebrow">Espace personnel</div>
            <h1 className="page-title" id="dashboard-home-title">
              Bonjour{user.firstName ? ` ${user.firstName}` : ""} !
            </h1>
            <p className="page-sub">
              {hasMarketProfile && hasTrainingProfile
                ? "Retrouvez vos activités FiSAFi Market et FiSAFi Groupe dans des espaces distincts."
                : hasMarketProfile
                  ? "Retrouvez vos devis, commandes et factures FiSAFi Market."
                  : hasTrainingProfile
                    ? "Retrouvez vos inscriptions et les formations FiSAFi Groupe."
                    : "Consultez votre compte et activez les espaces FiSAFi qui vous concernent."}
            </p>

            <div className="dashboard-home-summary" aria-label="Résumé de votre compte">
              {hasMarketProfile && (
                <button
                  className="dashboard-home-summary-card"
                  type="button"
                  onClick={() => handleTab("market-orders")}
                >
                  <span className="dashboard-home-summary-label">Devis en cours</span>
                  <strong className="dashboard-home-summary-value">
                    {loadingMarketQuotations ? "…" : pendingQuotationCount}
                  </strong>
                  <span className="dashboard-home-summary-link">
                    Consulter mes devis <span aria-hidden="true">→</span>
                  </span>
                </button>
              )}
              {hasMarketProfile && (
                <button
                  className="dashboard-home-summary-card dashboard-home-summary-card--teal"
                  type="button"
                  onClick={() => handleTab("market-orders")}
                >
                  <span className="dashboard-home-summary-label">
                    Commandes confirmées
                  </span>
                  <strong className="dashboard-home-summary-value">
                    {loadingMarketQuotations ? "…" : confirmedOrderCount}
                  </strong>
                  <span className="dashboard-home-summary-link">
                    Suivre mes commandes <span aria-hidden="true">→</span>
                  </span>
                </button>
              )}
              {hasTrainingProfile && (
                <button
                  className="dashboard-home-summary-card dashboard-home-summary-card--green"
                  type="button"
                  onClick={() => handleTab("inscriptions")}
                >
                  <span className="dashboard-home-summary-label">
                    Mes inscriptions
                  </span>
                  <strong className="dashboard-home-summary-value">
                    {loadingInscriptions ? "…" : userInscriptions.length}
                  </strong>
                  <span className="dashboard-home-summary-link">
                    Voir mes inscriptions <span aria-hidden="true">→</span>
                  </span>
                </button>
              )}
            </div>

            <div className="dashboard-home-section-heading">
              <div>
                <p className="dashboard-home-section-kicker">Accès rapide</p>
                <h2>Que souhaitez-vous faire ?</h2>
              </div>
            </div>
            <div className="dashboard-home-shortcuts">
              {hasMarketProfile && (
                <button
                  type="button"
                  className="dashboard-home-shortcut"
                  onClick={() => handleTab("market-orders")}
                >
                  <span className="dashboard-home-shortcut-icon" aria-hidden="true">
                    ▱
                  </span>
                  <span>
                    <strong>Achats FiSAFi Market</strong>
                    <span>Consultez vos devis, commandes et factures.</span>
                  </span>
                  <span className="dashboard-home-shortcut-arrow" aria-hidden="true">
                    →
                  </span>
                </button>
              )}
              {hasTrainingProfile && (
                <button
                  type="button"
                  className="dashboard-home-shortcut"
                  onClick={() => handleTab("formations")}
                >
                  <span
                    className="dashboard-home-shortcut-icon dashboard-home-shortcut-icon--teal"
                    aria-hidden="true"
                  >
                    ◉
                  </span>
                  <span>
                    <strong>Formations et sessions</strong>
                    <span>
                      Découvrez les formations FiSAFi Groupe et les sessions disponibles.
                    </span>
                  </span>
                  <span className="dashboard-home-shortcut-arrow" aria-hidden="true">
                    →
                  </span>
                </button>
              )}
              <button
                type="button"
                className="dashboard-home-shortcut"
                onClick={() => handleTab("account")}
              >
                <span
                  className="dashboard-home-shortcut-icon dashboard-home-shortcut-icon--green"
                  aria-hidden="true"
                >
                  ◇
                </span>
                <span>
                  <strong>Mon compte</strong>
                  <span>
                    Consultez vos informations et choisissez vos espaces FiSAFi.
                  </span>
                </span>
                <span className="dashboard-home-shortcut-arrow" aria-hidden="true">
                  →
                </span>
              </button>
            </div>

            <div className="dashboard-home-activity-heading">
              <div>
                <p className="dashboard-home-section-kicker">Votre activité</p>
                <h2>Les dernières mises à jour</h2>
              </div>
              {(hasMarketProfile || hasTrainingProfile) && (
                <button
                  type="button"
                  className="dashboard-home-refresh"
                  onClick={() => {
                    if (hasMarketProfile) {
                      void fetchMarketQuotations();
                      void fetchMarketInvoices();
                    }
                    if (hasTrainingProfile) {
                      void fetchUserInscriptions();
                      void fetchGroupInvoices();
                    }
                  }}
                  disabled={
                    (hasMarketProfile &&
                      (loadingMarketQuotations || loadingMarketInvoices)) ||
                    (hasTrainingProfile &&
                      (loadingInscriptions || loadingGroupInvoices))
                  }
                >
                  Actualiser
                </button>
              )}
            </div>

            <div className="dashboard-home-activity">
              {hasMarketProfile && (
                <section
                  className="dashboard-home-activity-card"
                  aria-labelledby="dashboard-home-quotes-title"
                >
                  <div className="dashboard-home-activity-title-row">
                    <h3 id="dashboard-home-quotes-title">Devis & commandes</h3>
                    <button
                      type="button"
                      className="dashboard-home-view-all"
                      onClick={() => handleTab("market-orders")}
                    >
                      Tout voir <span aria-hidden="true">→</span>
                    </button>
                  </div>
                  {loadingMarketQuotations ? (
                    <p className="dashboard-home-activity-message" role="status">
                      Chargement de vos devis…
                    </p>
                  ) : marketQuotationError ? (
                    <p
                      className="dashboard-home-activity-message dashboard-home-activity-message--error"
                      role="alert"
                    >
                      {marketQuotationError}
                    </p>
                  ) : marketInvoiceError ? (
                    <p
                      className="dashboard-home-activity-message dashboard-home-activity-message--error"
                      role="alert"
                    >
                      {marketInvoiceError}
                    </p>
                  ) : recentMarketQuotations.length === 0 ? (
                    <p className="dashboard-home-activity-message">
                      Aucun devis ou commande pour le moment.
                    </p>
                  ) : (
                    <ul className="dashboard-home-activity-list">
                      {recentMarketQuotations.map((quotation) => (
                        <li
                          key={quotation.id}
                          className="dashboard-home-activity-item"
                        >
                          <span
                            className="dashboard-home-activity-mark"
                            aria-hidden="true"
                          >
                            ▱
                          </span>
                          <span className="dashboard-home-activity-copy">
                            <strong>{quotation.reference}</strong>
                            <span>
                              {new Date(quotation.date).toLocaleDateString("fr-FR")}
                            </span>
                          </span>
                          <span className="dashboard-home-activity-status">
                            {quotation.statusLabel}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              {hasTrainingProfile && (
                <section
                  className="dashboard-home-activity-card"
                  aria-labelledby="dashboard-home-inscriptions-title"
                >
                  <div className="dashboard-home-activity-title-row">
                    <h3 id="dashboard-home-inscriptions-title">Formations</h3>
                    <button
                      type="button"
                      className="dashboard-home-view-all"
                      onClick={() => handleTab("inscriptions")}
                    >
                      Tout voir <span aria-hidden="true">→</span>
                    </button>
                  </div>
                  {loadingInscriptions ? (
                    <p className="dashboard-home-activity-message" role="status">
                      Chargement de vos inscriptions…
                    </p>
                  ) : inscriptionFetchError ? (
                    <p
                      className="dashboard-home-activity-message dashboard-home-activity-message--error"
                      role="alert"
                    >
                      {inscriptionFetchError}
                    </p>
                  ) : recentInscriptions.length === 0 ? (
                    <p className="dashboard-home-activity-message">
                      Aucune inscription récente.
                    </p>
                  ) : (
                    <ul className="dashboard-home-activity-list">
                      {recentInscriptions.map((inscription) => (
                        <li
                          key={inscription.id}
                          className="dashboard-home-activity-item"
                        >
                          <span
                            className="dashboard-home-activity-mark dashboard-home-activity-mark--teal"
                            aria-hidden="true"
                          >
                            ◉
                          </span>
                          <span className="dashboard-home-activity-copy">
                            <strong>
                              {inscription.formation?.name || "Formation"}
                            </strong>
                            <span>
                              {inscription.session?.location || "Lieu à confirmer"}
                            </span>
                          </span>
                          <span className="dashboard-home-activity-status">
                            {inscription.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}
            </div>
          </section>
        )}

        {activeTab === "inscriptions" && (
          <>
            <div className="page-eyebrow">Espace personnel</div>
            <h1 className="page-title">Mes inscriptions</h1>
            <p className="page-sub">
              Retrouvez toutes vos inscriptions aux formations FISAFI
            </p>
            {inscriptionError && (
              <div className="alert alert-error alert-spaced">
                <span className="alert-icon" aria-hidden="true">
                  ⚠
                </span>
                <span>{inscriptionError}</span>
              </div>
            )}
            {inscriptionSuccess && (
              <div className="alert alert-success alert-spaced">
                <span className="alert-icon" aria-hidden="true">
                  ✓
                </span>
                <span>{inscriptionSuccess}</span>
              </div>
            )}

            {loadingInscriptions ? (
              <div className="empty-box">
                <div className="empty-icon" aria-hidden="true">
                  ⟳
                </div>
                <div className="empty-text">Chargement de vos inscriptions...</div>
              </div>
            ) : userInscriptions.length === 0 ? (
              <div className="empty-box">
                <div className="empty-icon" aria-hidden="true">
                  ◈
                </div>
                <div className="empty-text">Aucune inscription pour le moment</div>
              </div>
            ) : (
              <div>
                {userInscriptions.map((inscription) => (
                  <div key={inscription.id} className="article-item">
                    <div className="article-info">
                      <div className="article-title">
                        {inscription.formation?.name || "Formation"}
                      </div>
                      <div className="article-meta">
                        <span className="article-badge">{inscription.status}</span>
                        <span>
                          <span aria-hidden="true">📍</span>{" "}
                          {inscription.session?.location || "Lieu non spécifié"}
                        </span>
                        <span>
                          <span aria-hidden="true">📅</span>{" "}
                          {new Date(
                            inscription.session?.startDate || inscription.createdAt
                          ).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      <div className="article-excerpt">
                        Inscrit le{" "}
                        {new Date(inscription.createdAt).toLocaleDateString("fr-FR")}{" "}
                        • {inscription.email}
                      </div>
                    </div>
                    <div className="article-actions">
                      {inscription.status !== "annule" && (
                        <button
                          className="btn-small btn-small-danger"
                          onClick={() => handleCancelInscription(inscription.id)}
                        >
                          Annuler
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {groupInvoiceError && (
              <div className="alert alert-error alert-spaced-lg" role="alert">
                {groupInvoiceError}
              </div>
            )}
            <section
              className="dashboard-home-activity-card activity-card-spaced"
              aria-labelledby="group-invoices-title"
            >
              <div className="dashboard-home-activity-title-row">
                <h2 id="group-invoices-title">Factures FiSAFi Groupe</h2>
              </div>
              {loadingGroupInvoices ? (
                <p className="dashboard-home-activity-message" role="status">
                  Chargement de vos factures…
                </p>
              ) : groupInvoices.length === 0 ? (
                <p className="dashboard-home-activity-message">
                  Aucune facture ou note de crédit publiée n’est associée à votre
                  compte Groupe.
                </p>
              ) : (
                <ul className="dashboard-home-activity-list">
                  {groupInvoices.map((invoice) => (
                    <li key={invoice.id} className="dashboard-home-activity-item">
                      <span
                        className="dashboard-home-activity-mark dashboard-home-activity-mark--teal"
                        aria-hidden="true"
                      >
                        {invoice.type === "credit_note" ? "↩" : "▤"}
                      </span>
                      <span className="dashboard-home-activity-copy">
                        <strong>
                          {invoice.type === "credit_note" ? "Avoir" : "Facture"}{" "}
                          {invoice.reference}
                        </strong>
                        <span>
                          {invoice.date
                            ? new Date(invoice.date).toLocaleDateString("fr-FR")
                            : "Date non renseignée"}
                        </span>
                        {invoice.dueDate && (
                          <span>
                            Échéance :{" "}
                            {new Date(invoice.dueDate).toLocaleDateString("fr-FR")}
                          </span>
                        )}
                        {invoice.referenceNote && <span>{invoice.referenceNote}</span>}
                      </span>
                      <span className="dashboard-home-activity-status">
                        {getInvoicePaymentLabel(invoice.paymentStatus)} ·{" "}
                        {formatNumber(invoice.total)}
                        {invoice.currency ? ` ${invoice.currency}` : ""}
                        {invoice.remaining > 0
                          ? ` · Solde ${formatNumber(invoice.remaining)}`
                          : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}

        {activeTab === "market-orders" && (
          <>
            <div className="page-eyebrow">FiSAFi Market</div>
            <h1 className="page-title">Mes achats FiSAFi Market</h1>
            <p className="page-sub">
              Consultez les statuts de vos devis et commandes, ainsi que vos
              factures publiées. Le devis devient une commande confirmée après
              validation du vendeur dans Odoo.
            </p>

            {!marketEmailVerified && (
              <div className="market-verification-notice">
                <div className="market-verification-copy">
                  <span className="market-verification-icon" aria-hidden="true">
                    <svg
                      className="market-action-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M3.75 6.75h16.5v10.5H3.75z"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinejoin="round"
                      />
                      <path
                        d="m4.5 7.5 7.5 6 7.5-6"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <div>
                    <div className="market-verification-title">
                      Confirmez votre adresse email
                    </div>
                    <div className="market-verification-text">
                      Vérifiez votre adresse pour recevoir les changements de
                      statut de vos devis.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="market-action-button"
                  disabled={resendingVerification}
                  onClick={resendMarketEmailVerification}
                >
                  <svg
                    className="market-action-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 12a8 8 0 0 1 13.66-5.66L20 8.7M20 4.5v4.2h-4.2M20 12a8 8 0 0 1-13.66 5.66L4 15.3m0 4.2v-4.2h4.2"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {resendingVerification ? "Envoi en cours…" : "Renvoyer le lien"}
                </button>
              </div>
            )}
            {verificationMessage && (
              <p
                className="page-sub verification-message"
                role="status"
                aria-live="polite"
              >
                {verificationMessage}
              </p>
            )}

            {marketQuotationError && (
              <div className="alert alert-error alert-spaced" role="alert">
                {marketQuotationError}
              </div>
            )}
            {marketReorderError && (
              <div className="alert alert-error alert-spaced" role="alert">
                {marketReorderError}
              </div>
            )}
            {marketInvoiceError && (
              <div className="alert alert-error alert-spaced" role="alert">
                {marketInvoiceError}
              </div>
            )}
            <div className="market-refresh-row">
              <button
                className="market-action-button market-refresh-button"
                type="button"
                onClick={() => {
                  void fetchMarketQuotations();
                  void fetchMarketInvoices();
                }}
                disabled={loadingMarketQuotations || loadingMarketInvoices}
                aria-label={
                  loadingMarketQuotations || loadingMarketInvoices
                    ? "Actualisation en cours"
                    : "Actualiser les devis et factures"
                }
              >
                <svg
                  className={`market-action-icon${
                    loadingMarketQuotations || loadingMarketInvoices
                      ? " spinning"
                      : ""
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M20 7v5h-5M4 17v-5h5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5.6 9a7 7 0 0 1 11.7-2L20 9M4 15l2.7 2a7 7 0 0 0 11.7-2"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {loadingMarketQuotations || loadingMarketInvoices
                  ? "Actualisation…"
                  : "Actualiser devis et factures"}
              </button>
            </div>
            {loadingMarketQuotations ? (
              <div className="empty-box">
                <div className="empty-icon" aria-hidden="true">
                  ⟳
                </div>
                <div className="empty-text">Actualisation de vos devis…</div>
              </div>
            ) : marketQuotations.length === 0 ? (
              <div className="empty-box">
                <div className="empty-icon" aria-hidden="true">
                  ▱
                </div>
                <div className="empty-text">
                  Vous n’avez pas encore de demande Market.
                </div>
                <Link
                  href="/market#rayons"
                  className="btn-small btn-small-spaced"
                >
                  Découvrir FiSAFi Market
                </Link>
              </div>
            ) : (
              <div>
                {marketQuotations.map((quotation) => (
                  <div key={quotation.id} className="article-item">
                    <div className="article-info">
                      <div className="article-title">
                        Devis {quotation.reference}
                      </div>
                      <div className="article-meta">
                        <span className="article-badge">
                          {quotation.statusLabel}
                        </span>
                        <span>{formatNumber(quotation.amountTotal)} FCFA</span>
                        <span>
                          {new Date(quotation.date).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      <div className="article-excerpt">
                        {quotation.state === "draft"
                          ? "En attente de vérification et de confirmation par le vendeur."
                          : quotation.state === "sent"
                            ? "Le vendeur vous a envoyé un devis à examiner."
                            : quotation.state === "sale"
                              ? "Votre demande a été confirmée dans Odoo."
                              : quotation.state === "done"
                                ? "Cette commande est terminée."
                                : "Cette demande a été annulée."}
                      </div>
                      {quotation.items.length > 0 && (
                        <div className="quotation-items">
                          <strong className="quotation-items-title">
                            Produits commandés
                          </strong>
                          {quotation.items.map((item) => (
                            <div key={item.id} className="quotation-item">
                              {item.imageUrl ? (
                                <Image
                                  src={item.imageUrl}
                                  alt={item.name}
                                  width={64}
                                  height={64}
                                  unoptimized
                                  className="quotation-item-image"
                                />
                              ) : (
                                <div
                                  className="quotation-item-image quotation-item-placeholder"
                                  aria-hidden="true"
                                >
                                  ◇
                                </div>
                              )}
                              <div className="quotation-item-body">
                                <div className="quotation-item-name">
                                  {item.name}
                                </div>
                                <div className="quotation-item-meta">
                                  {item.quantity} × {formatNumber(item.unitPrice)}{" "}
                                  FCFA
                                </div>
                                <div className="quotation-item-subtotal">
                                  Sous-total : {formatNumber(item.subtotal)} FCFA
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {quotation.items.length > 0 && (
                      <div className="dashboard-market-reorder">
                        <button
                          className="market-action-button"
                          type="button"
                          onClick={() => void reorderMarketQuotation(quotation)}
                          disabled={reorderingQuotationId !== null}
                        >
                          {reorderingQuotationId === quotation.id
                            ? "Préparation du panier…"
                            : "Recommander"}
                        </button>
                        <span>Prix et stock revérifiés à l’envoi.</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <section
              className="dashboard-home-activity-card activity-card-spaced"
              aria-labelledby="market-invoices-title"
            >
              <div className="dashboard-home-activity-title-row">
                <h2 id="market-invoices-title">Factures FiSAFi Market</h2>
              </div>
              {loadingMarketInvoices ? (
                <p className="dashboard-home-activity-message" role="status">
                  Chargement de vos factures…
                </p>
              ) : marketInvoices.length === 0 ? (
                <p className="dashboard-home-activity-message">
                  Aucune facture ou note de crédit publiée n’est associée à votre
                  compte Market.
                </p>
              ) : (
                <ul className="dashboard-home-activity-list">
                  {marketInvoices.map((invoice) => (
                    <li key={invoice.id} className="dashboard-home-activity-item">
                      <span
                        className="dashboard-home-activity-mark"
                        aria-hidden="true"
                      >
                        {invoice.type === "credit_note" ? "↩" : "▤"}
                      </span>
                      <span className="dashboard-home-activity-copy">
                        <strong>
                          {invoice.type === "credit_note" ? "Avoir" : "Facture"}{" "}
                          {invoice.reference}
                        </strong>
                        <span>
                          {invoice.date
                            ? new Date(invoice.date).toLocaleDateString("fr-FR")
                            : "Date non renseignée"}
                        </span>
                        {invoice.dueDate && (
                          <span>
                            Échéance :{" "}
                            {new Date(invoice.dueDate).toLocaleDateString("fr-FR")}
                          </span>
                        )}
                        {invoice.referenceNote && <span>{invoice.referenceNote}</span>}
                      </span>
                      <span className="dashboard-home-activity-status">
                        {getInvoicePaymentLabel(invoice.paymentStatus)} ·{" "}
                        {formatNumber(invoice.total)}
                        {invoice.currency ? ` ${invoice.currency}` : ""}
                        {invoice.remaining > 0
                          ? ` · Solde ${formatNumber(invoice.remaining)}`
                          : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}

        {activeTab === "account" && (
          <>
            <div className="page-eyebrow">Compte personnel</div>
            <h1 className="page-title">Mon compte</h1>
            <p className="page-sub">
              Vos informations, votre type de compte et les espaces FiSAFi activés.
            </p>
            <section
              className="account-info-grid"
              aria-label="Informations personnelles"
            >
              {[
                [
                  "Nom",
                  [user.firstName, user.lastName].filter(Boolean).join(" ") ||
                    "Non renseigné",
                ],
                ["Adresse email", user.email],
                [
                  "Type de compte",
                  user.role === "admin"
                    ? "Administrateur"
                    : user.role === "moderator"
                      ? "Modérateur"
                      : "Utilisateur",
                ],
                [
                  "Espaces activés",
                  user.profiles.length
                    ? user.profiles
                        .map((profile) =>
                          profile === "MARKET_CUSTOMER"
                            ? "Client Market"
                            : "Participant FiSAFi Groupe"
                        )
                        .join(" · ")
                    : "Aucun espace activé",
                ],
              ].map(([label, value]) => (
                <div key={label} className="account-info-card">
                  <div className="account-info-label">{label}</div>
                  <strong className="account-info-value">{value}</strong>
                </div>
              ))}
            </section>
            <section
              className="account-section"
              aria-labelledby="account-profiles-title"
            >
              <h2
                id="account-profiles-title"
                className="account-section-title"
              >
                Choisissez vos espaces
              </h2>
              <p className="page-sub account-section-sub">
                Vous pourrez activer les deux espaces. Les menus et les données
                correspondants apparaîtront ensuite dans votre tableau de bord.
              </p>
              {profileError && (
                <div className="alert alert-error" role="alert">
                  {profileError}
                </div>
              )}
              {profileMessage && (
                <div className="alert alert-success" role="status">
                  {profileMessage}
                </div>
              )}
              <div className="account-profiles-grid">
                {(
                  [
                    [
                      "MARKET_CUSTOMER",
                      "Client FiSAFi Market",
                      "Accédez à vos devis, commandes et factures Market.",
                    ],
                    [
                      "TRAINING_PARTICIPANT",
                      "Participant FiSAFi Groupe",
                      "Accédez aux formations, sessions, inscriptions et factures Groupe.",
                    ],
                  ] as const
                ).map(([profile, title, description]) => {
                  const enabled = user.profiles.includes(profile);
                  return (
                    <div key={profile} className="account-profile-card">
                      <strong className="account-profile-title">{title}</strong>
                      <p className="account-profile-desc">{description}</p>
                      <button
                        type="button"
                        className="btn-submit"
                        disabled={enabled || savingProfile !== null}
                        onClick={() => void handleAddProfile(profile)}
                      >
                        {enabled
                          ? "Espace activé"
                          : savingProfile === profile
                            ? "Activation…"
                            : "Activer cet espace"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
            <section
              className="account-section account-section-narrow"
              aria-labelledby="account-password-title"
            >
              <h2
                id="account-password-title"
                className="account-section-title"
              >
                Mot de passe
              </h2>
              <p className="page-sub account-section-sub">
                Après modification, toutes les sessions ouvertes seront déconnectées.
              </p>
              {passwordError && (
                <div className="alert alert-error alert-spaced" role="alert">
                  {passwordError}
                </div>
              )}
              {passwordMessage && (
                <div className="alert alert-success alert-spaced" role="status">
                  {passwordMessage}
                </div>
              )}
              <form
                onSubmit={handleChangePassword}
                className="account-password-form"
              >
                <label className="account-password-label">
                  Mot de passe actuel
                  <input
                    className="form-input"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                  />
                </label>
                <label className="account-password-label">
                  Nouveau mot de passe
                  <input
                    className="form-input"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                  />
                </label>
                <label className="account-password-label">
                  Confirmer le nouveau mot de passe
                  <input
                    className="form-input"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                    value={confirmNewPassword}
                    onChange={(event) =>
                      setConfirmNewPassword(event.target.value)
                    }
                  />
                </label>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={changingPassword}
                >
                  {changingPassword
                    ? "Modification…"
                    : "Modifier mon mot de passe"}
                </button>
              </form>
            </section>
          </>
        )}

        {activeTab === "formations" && (
          <>
            <div className="page-eyebrow">Catalogue</div>
            <h1 className="page-title">Formations disponibles</h1>
            <p className="page-sub">Choisissez votre parcours de formation</p>

            {loadingFormations ? (
              <div className="empty-box">
                <div className="empty-icon" aria-hidden="true">
                  ⟳
                </div>
                <div className="empty-text">Chargement des formations...</div>
              </div>
            ) : formations.length === 0 ? (
              <div className="empty-box">
                <div className="empty-icon" aria-hidden="true">
                  ◉
                </div>
                <div className="empty-text">Aucune formation disponible</div>
              </div>
            ) : (
              <div className="card-grid">
                {formations.map((formation, idx) => (
                  <div key={formation.id} className="formation-card">
                    <div className="formation-num">
                      {String(idx + 1).padStart(2, "0")}
                    </div>
                    <div className="formation-name">{formation.name}</div>
                    <div className="formation-desc">{formation.description}</div>

                    {formation.sessions && formation.sessions.length > 0 ? (
                      <div className="formation-sessions">
                        <div className="formation-sessions-title">Sessions:</div>
                        {formation.sessions.map((session) => {
                          const isRegistrationOpen =
                            session.status === "ouverte" &&
                            Date.parse(session.startDate) > Date.now();
                          const registrationDisabled =
                            !isRegistrationOpen ||
                            session.available <= 0 ||
                            registeredSessionIds.has(session.id);
                          return (
                            <div key={session.id} className="formation-session">
                              <div>
                                {new Date(session.startDate).toLocaleDateString(
                                  "fr-FR"
                                )}
                              </div>
                              <div className="formation-session-location">
                                {session.location}
                              </div>
                              <div
                                className={`formation-session-availability${
                                  session.available > 0 ? "" : " is-full"
                                }`}
                              >
                                {session.available > 0
                                  ? `${session.available}/${session.capacity} places`
                                  : "Complète"}
                              </div>
                              <button
                                className="formation-btn formation-btn-block"
                                onClick={() =>
                                  openInscriptionModal(formation, session)
                                }
                                disabled={registrationDisabled}
                                style={{
                                  opacity: registrationDisabled ? 0.5 : 1,
                                }}
                              >
                                {registeredSessionIds.has(session.id)
                                  ? "Déjà inscrit"
                                  : session.available <= 0 ||
                                      session.status === "complète"
                                    ? "Complète"
                                    : !isRegistrationOpen
                                      ? "Inscriptions fermées"
                                      : "S'inscrire"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="formation-sessions formation-sessions-empty">
                        Aucune session disponible
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </DashboardShell>

      {showInscriptionModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Inscription à une formation"
          className="inscription-modal-backdrop"
          onClick={() => setShowInscriptionModal(false)}
        >
          <div className="inscription-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="inscription-modal-title">
              Inscription • {selectedFormation?.name}
            </h2>
            <p className="inscription-modal-sub">
              {selectedSession &&
                `${new Date(selectedSession.startDate).toLocaleDateString(
                  "fr-FR"
                )} • ${selectedSession.location}`}
            </p>

            {inscriptionError && (
              <div className="inscription-modal-error">
                <span aria-hidden="true">⚠</span> {inscriptionError}
              </div>
            )}

            <form onSubmit={handleInscriptionSubmit}>
              <div className="form-group">
                <label className="form-label">Prénom *</label>
                <input
                  type="text"
                  className="form-input"
                  value={inscriptionData.firstName}
                  onChange={(e) =>
                    setInscriptionData({
                      ...inscriptionData,
                      firstName: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nom *</label>
                <input
                  type="text"
                  className="form-input"
                  value={inscriptionData.lastName}
                  onChange={(e) =>
                    setInscriptionData({
                      ...inscriptionData,
                      lastName: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  className="form-input"
                  value={inscriptionData.email}
                  onChange={(e) =>
                    setInscriptionData({
                      ...inscriptionData,
                      email: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Téléphone *</label>
                <input
                  type="tel"
                  className="form-input"
                  value={inscriptionData.phone}
                  onChange={(e) =>
                    setInscriptionData({
                      ...inscriptionData,
                      phone: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Entreprise (optionnel)</label>
                <input
                  type="text"
                  className="form-input"
                  value={inscriptionData.company}
                  onChange={(e) =>
                    setInscriptionData({
                      ...inscriptionData,
                      company: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-buttons inscription-modal-buttons">
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={submittingInscription}
                >
                  {submittingInscription
                    ? "Inscription..."
                    : "Confirmer l'inscription"}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowInscriptionModal(false)}
                  disabled={submittingInscription}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}