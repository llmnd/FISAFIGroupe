"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import PortalThemeToggle from "@/components/PortalThemeToggle";
import UserDashboardSkeleton from "@/components/UserDashboardSkeleton";
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

interface Article {
  id: number;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  published: boolean;
  createdAt: string;
  image?: string;
  author?: string;
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
  | "account"
  | "inscriptions-manage"
  | "users"
  | "articles";

interface TabType {
  id: TabId;
  label: string;
  icon: string;
  admin?: boolean;
}

const ALL_TABS: TabType[] = [
  { id: "home", label: "Accueil", icon: "⌂" },
  { id: "inscriptions", label: "Mes inscriptions", icon: "◈" },
  { id: "formations", label: "Formations et sessions", icon: "◉" },
  { id: "market-orders", label: "Achats Market", icon: "▱" },
  { id: "account", label: "Mon compte", icon: "◇" },
  { id: "inscriptions-manage", label: "Gérer inscriptions", icon: "◎", admin: true },
  { id: "users", label: "Utilisateurs", icon: "◇", admin: true },
  { id: "articles", label: "Articles", icon: "◆", admin: true },
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
  const pathname = usePathname();
  const sessionRedirecting = useRef(false);
  const sessionValidationStarted = useRef(false);

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
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!sidebarOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const closeSidebar = () => setSidebarOpen(false);
    window.addEventListener("pageshow", closeSidebar);
    return () => window.removeEventListener("pageshow", closeSidebar);
  }, []);

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

  const [showArticleForm, setShowArticleForm] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [adminInscriptions, setAdminInscriptions] = useState<InscriptionFormation[]>([]);
  const [loadingAdminInscriptions, setLoadingAdminInscriptions] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "Articles techniques",
    excerpt: "",
    content: "",
    image: "",
    author: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
            ["draft", "sent", "sale", "done", "cancel"].includes(
              String(order.state)
            ) &&
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
                (typeof item.categoryName === "string" ||
                  item.categoryName === null) &&
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
        fetchError instanceof Error
          ? fetchError.message
          : "Impossible de charger vos devis."
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
            (typeof invoice.referenceNote === "string" ||
              invoice.referenceNote === null)
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
        const itemId = getMarketProductId(
          departmentId,
          product.name,
          product.productId
        );
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
          (item) => item === "MARKET_CUSTOMER" || item === "TRAINING_PARTICIPANT"
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

  useEffect(() => {
    if (sessionValidationStarted.current) return;
    sessionValidationStarted.current = true;
    void (async () => {
      try {
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
        const freshUser = parseDashboardUser((payload as { data: unknown }).data);
        if (!freshUser) {
          throw new Error("Session validation returned invalid account data.");
        }
        setUser(freshUser);
        localStorage.setItem("user", JSON.stringify(freshUser));
        if (freshUser.role === "admin") {
          router.replace("/admin-dashboard");
        }
      } catch (sessionError) {
        console.error("[Dashboard] Session validation failed:", sessionError);
        setError("Impossible de vérifier votre session. Réessayez.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const profileKey = user?.profiles.join(",") ?? "";
  useEffect(() => {
    if (!user) return;
    if (activeTab === "home") {
      if (user.profiles.includes("MARKET_CUSTOMER")) {
        void fetchMarketQuotations();
        void fetchMarketInvoices();
      }
      if (user.profiles.includes("TRAINING_PARTICIPANT")) {
        void fetchUserInscriptions();
        void fetchGroupInvoices();
      }
    } else if (activeTab === "articles" && user.role === "admin") {
      void fetchArticles();
    } else if (activeTab === "inscriptions-manage" && user.role === "admin") {
      void fetchAdminInscriptions();
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
  }, [activeTab, user?.id, user?.role, profileKey]);

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

  const fetchAdminInscriptions = async () => {
    setLoadingAdminInscriptions(true);
    try {
      const token = localStorage.getItem("token");
      const res = await authenticatedFetch("/api/inscriptions-manage", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token || ""}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAdminInscriptions(data.data || []);
      } else {
        setAdminInscriptions([]);
      }
    } catch (err) {
      console.error("Error fetching admin inscriptions:", err);
      setAdminInscriptions([]);
    } finally {
      setLoadingAdminInscriptions(false);
    }
  };

  const handleAdminAction = async (
    id: number,
    action: "accept" | "reject"
  ) => {
    if (!confirm(`Confirmer l'action '${action}' pour l'inscription ${id} ?`)) {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await authenticatedFetch("/api/inscriptions-manage", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        await fetchAdminInscriptions();
        setSuccess(action === "accept" ? "Inscription acceptée" : "Inscription rejetée");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Erreur");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la mise à jour");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleAdminDelete = async (id: number) => {
    if (!confirm("Confirmer la suppression permanente de cette inscription ?")) {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await authenticatedFetch(`/api/inscriptions-manage/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token || ""}` },
      });
      if (res.ok) {
        setSuccess("Inscription supprimée");
        await fetchAdminInscriptions();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Erreur lors de la suppression");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la suppression");
      setTimeout(() => setError(""), 3000);
    }
  };

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

  const fetchArticles = async () => {
    setLoadingArticles(true);
    try {
      const res = await fetch("/api/articles?limit=100", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setArticles(data.data?.articles || []);
      }
    } catch (err) {
      console.error("Error fetching articles:", err);
    } finally {
      setLoadingArticles(false);
    }
  };

  const handlePublishArticle = async (
    articleId: number,
    currentPublished: boolean
  ) => {
    try {
      const res = await authenticatedFetch(`/api/articles/${articleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !currentPublished }),
      });

      if (res.ok) {
        setSuccess(!currentPublished ? "Article publié!" : "Article dépublié");
        await fetchArticles();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Erreur lors de la publication");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      setError("Erreur lors de la publication");
      console.error(err);
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleDeleteArticle = async (articleId: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet article?")) return;

    try {
      const res = await authenticatedFetch(`/api/articles/${articleId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSuccess("Article supprimé");
        await fetchArticles();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Erreur lors de la suppression");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      setError("Erreur lors de la suppression");
      console.error(err);
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.title || !formData.category || !formData.excerpt || !formData.content) {
      setError("Tous les champs obligatoires doivent être remplis");
      return;
    }

    setSubmitting(true);
    try {
      const authorName =
        [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || "Admin";

      const res = await authenticatedFetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          author: authorName,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess("Article créé avec succès!");
        setFormData({
          title: "",
          category: "Articles techniques",
          excerpt: "",
          content: "",
          image: "",
          author: "",
        });
        setShowArticleForm(false);
        await fetchArticles();
      } else {
        setError(data.error || "Erreur lors de la création");
      }
    } catch (err) {
      setError("Erreur lors de la création de l'article");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
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
    const isAdmin = user.role === "admin";
    if (
      !isAdmin &&
      id === "market-orders" &&
      !user.profiles.includes("MARKET_CUSTOMER")
    ) {
      return;
    }
    if (
      !isAdmin &&
      (id === "inscriptions" || id === "formations") &&
      !user.profiles.includes("TRAINING_PARTICIPANT")
    ) {
      return;
    }
    setActiveTab(id);
    setSidebarOpen(false);
    if (typeof window !== "undefined") {
      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth";
      window.scrollTo({ top: 0, left: 0, behavior });
    }
  };

  if (loading) return <UserDashboardSkeleton />;

  if (!user) {
    return (
      <>
        <Head>
          <title>Dashboard — FiSAFi Groupe</title>
          <meta name="robots" content="noindex" />
        </Head>
        <div className="dashboard-fallback">
          <div className="dashboard-fallback-icon" aria-hidden="true">⚠</div>
          <h1 className="dashboard-fallback-title">Session indisponible</h1>
          <p className="dashboard-fallback-text">
            {error || "Impossible de vérifier votre session. Veuillez vous reconnecter."}
          </p>
          <Link href="/login" className="dashboard-fallback-cta">
            Se reconnecter
          </Link>
        </div>
      </>
    );
  }

  const hasMarketProfile = user.profiles.includes("MARKET_CUSTOMER");
  const hasTrainingProfile = user.profiles.includes("TRAINING_PARTICIPANT");
  const tabs = ALL_TABS.filter((tab) => {
    if (tab.admin) return user.role === "admin";
    if (user.role === "admin") return true;
    if (tab.id === "market-orders") return hasMarketProfile;
    if (tab.id === "inscriptions" || tab.id === "formations") return hasTrainingProfile;
    return true;
  });
  const firstInitial = user.firstName?.[0] ?? "";
  const lastInitial = user.lastName?.[0] ?? "";
  const initials =
    (firstInitial + lastInitial).toUpperCase() ||
    (user.email?.[0] ?? "U").toUpperCase();

  const registeredSessionIds = new Set<number>(
    userInscriptions.filter((i) => i.status !== "annule").map((i) => i.sessionId)
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

      <div className="dash-layout user-dashboard employee-portal-page">
        <button
          type="button"
          className={`dash-overlay${sidebarOpen ? " open" : ""}`}
          aria-label="Fermer le menu"
          aria-hidden={!sidebarOpen}
          tabIndex={sidebarOpen ? 0 : -1}
          onClick={() => setSidebarOpen(false)}
        />

        <aside
          id="dashboard-sidebar"
          className={`dash-sidebar${sidebarOpen ? " open" : ""}`}
        >
          <div className="sidebar-head">
            <div className="sidebar-logo">
              Fi<span>SAFI</span> Groupe
            </div>
            <div className="sidebar-role">
              {user.role === "admin" ? "Administrateur" : "Utilisateur"}
            </div>
          </div>

          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div style={{ minWidth: 0 }}>
              <div className="sidebar-uname">
                {user.firstName} {user.lastName}
              </div>
              <div className="sidebar-uemail">{user.email}</div>
            </div>
          </div>

          <nav className="sidebar-nav">
            {tabs
              .filter((t) => !t.admin)
              .map((tab) => (
                <button
                  key={tab.id}
                  className={`sidebar-tab${activeTab === tab.id ? " active" : ""}`}
                  onClick={() => handleTab(tab.id)}
                >
                  <span className="sidebar-tab-icon" aria-hidden="true">
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              ))}
            {user.role === "admin" && (
              <div className="sidebar-tab-admin">
                {tabs
                  .filter((t) => t.admin)
                  .map((tab) => (
                    <button
                      key={tab.id}
                      className={`sidebar-tab${activeTab === tab.id ? " active" : ""}`}
                      onClick={() => handleTab(tab.id)}
                    >
                      <span className="sidebar-tab-icon" aria-hidden="true">
                        {tab.icon}
                      </span>
                      {tab.label}
                    </button>
                  ))}
              </div>
            )}
          </nav>

          <div className="sidebar-foot">
            <PortalThemeToggle />
            <button className="sidebar-logout" onClick={handleLogout}>
              <span aria-hidden="true">⊗</span> &nbsp;Déconnexion
            </button>
          </div>
        </aside>

        <div className="dash-main">
          <div className="dash-topbar">
            <div className="dash-brand" aria-label="FiSAFi Groupe">
              <div className="dash-mobile-logo" aria-hidden="true">
                <Image
                  src="/favicon/web-app-manifest-192x192.png"
                  alt=""
                  width={72}
                  height={72}
                  priority
                />
              </div>
              <div className="topbar-logo">
                Fi<span>SAFI</span>
              </div>
            </div>
            <button
              type="button"
              className="topbar-back-link"
              onClick={handleGoBack}
            >
              <span aria-hidden="true">←</span>
              <span>Retour</span>
            </button>
            <button
              type="button"
              className={`topbar-hamburger${sidebarOpen ? " open" : ""}`}
              aria-label={sidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={sidebarOpen}
              aria-controls="dashboard-sidebar"
              onClick={() => setSidebarOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>

          <div className="dash-content">
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
                          {recentMarketQuotations.map((quotation, idx) => (
                            <li
                              key={quotation.id}
                              className="dashboard-home-activity-item"
                              style={{ animationDelay: `${idx * 40}ms` }}
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
                          {recentInscriptions.map((inscription, idx) => (
                            <li
                              key={inscription.id}
                              className="dashboard-home-activity-item"
                              style={{ animationDelay: `${idx * 40}ms` }}
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
                  <div className="alert alert-error" style={{ marginTop: "1rem" }}>
                    <span className="alert-icon" aria-hidden="true">⚠</span>
                    <span>{inscriptionError}</span>
                  </div>
                )}
                {inscriptionSuccess && (
                  <div className="alert alert-success" style={{ marginTop: "1rem" }}>
                    <span className="alert-icon" aria-hidden="true">✓</span>
                    <span>{inscriptionSuccess}</span>
                  </div>
                )}

                {loadingInscriptions ? (
                  <div className="empty-box">
                    <div className="empty-icon" aria-hidden="true">⟳</div>
                    <div className="empty-text">Chargement de vos inscriptions...</div>
                  </div>
                ) : userInscriptions.length === 0 ? (
                  <div className="empty-box">
                    <div className="empty-icon" aria-hidden="true">◈</div>
                    <div className="empty-text">Aucune inscription pour le moment</div>
                  </div>
                ) : (
                  <div className="stack-list">
                    {userInscriptions.map((inscription, idx) => (
                      <div
                        key={inscription.id}
                        className="article-item"
                        style={{ animationDelay: `${idx * 40}ms` }}
                      >
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
                              className="btn-small btn-small--danger"
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
                  <div
                    className="alert alert-error"
                    role="alert"
                    style={{ marginTop: "1.5rem" }}
                  >
                    {groupInvoiceError}
                  </div>
                )}
                <section
                  className="dashboard-home-activity-card"
                  aria-labelledby="group-invoices-title"
                  style={{ marginTop: "2rem" }}
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
                      {groupInvoices.map((invoice, idx) => (
                        <li
                          key={invoice.id}
                          className="dashboard-home-activity-item"
                          style={{ animationDelay: `${idx * 40}ms` }}
                        >
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
                  factures publiées.
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
                    className="page-sub"
                    role="status"
                    aria-live="polite"
                    style={{ marginTop: "0.75rem" }}
                  >
                    {verificationMessage}
                  </p>
                )}

                {marketQuotationError && (
                  <div
                    className="alert alert-error"
                    role="alert"
                    style={{ marginTop: "1rem" }}
                  >
                    {marketQuotationError}
                  </div>
                )}
                {marketReorderError && (
                  <div
                    className="alert alert-error"
                    role="alert"
                    style={{ marginTop: "1rem" }}
                  >
                    {marketReorderError}
                  </div>
                )}
                {marketInvoiceError && (
                  <div
                    className="alert alert-error"
                    role="alert"
                    style={{ marginTop: "1rem" }}
                  >
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
                    <div className="empty-icon" aria-hidden="true">⟳</div>
                    <div className="empty-text">Actualisation de vos devis…</div>
                  </div>
                ) : marketQuotations.length === 0 ? (
                  <div className="empty-box">
                    <div className="empty-icon" aria-hidden="true">▱</div>
                    <div className="empty-text">
                      Vous n’avez pas encore de demande Market.
                    </div>
                    <Link
                      href="/market#rayons"
                      className="btn-small"
                      style={{ marginTop: "1rem" }}
                    >
                      Découvrir FiSAFi Market
                    </Link>
                  </div>
                ) : (
                  <div className="market-order-list">
                    {marketQuotations.map((quotation, idx) => (
                      <article
                        key={quotation.id}
                        className="market-order-card"
                        style={{ animationDelay: `${idx * 60}ms` }}
                      >
                        <header className="market-order-header">
                          <h3 className="market-order-title">
                            Devis {quotation.reference}
                          </h3>
                          <span
                            className={`article-badge market-order-badge market-order-badge--${quotation.state}`}
                          >
                            {quotation.statusLabel}
                          </span>
                        </header>

                        <div className="market-order-meta">
                          <span className="market-order-meta-item">
                            <span className="market-order-meta-label">Montant</span>
                            <strong>
                              {formatNumber(quotation.amountTotal)} FCFA
                            </strong>
                          </span>
                          <span className="market-order-meta-item">
                            <span className="market-order-meta-label">Date</span>
                            <strong>
                              {new Date(quotation.date).toLocaleDateString("fr-FR")}
                            </strong>
                          </span>
                        </div>

                        <p className="market-order-description">
                          {quotation.state === "draft"
                            ? "En attente de vérification et de confirmation par le vendeur."
                            : quotation.state === "sent"
                            ? "Le vendeur vous a envoyé un devis à examiner."
                            : quotation.state === "sale"
                            ? "Votre demande a été confirmée dans Odoo."
                            : quotation.state === "done"
                            ? "Cette commande est terminée."
                            : "Cette demande a été annulée."}
                        </p>

                        {quotation.items.length > 0 && (
                          <div className="market-order-products">
                            <h4 className="market-order-products-title">
                              Produits commandés
                            </h4>
                            <ul className="market-order-products-list">
                              {quotation.items.map((item) => (
                                <li key={item.id} className="market-order-product">
                                  {item.imageUrl ? (
                                    <Image
                                      src={item.imageUrl}
                                      alt={item.name}
                                      width={80}
                                      height={80}
                                      unoptimized
                                      className="market-order-product-image"
                                    />
                                  ) : (
                                    <div
                                      className="market-order-product-image market-order-product-placeholder"
                                      aria-hidden="true"
                                    >
                                      ◇
                                    </div>
                                  )}
                                  <div className="market-order-product-copy">
                                    <span className="market-order-product-name">
                                      {item.name}
                                    </span>
                                    <span className="market-order-product-line">
                                      {item.quantity} × {formatNumber(item.unitPrice)}{" "}
                                      FCFA
                                    </span>
                                    <span className="market-order-product-line market-order-product-line--strong">
                                      Sous-total : {formatNumber(item.subtotal)} FCFA
                                    </span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {quotation.items.length > 0 && (
                          <footer className="market-order-footer">
                            <span className="market-order-footer-hint">
                              Prix et stock revérifiés à l’envoi.
                            </span>
                            <button
                              className="market-action-button market-order-reorder"
                              type="button"
                              onClick={() => void reorderMarketQuotation(quotation)}
                              disabled={reorderingQuotationId !== null}
                            >
                              {reorderingQuotationId === quotation.id
                                ? "Préparation du panier…"
                                : "Recommander"}
                            </button>
                          </footer>
                        )}
                      </article>
                    ))}
                  </div>
                )}

                <section
                  className="dashboard-home-activity-card"
                  aria-labelledby="market-invoices-title"
                  style={{ marginTop: "2rem" }}
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
                      {marketInvoices.map((invoice, idx) => (
                        <li
                          key={invoice.id}
                          className="dashboard-home-activity-item"
                          style={{ animationDelay: `${idx * 40}ms` }}
                        >
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
                            {invoice.referenceNote && (
                              <span>{invoice.referenceNote}</span>
                            )}
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
                  ].map(([label, value], idx) => (
                    <div
                      key={label}
                      className="account-info-card"
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      <span className="account-info-label">{label}</span>
                      <strong className="account-info-value">{value}</strong>
                    </div>
                  ))}
                </section>
                <section
                  className="account-block"
                  aria-labelledby="account-profiles-title"
                >
                  <h2 id="account-profiles-title" className="account-block-title">
                    Choisissez vos espaces
                  </h2>
                  <p className="page-sub account-block-sub">
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
                  <div className="account-profile-grid">
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
                    ).map(([profile, title, description], idx) => {
                      const enabled = user.profiles.includes(profile);
                      return (
                        <div
                          key={profile}
                          className="account-profile-card"
                          style={{ animationDelay: `${idx * 60}ms` }}
                        >
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
                  className="account-block account-block--narrow"
                  aria-labelledby="account-password-title"
                >
                  <h2 id="account-password-title" className="account-block-title">
                    Mot de passe
                  </h2>
                  <p className="page-sub account-block-sub">
                    Après modification, toutes les sessions ouvertes seront déconnectées.
                  </p>
                  {passwordError && (
                    <div className="alert alert-error" role="alert">
                      {passwordError}
                    </div>
                  )}
                  {passwordMessage && (
                    <div className="alert alert-success" role="status">
                      {passwordMessage}
                    </div>
                  )}
                  <form onSubmit={handleChangePassword} className="account-password-form">
                    <label className="account-field">
                      <span>Mot de passe actuel</span>
                      <input
                        className="form-input"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={currentPassword}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                      />
                    </label>
                    <label className="account-field">
                      <span>Nouveau mot de passe</span>
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
                    <label className="account-field">
                      <span>Confirmer le nouveau mot de passe</span>
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
                    <div className="empty-icon" aria-hidden="true">⟳</div>
                    <div className="empty-text">Chargement des formations...</div>
                  </div>
                ) : formations.length === 0 ? (
                  <div className="empty-box">
                    <div className="empty-icon" aria-hidden="true">◉</div>
                    <div className="empty-text">Aucune formation disponible</div>
                  </div>
                ) : (
                  <div className="card-grid">
                    {formations.map((formation, idx) => (
                      <div
                        key={formation.id}
                        className="formation-card"
                        style={{ animationDelay: `${idx * 40}ms` }}
                      >
                        <div className="formation-num">
                          {String(idx + 1).padStart(2, "0")}
                        </div>
                        <div className="formation-name">{formation.name}</div>
                        <div className="formation-desc">{formation.description}</div>

                        {formation.sessions && formation.sessions.length > 0 ? (
                          <div className="formation-sessions">
                            <div className="formation-sessions-title">Sessions :</div>
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
                                  <div className="formation-session-date">
                                    {new Date(session.startDate).toLocaleDateString(
                                      "fr-FR"
                                    )}
                                  </div>
                                  <div className="formation-session-location">
                                    {session.location}
                                  </div>
                                  <div
                                    className={`formation-session-places${
                                      session.available <= 0
                                        ? " formation-session-places--full"
                                        : ""
                                    }`}
                                  >
                                    {session.available > 0
                                      ? `${session.available}/${session.capacity} places`
                                      : "Complète"}
                                  </div>
                                  <button
                                    className="formation-btn formation-session-cta"
                                    onClick={() =>
                                      openInscriptionModal(formation, session)
                                    }
                                    disabled={registrationDisabled}
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
                          <div className="formation-sessions formation-sessions--empty">
                            Aucune session disponible
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === "inscriptions-manage" && (
              <>
                <div className="page-eyebrow">Administration</div>
                <h1 className="page-title">Gérer les inscriptions</h1>
                <p className="page-sub">
                  Vue d&apos;ensemble de toutes les inscriptions
                </p>
                {error && (
                  <div
                    className="alert alert-error"
                    role="alert"
                    style={{ marginTop: "1rem" }}
                  >
                    {error}
                  </div>
                )}
                {success && (
                  <div
                    className="alert alert-success"
                    role="status"
                    style={{ marginTop: "1rem" }}
                  >
                    {success}
                  </div>
                )}
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Email</th>
                        <th>Formation</th>
                        <th>Statut</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingAdminInscriptions ? (
                        <tr>
                          <td colSpan={5} className="table-state">
                            Chargement...
                          </td>
                        </tr>
                      ) : adminInscriptions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="table-state">
                            Aucune inscription
                          </td>
                        </tr>
                      ) : (
                        adminInscriptions.map((insc) => (
                          <tr key={insc.id}>
                            <td>
                              {insc.firstName} {insc.lastName}
                            </td>
                            <td>{insc.email}</td>
                            <td>{insc.formation?.name || "-"}</td>
                            <td>
                              <span
                                className={`badge ${
                                  insc.status === "confirme"
                                    ? "badge-admin"
                                    : "badge-user"
                                }`}
                              >
                                {insc.status}
                              </span>
                            </td>
                            <td>
                              <div className="table-actions">
                                {(
                                  ["liste_attente", "demande_en_attente"] as string[]
                                ).includes(insc.status) && (
                                  <button
                                    className="btn-small"
                                    onClick={() => handleAdminAction(insc.id, "accept")}
                                  >
                                    Accepter
                                  </button>
                                )}
                                {(
                                  [
                                    "confirme",
                                    "liste_attente",
                                    "demande_en_attente",
                                  ] as string[]
                                ).includes(insc.status) && (
                                  <button
                                    className="btn-small"
                                    onClick={() => handleAdminAction(insc.id, "reject")}
                                  >
                                    Rejeter
                                  </button>
                                )}
                                {(
                                  ["annule", "liste_attente", "demande_en_attente"]
                                ).includes(insc.status) && (
                                  <button
                                    className="btn-delete"
                                    onClick={() => handleAdminDelete(insc.id)}
                                  >
                                    Supprimer
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === "users" && (
              <>
                <div className="page-eyebrow">Administration</div>
                <h1 className="page-title">Utilisateurs</h1>
                <p className="page-sub">Gestion des comptes et des rôles</p>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Email</th>
                        <th>Rôle</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          {user.firstName} {user.lastName}
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <span
                            className={`badge ${
                              user.role === "admin" ? "badge-admin" : "badge-user"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td style={{ color: "var(--steel)" }}>—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === "articles" && (
              <>
                <div className="section-bar">
                  <div>
                    <div className="page-eyebrow">Administration</div>
                    <h1 className="page-title">Articles & Actualités</h1>
                  </div>
                  {!showArticleForm && (
                    <button
                      className="btn-new"
                      onClick={() => {
                        setShowArticleForm(true);
                        setError("");
                        setSuccess("");
                      }}
                    >
                      + Nouvel article
                    </button>
                  )}
                </div>

                {showArticleForm && (
                  <form className="article-form" onSubmit={handleSubmitArticle}>
                    {error && (
                      <div className="alert alert-error">
                        <span className="alert-icon" aria-hidden="true">⚠</span>
                        <span>{error}</span>
                      </div>
                    )}
                    {success && (
                      <div className="alert alert-success">
                        <span className="alert-icon" aria-hidden="true">✓</span>
                        <span>{success}</span>
                      </div>
                    )}

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Titre *</label>
                        <input
                          type="text"
                          name="title"
                          className="form-input"
                          value={formData.title}
                          onChange={handleFormChange}
                          placeholder="Ex: Les tendances 2025 de l'IT"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Catégorie *</label>
                        <select
                          name="category"
                          className="form-select"
                          value={formData.category}
                          onChange={handleFormChange}
                          required
                        >
                          <option>Articles techniques</option>
                          <option>Innovations</option>
                          <option>Événements</option>
                          <option>Veille sectorielle</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Résumé (Excerpt) *</label>
                      <textarea
                        name="excerpt"
                        className="form-textarea"
                        value={formData.excerpt}
                        onChange={handleFormChange}
                        placeholder="Courte description qui apparaîtra en aperçu"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Contenu *</label>
                      <textarea
                        name="content"
                        className="form-textarea"
                        value={formData.content}
                        onChange={handleFormChange}
                        placeholder="Contenu complet de l'article"
                        required
                        style={{ minHeight: "200px" }}
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">URL Image (optionnel)</label>
                        <input
                          type="text"
                          name="image"
                          className="form-input"
                          value={formData.image}
                          onChange={handleFormChange}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Auteur (optionnel)</label>
                        <input
                          type="text"
                          name="author"
                          className="form-input"
                          value={formData.author}
                          onChange={handleFormChange}
                          placeholder="Votre nom"
                        />
                      </div>
                    </div>

                    <div className="form-buttons">
                      <button
                        type="submit"
                        className="btn-submit"
                        disabled={submitting}
                      >
                        {submitting ? "Création..." : "Créer l'article"}
                      </button>
                      <button
                        type="button"
                        className="btn-cancel"
                        onClick={() => setShowArticleForm(false)}
                        disabled={submitting}
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                )}

                {loadingArticles ? (
                  <div className="empty-box">
                    <div className="empty-icon" aria-hidden="true">⟳</div>
                    <div className="empty-text">Chargement des articles...</div>
                  </div>
                ) : articles.length === 0 ? (
                  <div className="empty-box">
                    <div className="empty-icon" aria-hidden="true">◆</div>
                    <div className="empty-text">Aucun article pour le moment</div>
                  </div>
                ) : (
                  <div className="stack-list">
                    <p className="page-sub" style={{ marginBottom: "1.5rem" }}>
                      {articles.length} article{articles.length > 1 ? "s" : ""} créé
                      {articles.length > 1 ? "s" : ""}
                    </p>
                    {articles.map((article, idx) => (
                      <div
                        key={article.id}
                        className="article-item"
                        style={{ animationDelay: `${idx * 40}ms` }}
                      >
                        <div className="article-info">
                          <div className="article-title">{article.title}</div>
                          <div className="article-meta">
                            <span className="article-badge">{article.category}</span>
                            <span>
                              {new Date(article.createdAt).toLocaleDateString("fr-FR")}
                            </span>
                            <span>
                              {article.published ? "✓ Publié" : "Non publié"}
                            </span>
                          </div>
                          <div className="article-excerpt">{article.excerpt}</div>
                        </div>
                        <div className="article-actions">
                          {!article.published && (
                            <button
                              className="btn-publish"
                              onClick={() =>
                                handlePublishArticle(article.id, article.published)
                              }
                            >
                              Publier
                            </button>
                          )}
                          {article.published && (
                            <button
                              className="btn-publish btn-publish--muted"
                              onClick={() =>
                                handlePublishArticle(article.id, article.published)
                              }
                            >
                              Dépublier
                            </button>
                          )}
                          <button className="btn-small">Éditer</button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteArticle(article.id)}
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showInscriptionModal && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Inscription à une formation"
          onClick={() => setShowInscriptionModal(false)}
        >
          <div
            className="modal-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="modal-header">
              <h2 className="modal-title">
                Inscription • {selectedFormation?.name}
              </h2>
              <p className="modal-sub">
                {selectedSession &&
                  `${new Date(selectedSession.startDate).toLocaleDateString(
                    "fr-FR"
                  )} • ${selectedSession.location}`}
              </p>
            </header>

            {inscriptionError && (
              <div className="alert alert-error" role="alert">
                <span className="alert-icon" aria-hidden="true">⚠</span>
                <span>{inscriptionError}</span>
              </div>
            )}

            <form onSubmit={handleInscriptionSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Prénom *</label>
                <input
                  type="text"
                  className="form-input"
                  value={inscriptionData.firstName}
                  onChange={(e) =>
                    setInscriptionData({ ...inscriptionData, firstName: e.target.value })
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
                    setInscriptionData({ ...inscriptionData, lastName: e.target.value })
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
                    setInscriptionData({ ...inscriptionData, email: e.target.value })
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
                    setInscriptionData({ ...inscriptionData, phone: e.target.value })
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
                    setInscriptionData({ ...inscriptionData, company: e.target.value })
                  }
                />
              </div>

              <div className="form-buttons">
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