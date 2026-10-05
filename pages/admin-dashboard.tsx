"use client";

import { useEffect, useState, useRef, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Image from "next/image";
import { ensureAuthSession } from "@/lib/clientAuthSession";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  employeeRole?: "manager" | "seller" | "cashier" | "stock" | "accountant" | null;
  profiles: UserProfile[];
  active: boolean;
  createdAt: string;
}
interface AdminUser extends User {}
type AdminSessionUser = Pick<User, "id" | "email" | "role" | "firstName" | "lastName">;
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

interface SessionFormation {
  id: number;
  formationId: number;
  endDate: string;
  startDate: string;
  location: string;
  capacity: number;
  available: number;
  status?: "ouverte" | "complète" | "fermée" | "annulée";
}

interface Formation {
  id: number;
  name: string;
  slug: string;
}

interface InscriptionFormation {
  id: number;
  sessionId: number;
  formationId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: "confirme" | "liste_attente" | "annule" | "demande_en_attente";
  createdAt: string;
  formation?: Formation;
  session?: SessionFormation;
}

type AdminTab = "users" | "articles" | "brochures" | "inscriptions" | "sessions" | "ecommerce";
type MarketOrderState = "draft" | "sent" | "sale" | "done" | "cancel";
type OdooCompanyType = "groupe" | "market";
type OdooCompany = { id: number; name: string; type: OdooCompanyType };
type UserProfile = "MARKET_CUSTOMER" | "TRAINING_PARTICIPANT";

interface MarketStats {
  company: { id: number; name: string; type: OdooCompanyType };
  period: {
    orders: number;
    confirmedOrders: number;
    pendingOrders: number;
    canceledOrders: number;
    confirmedRevenue: number;
    averageConfirmedOrder: number;
    conversionRate: number;
    customers: number;
  };
  monthly: Array<{
    label: string;
    month: number;
    year: number;
    orders: number;
    confirmedRevenue: number;
  }>;
  recentOrders: Array<{
    id: number;
    reference: string;
    customer: string;
    state: MarketOrderState;
    amountTotal: number;
    date: string;
  }>;
  generatedAt: string;
}

const VALID_TABS: readonly AdminTab[] = ["users", "articles", "brochures", "inscriptions", "sessions", "ecommerce"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatMarketCurrency(amount: number): string {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount)} FCFA`;
}

function getUserProfileLabel(profile: UserProfile): string {
  return profile === "MARKET_CUSTOMER" ? "Client Market" : "Participant formation";
}

function getMarketOrderStatusLabel(state: MarketOrderState): string {
  const labels: Record<MarketOrderState, string> = {
    draft: "Brouillon",
    sent: "Devis envoyé",
    sale: "Confirmée",
    done: "Terminée",
    cancel: "Annulée",
  };
  return labels[state];
}

function isMarketStats(value: unknown): value is MarketStats {
  if (!value || typeof value !== "object") return false;
  const stats = value as Partial<MarketStats>;
  const period = stats.period;
  return (
    !!stats.company &&
    Number.isSafeInteger(stats.company.id) &&
    typeof stats.company.name === "string" &&
    (stats.company.type === "groupe" || stats.company.type === "market") &&
    !!period &&
    Number.isFinite(period.orders) &&
    Number.isFinite(period.confirmedOrders) &&
    Number.isFinite(period.pendingOrders) &&
    Number.isFinite(period.canceledOrders) &&
    Number.isFinite(period.confirmedRevenue) &&
    Number.isFinite(period.averageConfirmedOrder) &&
    Number.isFinite(period.conversionRate) &&
    Number.isFinite(period.customers) &&
    Array.isArray(stats.monthly) &&
    stats.monthly.every(
      (month) =>
        typeof month.label === "string" &&
        Number.isInteger(month.month) &&
        Number.isInteger(month.year) &&
        Number.isFinite(month.orders) &&
        Number.isFinite(month.confirmedRevenue),
    ) &&
    Array.isArray(stats.recentOrders) &&
    stats.recentOrders.every(
      (order) =>
        Number.isSafeInteger(order.id) &&
        typeof order.reference === "string" &&
        typeof order.customer === "string" &&
        ["draft", "sent", "sale", "done", "cancel"].includes(order.state) &&
        Number.isFinite(order.amountTotal) &&
        typeof order.date === "string",
    ) &&
    typeof stats.generatedAt === "string"
  );
}

/**
 * En-têtes d'authentification : la session passe par cookie, donc le Bearer
 * n'est ajouté que si un token existe dans localStorage (jamais bloquant).
 */
function authHeaders(json = true): HeadersInit {
  let token: string | null = null;
  try {
    token = localStorage.getItem("token");
  } catch {
    token = null;
  }
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const buildApiUrl = (ep: string) => ep;
  const routeTab = Array.isArray(router.query.tab) ? router.query.tab[0] : router.query.tab;

  const getTabLabel = (tab: AdminTab, companyType?: OdooCompanyType): string => {
    const labels: Record<AdminTab, string> = {
      users: "Utilisateurs",
      articles: "Articles",
      brochures: "Brochures",
      inscriptions: "Inscriptions",
      sessions: "Sessions",
      ecommerce: companyType === "groupe" ? "Ventes Groupe" : "Market",
    };
    return labels[tab] || "";
  };

  const getSessionStatusClass = (status: string | undefined): string => {
    if (status === "ouverte") return "session-status is-ouverte";
    if (status === "complète") return "session-status is-complete";
    return "session-status is-neutre";
  };

  const getPublishedStatus = (published: boolean): { className: string; text: string } => ({
    className: published ? "pub-on" : "pub-off",
    text: published ? "Publié" : "Brouillon",
  });

  const getBrochureStatus = (published: boolean): { className: string; text: string } => ({
    className: published ? "pub-on" : "pub-off",
    text: published ? "Publiée" : "Non publiée",
  });

  const renderPublishButton = (articleId: number, isPublished: boolean) => {
    if (!isPublished) {
      return (
        <button className="sheet-btn primary" onClick={() => handlePublishArticle(articleId, isPublished)}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
          Publier l'article
        </button>
      );
    }
    return (
      <button className="sheet-btn orange-btn" onClick={() => handlePublishArticle(articleId, isPublished)}>
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
        Dépublier
      </button>
    );
  };

  const renderPublishBrochureButton = (brochureId: string, isPublished: boolean) => {
    if (isPublished) {
      return (
        <button className="sheet-btn orange-btn" onClick={() => handlePublishBrochure(brochureId, isPublished)}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          Dépublier
        </button>
      );
    }
    return (
      <button className="sheet-btn primary" onClick={() => handlePublishBrochure(brochureId, isPublished)}>
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
        Publier
      </button>
    );
  };

  const renderContentList = <T,>(
    loading: boolean,
    items: T[],
    emptyIcon: string,
    emptyText: string,
    renderItem: (item: T) => ReactNode,
  ) => {
    if (loading) {
      return <div className="empty"><div className="spinner"/></div>;
    }
    if (items.length === 0) {
      return <div className="empty"><div className="empty-icon">{emptyIcon}</div><p className="empty-text">{emptyText}</p></div>;
    }
    return items.map(renderItem);
  };

  // Les handlers ferment déjà la feuille et rechargent la liste : pas de doublon ici.
  const renderInscriptionActions = (inscription: InscriptionFormation) => {
    if (inscription.status === "liste_attente" || inscription.status === "demande_en_attente") {
      return (
        <>
          <button className="sheet-btn primary" onClick={() => handleAcceptInscription(inscription.id)}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><polyline points="20 6 9 17 4 12"/></svg>
            Accepter la demande
          </button>
          <button className="sheet-btn orange-btn" onClick={() => handleRejectInscription(inscription.id)}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
            Rejeter la demande
          </button>
        </>
      );
    }
    if (inscription.status === "confirme") {
      return (
        <button className="sheet-btn danger" onClick={() => handleRejectInscription(inscription.id)}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          Annuler l'inscription
        </button>
      );
    }
    return null;
  };

  const [currentUser, setCurrentUser] = useState<AdminSessionUser | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [navOpen, setNavOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [tabStateReady, setTabStateReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "admin" | "user">("all");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");

  const [inscriptions, setInscriptions] = useState<InscriptionFormation[]>([]);
  const [loadingInscriptions, setLoadingInscriptions] = useState(false);
  const [filterInscriptionStatus, setFilterInscriptionStatus] = useState<"all" | "liste_attente" | "confirme" | "annule">("all");
  const [actionSheetInscription, setActionSheetInscription] = useState<InscriptionFormation | null>(null);
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null);
  const [loadingMarketStats, setLoadingMarketStats] = useState(false);
  const [marketStatsError, setMarketStatsError] = useState("");
  const [odooCompanies, setOdooCompanies] = useState<OdooCompany[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [loadingOdooCompanies, setLoadingOdooCompanies] = useState(false);
  const [odooCompaniesError, setOdooCompaniesError] = useState("");
  const [companyPickerSource, setCompanyPickerSource] = useState<"sidebar" | "topbar" | null>(null);
  const marketStatsRequestId = useRef(0);
  const authCheckStarted = useRef(false);
  const initialTabScrollHandled = useRef(false);
  const currentTabRef = useRef(activeTab);

  useEffect(() => {
    if (!navOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setNavOpen(false);
      mobileMenuButtonRef.current?.focus();
    };
    const closeOnDesktopResize = () => {
      if (window.matchMedia("(min-width: 900px)").matches) setNavOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeOnDesktopResize, { passive: true });

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeOnDesktopResize);
    };
  }, [navOpen]);

  useEffect(() => {
    const closeMenu = () => setNavOpen(false);
    const closeMenuWhenHidden = () => {
      if (document.visibilityState === "hidden") setNavOpen(false);
    };
    router.events.on("routeChangeStart", closeMenu);
    window.addEventListener("pageshow", closeMenu);
    document.addEventListener("visibilitychange", closeMenuWhenHidden);
    return () => {
      router.events.off("routeChangeStart", closeMenu);
      window.removeEventListener("pageshow", closeMenu);
      document.removeEventListener("visibilitychange", closeMenuWhenHidden);
    };
  }, [router.events]);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    employeeRole: "" as "" | "manager" | "seller" | "cashier" | "stock" | "accountant",
    profiles: [] as UserProfile[],
  });
  const [actionSheetUser, setActionSheetUser] = useState<AdminUser | null>(null);

  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [articleFormData, setArticleFormData] = useState({ title: "", category: "Articles techniques", excerpt: "", content: "", image: "", author: "" });
  const [submittingArticle, setSubmittingArticle] = useState(false);
  const [articleError, setArticleError] = useState("");
  const [articleSuccess, setArticleSuccess] = useState("");
  const [actionSheetArticle, setActionSheetArticle] = useState<Article | null>(null);

  const [brochures, setBrochures] = useState<any[]>([]);
  const [loadingBrochures, setLoadingBrochures] = useState(false);
  const [showBrochureForm, setShowBrochureForm] = useState(false);
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [brochureFormData, setBrochureFormData] = useState({ name: "", description: "" });
  const [submittingBrochure, setSubmittingBrochure] = useState(false);
  const [brochureError, setBrochureError] = useState("");
  const [brochureSuccess, setBrochureSuccess] = useState("");

  const [formations, setFormations] = useState<Formation[]>([]);
  const [sessions, setSessions] = useState<SessionFormation[]>([]);
  const [actionSheetSession, setActionSheetSession] = useState<SessionFormation | null>(null);
  const [loadingFormations, setLoadingFormations] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionFormData, setSessionFormData] = useState({ formationId: "", startDate: "", endDate: "", location: "", capacity: "20" });
  const [submittingSession, setSubmittingSession] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [sessionSuccess, setSessionSuccess] = useState("");

  const [actionSheetBrochure, setActionSheetBrochure] = useState<any | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (authCheckStarted.current) return;
    authCheckStarted.current = true;
    void (async () => {
      try {
        if (!(await ensureAuthSession())) {
          await router.replace("/login?session=expired");
          return;
        }
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          await router.replace("/login");
          return;
        }
        const payload: unknown = await response.json();
        if (
          !isRecord(payload) ||
          !isRecord(payload.data) ||
          typeof payload.data.id !== "string" ||
          typeof payload.data.email !== "string" ||
          typeof payload.data.role !== "string"
        ) {
          throw new Error("Session validation returned invalid account data.");
        }
        if (payload.data.role !== "admin") {
          await router.replace("/dashboard");
          return;
        }
        setCurrentUser({
          id: payload.data.id,
          email: payload.data.email,
          role: "admin",
          firstName: typeof payload.data.firstName === "string" ? payload.data.firstName : undefined,
          lastName: typeof payload.data.lastName === "string" ? payload.data.lastName : undefined,
        });
        await fetchUsers();
        void fetchOdooCompanies();
      } catch (error) {
        console.error("[Admin/Auth] Could not validate session:", error);
        await router.replace("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  useEffect(() => {
    if (!router.isReady || tabStateReady) return;
    try {
      const q = routeTab ?? null;
      if (q && (VALID_TABS as readonly string[]).includes(q)) {
        handleSetActiveTab(q as AdminTab);
      } else {
        const stored = localStorage.getItem("adminActiveTab");
        if (stored && (VALID_TABS as readonly string[]).includes(stored)) handleSetActiveTab(stored as AdminTab);
      }
    } catch (error) {
      console.error("[Admin/Navigation] Could not restore the active tab:", error);
    } finally {
      setTabStateReady(true);
    }
  }, [router.isReady, routeTab, tabStateReady]);

  useEffect(() => {
    if (!router.isReady || !tabStateReady) return;
    if (routeTab === activeTab) return;
    try {
      localStorage.setItem("adminActiveTab", activeTab);
      void router.replace(
        { pathname: router.pathname, query: { ...router.query, tab: activeTab } },
        undefined,
        { shallow: true },
      ).catch((error: unknown) => {
        console.error("[Admin/Navigation] Could not synchronize the active tab:", error);
      });
    } catch (error) {
      console.error("[Admin/Navigation] Could not synchronize the active tab:", error);
    }
  }, [activeTab, routeTab, router.isReady, router.pathname, tabStateReady]);

  const saveScrollForTab = (tab: string) => {
    try { sessionStorage.setItem(`adminScroll_${tab}`, String(window.scrollY || 0)); } catch { /* noop */ }
  };
  const restoreScrollForTab = (tab: string) => {
    try {
      const v = sessionStorage.getItem(`adminScroll_${tab}`);
      if (v !== null) window.requestAnimationFrame(() => window.scrollTo(0, parseInt(v, 10) || 0));
    } catch { /* noop */ }
  };
  const handleSetActiveTab = (tab: AdminTab) => {
    try { saveScrollForTab(currentTabRef.current); } catch { /* noop */ }
    currentTabRef.current = tab;
    setActiveTab(tab);
    setNavOpen(false);
  };
  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    void router.push("/dashboard");
  };
  useEffect(() => {
    if (!tabStateReady) return;
    if (!initialTabScrollHandled.current) {
      initialTabScrollHandled.current = true;
      currentTabRef.current = activeTab;
      return;
    }
    restoreScrollForTab(activeTab);
  }, [activeTab, tabStateReady]);
  useEffect(() => {
    const onBeforeUnload = () => saveScrollForTab(currentTabRef.current);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);
  useEffect(() => {
    const onRouteChangeStart = (url: string) => {
      try { if (!url.includes(router.pathname)) saveScrollForTab(currentTabRef.current); } catch { /* noop */ }
    };
    router.events.on("routeChangeStart", onRouteChangeStart);
    return () => router.events.off("routeChangeStart", onRouteChangeStart);
  }, [router.events]);

  useEffect(() => {
    if (activeTab === "articles") fetchArticles();
    else if (activeTab === "brochures") fetchBrochures();
    else if (activeTab === "inscriptions") fetchInscriptions();
    else if (activeTab === "sessions") { fetchFormations(); fetchSessions(); }
    else if (activeTab === "ecommerce" && selectedCompanyId !== null) void fetchMarketStats();
  }, [activeTab, selectedCompanyId]);

  useEffect(() => {
    if (activeTab === "inscriptions") fetchInscriptions();
  }, [filterInscriptionStatus]);

  const fetchUsers = async () => {
    try {
      const r = await fetch(buildApiUrl("/api/users"));
      if (!r.ok) {
        const payload: unknown = await r.json().catch(() => null);
        const message =
          isRecord(payload) && typeof payload.error === "string"
            ? payload.error
            : `Impossible de charger les utilisateurs (HTTP ${r.status}).`;
        showToast(message, "err");
        return;
      }
      const payload: unknown = await r.json();
      if (
        !Array.isArray(payload) ||
        !payload.every(
          (user): user is AdminUser =>
            isRecord(user) &&
            typeof user.id === "string" &&
            typeof user.email === "string" &&
            typeof user.role === "string" &&
            typeof user.active === "boolean" &&
            typeof user.createdAt === "string" &&
            Array.isArray(user.profiles) &&
            user.profiles.every(
              (profile) => profile === "MARKET_CUSTOMER" || profile === "TRAINING_PARTICIPANT",
            ),
        )
      ) {
        throw new Error("Le serveur a renvoyé une liste d’utilisateurs invalide.");
      }
      setUsers(payload);
    } catch (error) {
      console.error("[Admin/Users] Could not load users:", error);
      showToast(
        error instanceof Error ? error.message : "Erreur réseau lors du chargement des utilisateurs.",
        "err",
      );
    }
  };

  const persistEmployeeCompany = async (companyId: number) => {
    const response = await fetch("/api/employee/companies", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId }),
    });
    const payload: unknown = await response.json();
    if (!response.ok) {
      const message =
        isRecord(payload) && typeof payload.error === "string"
          ? payload.error
          : `Impossible de sélectionner cette société (HTTP ${response.status}).`;
      throw new Error(message);
    }
  };

  const fetchOdooCompanies = async () => {
    setLoadingOdooCompanies(true);
    setOdooCompaniesError("");
    try {
      const response = await fetch("/api/admin/odoo-companies");
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message =
          isRecord(payload) && typeof payload.error === "string"
            ? payload.error
            : `Impossible de charger les sociétés Odoo (HTTP ${response.status}).`;
        throw new Error(message);
      }
      if (
        !Array.isArray(payload) ||
        !payload.every(
          (company): company is OdooCompany =>
            isRecord(company) &&
            Number.isSafeInteger(company.id) &&
            typeof company.name === "string" &&
            (company.type === "groupe" || company.type === "market"),
        )
      ) {
        throw new Error("Odoo a renvoyé une liste de sociétés invalide.");
      }
      setOdooCompanies(payload);
      const storedCompanyId = Number(localStorage.getItem("adminOdooCompanyId"));
      const savedCompany = payload.find((company) => company.id === storedCompanyId);
      const marketCompany = payload.find((company) => company.name.toLowerCase().includes("market"));
      const defaultCompany = savedCompany ?? marketCompany ?? (payload.length === 1 ? payload[0] : undefined);
      if (defaultCompany) {
        await persistEmployeeCompany(defaultCompany.id);
        setSelectedCompanyId(defaultCompany.id);
        localStorage.setItem("adminOdooCompanyId", String(defaultCompany.id));
      }
    } catch (error) {
      console.error("[Admin/Odoo] Could not load companies:", error);
      setOdooCompaniesError(
        error instanceof Error ? error.message : "Impossible de charger les sociétés depuis Odoo.",
      );
    } finally {
      setLoadingOdooCompanies(false);
    }
  };

  const fetchMarketStats = async () => {
    if (selectedCompanyId === null) {
      setMarketStats(null);
      setMarketStatsError("Sélectionnez FiSAFi Groupe ou FiSAFi Market avec le logo FiSAFi du tableau de bord.");
      return;
    }
    const requestId = ++marketStatsRequestId.current;
    setLoadingMarketStats(true);
    setMarketStatsError("");
    try {
      const response = await fetch(`/api/admin/market-stats?companyId=${selectedCompanyId}`);
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message =
          payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
            ? payload.error
            : "Impossible de charger les statistiques e-commerce.";
        if (requestId === marketStatsRequestId.current) setMarketStatsError(message);
        return;
      }
      if (!isMarketStats(payload) || payload.company.id !== selectedCompanyId) {
        if (requestId === marketStatsRequestId.current) {
          setMarketStatsError("Le serveur a renvoyé des statistiques invalides pour la société sélectionnée.");
        }
        return;
      }
      if (requestId === marketStatsRequestId.current) setMarketStats(payload);
    } catch {
      if (requestId === marketStatsRequestId.current) {
        setMarketStatsError("Erreur réseau : impossible de charger les statistiques e-commerce.");
      }
    } finally {
      if (requestId === marketStatsRequestId.current) setLoadingMarketStats(false);
    }
  };

  const fetchInscriptions = async () => {
    setLoadingInscriptions(true);
    try {
      const query = filterInscriptionStatus !== "all" ? `?status=${filterInscriptionStatus}` : "";
      const r = await fetch(buildApiUrl(`/api/inscriptions-manage${query}`));
      if (r.ok) { const data = await r.json(); setInscriptions(data.data || []); }
      else showToast(`Erreur ${r.status}: ${r.statusText}`, "err");
    } catch { showToast("Erreur réseau", "err"); }
    finally { setLoadingInscriptions(false); }
  };

  const handleAcceptInscription = async (id: number) => {
    try {
      const r = await fetch(buildApiUrl("/api/inscriptions-manage"), { method: "PATCH", headers: authHeaders(), body: JSON.stringify({ id, action: "accept" }) });
      if (r.ok) { showToast("Inscription acceptée"); setActionSheetInscription(null); await fetchInscriptions(); }
      else showToast(`Erreur ${r.status}`, "err");
    } catch { showToast("Erreur réseau", "err"); }
  };

  const handleRejectInscription = async (id: number) => {
    try {
      const r = await fetch(buildApiUrl("/api/inscriptions-manage"), { method: "PATCH", headers: authHeaders(), body: JSON.stringify({ id, action: "reject" }) });
      if (r.ok) { showToast("Inscription rejetée"); setActionSheetInscription(null); await fetchInscriptions(); }
      else showToast(`Erreur ${r.status}`, "err");
    } catch { showToast("Erreur réseau", "err"); }
  };

  const handleDeleteInscription = async (id: number) => {
    try {
      const r = await fetch(buildApiUrl(`/api/inscriptions-manage/${id}`), { method: "DELETE", headers: authHeaders(false) });
      if (r.ok) { showToast("Inscription supprimée"); setActionSheetInscription(null); await fetchInscriptions(); }
      else showToast(`Erreur ${r.status}`, "err");
    } catch { showToast("Erreur réseau", "err"); }
  };

  const fetchFormations = async () => {
    setLoadingFormations(true);
    try {
      const r = await fetch(buildApiUrl("/api/formations?limit=100"));
      if (r.ok) { const data = await r.json(); setFormations(data.data?.formations || []); }
      else showToast(`Impossible de charger les formations (HTTP ${r.status}).`, "err");
    } catch { showToast("Erreur réseau lors du chargement des formations.", "err"); }
    finally { setLoadingFormations(false); }
  };

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const r = await fetch(buildApiUrl("/api/sessions"));
      if (r.ok) { const data = await r.json(); setSessions(data.data || []); }
      else showToast(`Impossible de charger les sessions (HTTP ${r.status}).`, "err");
    } catch { showToast("Erreur réseau lors du chargement des sessions.", "err"); }
    finally { setLoadingSessions(false); }
  };

  const handleDeleteSession = async (id: number) => {
    try {
      const r = await fetch(buildApiUrl(`/api/sessions/${id}`), { method: "DELETE", headers: authHeaders(false) });
      if (r.ok) { showToast("Session supprimée"); setActionSheetSession(null); await fetchSessions(); }
      else showToast(`Erreur ${r.status}`, "err");
    } catch { showToast("Erreur réseau", "err"); }
  };

  const handleCreateSession = async (e: FormEvent) => {
    e.preventDefault();
    setSessionError(""); setSessionSuccess("");
    if (!sessionFormData.formationId || !sessionFormData.startDate || !sessionFormData.endDate || !sessionFormData.location) {
      setSessionError("Tous les champs obligatoires doivent être remplis"); return;
    }
    setSubmittingSession(true);
    try {
      const r = await fetch(buildApiUrl("/api/sessions"), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ formationId: parseInt(sessionFormData.formationId, 10), startDate: new Date(sessionFormData.startDate).toISOString(), endDate: new Date(sessionFormData.endDate).toISOString(), location: sessionFormData.location, capacity: parseInt(sessionFormData.capacity, 10) })
      });
      if (r.ok) {
        setSessionSuccess("Session créée avec succès!");
        setSessionFormData({ formationId: "", startDate: "", endDate: "", location: "", capacity: "20" });
        setShowSessionForm(false);
        await fetchSessions();
        setTimeout(() => setSessionSuccess(""), 3000);
      } else { const errText = await r.text(); setSessionError(errText || "Erreur lors de la création"); }
    } catch (err) { setSessionError((err as Error).message); }
    finally { setSubmittingSession(false); }
  };

  const selectedCompany = odooCompanies.find((company) => company.id === selectedCompanyId) ?? null;
  const adminTabs: readonly AdminTab[] = selectedCompany?.type === "market"
    ? (["users", "articles", "brochures", "ecommerce"] as const)
    : (["users", "articles", "brochures", "inscriptions", "sessions", "ecommerce"] as const);
  const activeProfile: UserProfile | null =
    selectedCompany?.type === "market"
      ? "MARKET_CUSTOMER"
      : selectedCompany?.type === "groupe"
        ? "TRAINING_PARTICIPANT"
        : null;

  // Garde-fou : si l'onglet actif n'existe pas pour la société choisie (ex. Inscriptions en mode Market),
  // on retombe sur « Utilisateurs » au lieu d'afficher une page sans onglet.
  useEffect(() => {
    if (!tabStateReady || !selectedCompany) return;
    if (!adminTabs.includes(activeTab)) handleSetActiveTab("users");
  }, [selectedCompany?.type, activeTab, tabStateReady]);

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    const fullName = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim().toLowerCase();
    const ms = u.email.toLowerCase().includes(q) || fullName.includes(q);
    const mr = filterRole === "all" || u.role === filterRole;
    const ma = filterActive === "all" || (filterActive === "active" ? u.active : !u.active);
    const mp =
      u.role === "admin" ||
      u.profiles.length === 0 ||
      !activeProfile ||
      u.profiles.includes(activeProfile);
    return ms && mr && ma && mp;
  });

  const handleSaveUser = async () => {
    if (!formData.email || !formData.firstName || !formData.lastName) { showToast("Champs requis manquants", "err"); return; }
    try {
      const isAdding = modalMode === "add";
      const r = await fetch("/api/users", {
        method: isAdding ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          ...(isAdding ? {} : { id: selectedUser?.id }),
          employeeRole: formData.employeeRole || null,
        }),
      });
      if (r.ok) { await fetchUsers(); setShowModal(false); showToast(modalMode === "add" ? "Utilisateur créé" : "Mis à jour"); }
      else {
        const payload: unknown = await r.json().catch(() => null);
        const message =
          payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
            ? payload.error
            : `Erreur lors de la sauvegarde (${r.status})`;
        showToast(message, "err");
      }
    } catch (error) {
      console.error("[Admin/Users] Could not save user:", error);
      showToast("Erreur réseau lors de la sauvegarde", "err");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setActionSheetUser(null);
    try {
      const r = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId }),
      });
      if (r.ok) { await fetchUsers(); showToast("Utilisateur supprimé"); }
      else showToast("Erreur suppression", "err");
    } catch { showToast("Erreur réseau", "err"); }
  };

  const handleToggleActive = async (userId: string, current: boolean) => {
    setActionSheetUser(null);
    try {
      const r = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId }),
      });
      if (r.ok) { await fetchUsers(); showToast(current ? "Compte désactivé" : "Compte activé"); }
      else showToast("Erreur", "err");
    } catch { showToast("Erreur réseau", "err"); }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    void fetch("/api/auth/logout", { method: "POST" }).finally(() => {
      window.dispatchEvent(new Event("fisafi:session-expired"));
      router.push("/");
    });
  };

  const fetchArticles = async () => {
    setLoadingArticles(true);
    const endpoints = ["/api/fetch-articles-admin", "/api/admin/articles", "/api/articles/manage"];
    for (const endpoint of endpoints) {
      try {
        const r = await fetch(endpoint);
        if (r.ok) {
          const d = await r.json();
          const articleList = Array.isArray(d.data) ? d.data : (d.data?.data || []);
          setArticles(articleList); setLoadingArticles(false); return;
        }
      } catch { /* essaie l'endpoint suivant */ }
    }
    setArticles([]); setLoadingArticles(false);
  };

  const handleSubmitArticle = async (e: FormEvent) => {
    e.preventDefault(); setArticleError(""); setArticleSuccess("");
    if (!articleFormData.title || !articleFormData.excerpt || !articleFormData.content) { setArticleError("Champs obligatoires manquants"); return; }
    setSubmittingArticle(true);
    try {
      const authorName = `${currentUser?.firstName ?? ""} ${currentUser?.lastName ?? ""}`.trim() || currentUser?.email || "";
      const r = await fetch("/api/articles", { method: "POST", headers: authHeaders(), body: JSON.stringify({ ...articleFormData, author: articleFormData.author || authorName }) });
      const d = await r.json();
      if (r.ok) {
        setArticleSuccess("Article créé!");
        setArticleFormData({ title: "", category: "Articles techniques", excerpt: "", content: "", image: "", author: "" });
        setShowArticleForm(false);
        const newArticle: Article = { id: d.data?.id || Date.now(), title: articleFormData.title, category: articleFormData.category, excerpt: articleFormData.excerpt, content: articleFormData.content, image: articleFormData.image, author: articleFormData.author || authorName, published: false, createdAt: new Date().toISOString() };
        setArticles([newArticle, ...articles]);
        setTimeout(() => fetchArticles(), 1000);
        setTimeout(() => setArticleSuccess(""), 3000);
      } else { setArticleError(d.error || "Erreur création"); }
    } catch (err) { setArticleError("Erreur: " + (err as Error).message); }
    finally { setSubmittingArticle(false); }
  };

  const handlePublishArticle = async (id: number, current: boolean) => {
    setActionSheetArticle(null);
    try {
      const r = await fetch(buildApiUrl(`/api/articles/${id}`), { method: "PUT", headers: authHeaders(), body: JSON.stringify({ published: !current }) });
      if (r.ok) { showToast(!current ? "Article publié" : "Article dépublié"); await fetchArticles(); }
      else showToast("Erreur", "err");
    } catch { showToast("Erreur réseau", "err"); }
  };

  const handleDeleteArticle = async (id: number) => {
    setActionSheetArticle(null);
    try {
      const r = await fetch(buildApiUrl(`/api/articles/${id}`), { method: "DELETE", headers: authHeaders(false) });
      if (r.ok) { showToast("Article supprimé"); await fetchArticles(); }
      else showToast("Erreur", "err");
    } catch { showToast("Erreur réseau", "err"); }
  };

  const fetchBrochures = async () => {
    setLoadingBrochures(true);
    try {
      const r = await fetch("/api/brochures/manage");
      if (r.ok) { const d = await r.json(); setBrochures(d.data || []); }
      else showToast(`Impossible de charger les brochures (HTTP ${r.status}).`, "err");
    } catch { showToast("Erreur réseau lors du chargement des brochures.", "err"); }
    finally { setLoadingBrochures(false); }
  };

  const handleSubmitBrochure = async (e: FormEvent) => {
    e.preventDefault(); setBrochureError(""); setBrochureSuccess("");
    if (!brochureFormData.name || !brochureFile) { setBrochureError("Fichier et nom requis"); return; }
    setSubmittingBrochure(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      try {
        const r = await fetch("/api/brochures/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileBuffer: base64, fileName: brochureFile!.name, ...brochureFormData }) });
        const d = await r.json();
        if (r.ok) { setBrochureSuccess("Brochure uploadée!"); setBrochureFormData({ name: "", description: "" }); setBrochureFile(null); setShowBrochureForm(false); await fetchBrochures(); setTimeout(() => setBrochureSuccess(""), 3000); }
        else setBrochureError(d.error || "Erreur upload");
      } catch (err) { setBrochureError("Erreur: " + (err as Error).message); }
      finally { setSubmittingBrochure(false); }
    };
    reader.onerror = () => { setBrochureError("Impossible de lire le fichier"); setSubmittingBrochure(false); };
    reader.readAsDataURL(brochureFile);
  };

  const handlePublishBrochure = async (id: string, current: boolean) => {
    setActionSheetBrochure(null);
    try {
      const r = await fetch(buildApiUrl(`/api/brochures/${id}`), { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ published: !current }) });
      if (r.ok) { showToast(!current ? "Brochure publiée" : "Brochure dépubliée"); await fetchBrochures(); }
      else showToast("Erreur", "err");
    } catch { showToast("Erreur réseau", "err"); }
  };

  const handleDeleteBrochure = async (id: string) => {
    setActionSheetBrochure(null);
    try {
      const r = await fetch(buildApiUrl(`/api/brochures/${id}`), { method: "DELETE" });
      if (r.ok) { showToast("Brochure supprimée"); await fetchBrochures(); }
      else showToast("Erreur", "err");
    } catch { showToast("Erreur réseau", "err"); }
  };

  if (loading || !currentUser) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100svh", background: "#f6f5f7" }}>
      <div className="spinner" />
    </div>
  );

  const initials = ((currentUser.firstName?.[0] || "") + (currentUser.lastName?.[0] || "")).toUpperCase() || currentUser.email[0].toUpperCase();
  const selectCompany = async (company: OdooCompany) => {
    if (company.id === selectedCompanyId) {
      setCompanyPickerSource(null);
      return;
    }
    try {
      await persistEmployeeCompany(company.id);
    } catch (error) {
      console.error("[Admin/Odoo] Could not persist the employee company context:", error);
      setOdooCompaniesError(
        error instanceof Error ? error.message : "Impossible de sélectionner cette société.",
      );
      return;
    }
    setOdooCompaniesError("");
    marketStatsRequestId.current += 1;
    setSelectedCompanyId(company.id);
    localStorage.setItem("adminOdooCompanyId", String(company.id));
    setMarketStats(null);
    setMarketStatsError("");
    if (company.type === "market" && (activeTab === "inscriptions" || activeTab === "sessions")) {
      handleSetActiveTab("users");
    }
    setCompanyPickerSource(null);
  };
  const renderCompanyPicker = (source: "sidebar" | "topbar") => companyPickerSource === source ? (
    <div className="company-picker" role="group" aria-label="Choisir une société Odoo">
      <strong>Entreprise active</strong>
      {loadingOdooCompanies ? (
        <span className="company-picker-message">Chargement des sociétés…</span>
      ) : odooCompaniesError ? (
        <>
          <span className="company-picker-error">{odooCompaniesError}</span>
          <button type="button" className="company-picker-option" onClick={() => void fetchOdooCompanies()}>
            Réessayer
          </button>
        </>
      ) : odooCompanies.length ? (
        odooCompanies.map((company) => (
          <button
            type="button"
            className={`company-picker-option${company.id === selectedCompanyId ? " selected" : ""}`}
            key={company.id}
            onClick={() => void selectCompany(company)}
          >
            <span>{company.name}</span>
            {company.id === selectedCompanyId && <span aria-label="Sélectionnée">✓</span>}
          </button>
        ))
      ) : (
        <span className="company-picker-message">Aucune société Odoo accessible.</span>
      )}
    </div>
  ) : null;

  const inscriptionsPending = inscriptions.filter(i => i.status === "liste_attente" || i.status === "demande_en_attente").length;

  return (
    <>
      <Head>
        <title>Admin Dashboard — FiSAFi Groupe</title>
        <meta name="robots" content="noindex" />
        <meta name="color-scheme" content="light" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      {/* Toast */}
      {toast && <div className={`toast${toast.type === "err" ? " err" : ""}`}>{toast.msg}</div>}

      {navOpen && (
        <button
          type="button"
          className="mob-menu-backdrop"
          aria-label="Fermer le menu de navigation"
          onClick={() => {
            setNavOpen(false);
            mobileMenuButtonRef.current?.focus();
          }}
        />
      )}

      {/* Mobile menu */}
      <nav
        id="admin-mobile-navigation"
        className={`mob-menu${navOpen ? " open" : ""}`}
        aria-label="Navigation mobile"
        aria-hidden={!navOpen}
      >
        <div className="mob-menu-user">
          <div className="mob-menu-avatar">{initials}</div>
          <div>
            <div className="mob-menu-name">{currentUser.firstName} {currentUser.lastName}</div>
            <div className="mob-menu-email">{currentUser.email}</div>
          </div>
        </div>
        <div className="mob-nav-section">
          <span className="mob-nav-section-label">Navigation</span>
          <a href="/" className="mob-nav-link">
            <span>Accueil du site</span>
            <span aria-hidden="true">↗</span>
          </a>
          {adminTabs.map(tab => (
            <button
              type="button"
              key={tab}
              className={`mob-nav-link${activeTab === tab ? " active" : ""}`}
              aria-current={activeTab === tab ? "page" : undefined}
              onClick={() => {
                handleSetActiveTab(tab);
                mobileMenuButtonRef.current?.focus();
              }}
            >
              <span>{getTabLabel(tab, selectedCompany?.type)}</span>
              {tab === "users" && users.length > 0 && <span className="mob-nav-badge">{users.length}</span>}
              {tab === "inscriptions" && inscriptionsPending > 0 && <span className="mob-nav-badge">{inscriptionsPending}</span>}
            </button>
          ))}
          <a href="/espace-employe" className="mob-nav-link">
            <span>Espace employé</span>
            <span aria-hidden="true">→</span>
          </a>
          <a href="/dashboard" className="mob-nav-link"><span>Retour Dashboard</span></a>
        </div>
        <button className="mob-nav-link mob-logout" onClick={handleLogout}>Déconnexion</button>
      </nav>

      <div className="admin-layout">
        {/* Sidebar desktop */}
        <aside className="admin-sidebar">
          <div className="sidebar-top">
            <div className="company-logo-anchor">
              <button
                type="button"
                className="sidebar-logo company-logo-button"
                onClick={() => {
                  setCompanyPickerSource((source) => source === "sidebar" ? null : "sidebar");
                  if (!odooCompanies.length && !loadingOdooCompanies) void fetchOdooCompanies();
                }}
                aria-label={`Basculer d’entreprise. Société active : ${selectedCompany?.name ?? "aucune"}`}
                aria-expanded={companyPickerSource === "sidebar"}
              >
                Fi<span>SAFI</span>
              </button>
              {renderCompanyPicker("sidebar")}
            </div>
            <div className="sidebar-badge">Admin Dashboard</div>
          </div>

          <div className="sidebar-user-section">
            <div className="sidebar-avatar">{initials}</div>
            <div>
              <div className="sidebar-name">{currentUser.firstName} {currentUser.lastName}</div>
              <div className="sidebar-role">
                Administrateur{selectedCompany ? ` · ${selectedCompany.name}` : ""}
              </div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <a href="/" className="sidebar-link">
              <span className="sidebar-link-left">Accueil du site</span>
              <span aria-hidden="true">↗</span>
            </a>
            <span className="sidebar-nav-label">Gestion</span>
            {adminTabs.map(tab => (
              <button key={tab} className={`sidebar-link${activeTab === tab ? " active" : ""}`} onClick={() => handleSetActiveTab(tab)}>
                <span className="sidebar-link-left">{getTabLabel(tab, selectedCompany?.type)}</span>
                {tab === "users" && users.length > 0 && <span className="sidebar-count blue">{users.length}</span>}
                {tab === "inscriptions" && inscriptionsPending > 0 && <span className="sidebar-count">{inscriptionsPending}</span>}
                {tab === "articles" && articles.length > 0 && <span className="sidebar-count blue">{articles.length}</span>}
                {tab === "sessions" && sessions.length > 0 && <span className="sidebar-count blue">{sessions.length}</span>}
              </button>
            ))}
            <span className="sidebar-nav-label">Opérations</span>
            <a href="/espace-employe" className="sidebar-link">
              <span className="sidebar-link-left">Espace employé</span>
              <span aria-hidden="true">→</span>
            </a>
          </nav>

          <div className="sidebar-footer">
            <button className="btn-logout-new" onClick={handleLogout}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Déconnexion
            </button>
          </div>
        </aside>

        <div className="admin-main">
          {/* Topbar */}
          <header className="mob-topbar">
            <div className="company-logo-anchor">
              <button
                type="button"
                className="company-mobile-logo-button"
                onClick={() => {
                  setCompanyPickerSource((source) => source === "topbar" ? null : "topbar");
                  if (!odooCompanies.length && !loadingOdooCompanies) void fetchOdooCompanies();
                }}
                aria-label={`Basculer d’entreprise. Société active : ${selectedCompany?.name ?? "aucune"}`}
                aria-expanded={companyPickerSource === "topbar"}
              >
                <span className="mob-mobile-logo" aria-hidden="true">
                  <Image src="/favicon/web-app-manifest-192x192.png" alt="" width={72} height={72} priority />
                </span>
                <span className="mob-logo">Fi<span>SAFI</span></span>
              </button>
              {renderCompanyPicker("topbar")}
            </div>
            <div className="mob-topbar-right">
              <a href="/" className="admin-topbar-back admin-topbar-home" aria-label="Accueil du site">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></svg>
                <span>Accueil</span>
              </a>
              <button type="button" className="admin-topbar-back" onClick={handleGoBack} aria-label="Retour au tableau de bord précédent">
                <span aria-hidden="true">←</span>
                <span>Retour</span>
              </button>
              <div className="mob-avatar">{initials}</div>
              <button
                ref={mobileMenuButtonRef}
                type="button"
                className={`mob-menu-btn${navOpen ? " open" : ""}`}
                onClick={() => setNavOpen(!navOpen)}
                aria-label={navOpen ? "Fermer le menu" : "Ouvrir le menu"}
                aria-expanded={navOpen}
                aria-controls="admin-mobile-navigation"
              >
                <span/><span/><span/>
              </button>
            </div>
          </header>

          <div className="admin-content">

            {/* ═══ USERS ═══ */}
            {activeTab === "users" && (<>
              <div className="admin-header">
                <div className="admin-eyebrow">Gestion</div>
                <h1 className="admin-title">Utilisateurs</h1>
                <p className="admin-sub">
                  Gérez les comptes, les profils d’usage et les droits d’accès
                  {selectedCompany ? ` · ${selectedCompany.name}` : ""}
                </p>
              </div>

              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-num">{filteredUsers.length}</div>
                  <div className="stat-label">Total</div>
                </div>
                <div className="stat-card">
                  <div className="stat-num green">{filteredUsers.filter(u => u.active).length}</div>
                  <div className="stat-label">Actifs</div>
                </div>
                <div className="stat-card">
                  <div className="stat-num orange">{filteredUsers.filter(u => u.role === "admin").length}</div>
                  <div className="stat-label">Admins</div>
                </div>
              </div>

              <div className="search-box">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input placeholder="Chercher par email ou nom…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                {searchQuery && <button onClick={() => setSearchQuery("")} aria-label="Effacer la recherche" style={{ background:"none",border:"none",cursor:"pointer",color:"var(--steel)",fontSize:18,lineHeight:1,padding:"0 2px" }}>✕</button>}
              </div>

              <div className="filter-row">
                <select value={filterRole} onChange={e => setFilterRole(e.target.value as "all" | "admin" | "user")}>
                  <option value="all">Tous les rôles</option>
                  <option value="user">Utilisateur</option>
                  <option value="admin">Admin</option>
                </select>
                <select value={filterActive} onChange={e => setFilterActive(e.target.value as "all" | "active" | "inactive")}>
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                </select>
              </div>

              {/* Mobile: cards */}
              <div className="mob-only">
                {filteredUsers.length === 0
                  ? <div className="empty"><div className="empty-icon">—</div><p className="empty-text">Aucun utilisateur trouvé</p></div>
                  : filteredUsers.map(u => (
                    <div key={u.id} className={`user-card${u.role === "admin" ? " is-admin-card" : ""}`} onClick={() => setActionSheetUser(u)}>
                      <div className={`user-card-avatar${u.role === "admin" ? " is-admin" : ""}`}>
                        {((u.firstName?.[0] || "") + (u.lastName?.[0] || "")).toUpperCase() || u.email[0].toUpperCase()}
                      </div>
                      <div className="user-card-info">
                        <div className="user-card-name">{u.firstName} {u.lastName}</div>
                        <div className="user-card-email">{u.email}</div>
                        <div className="user-card-email">
                          {u.profiles.length ? u.profiles.map(getUserProfileLabel).join(" · ") : "Profil à classer"}
                        </div>
                      </div>
                      <div className="user-card-right">
                        <div className={`status-dot ${u.active ? "active" : "inactive"}`}/>
                        <span className={`badge badge-${u.role}`}>{u.role}</span>
                        <svg className="chevron" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Desktop: table */}
              <div className="desk-only">
                {filteredUsers.length === 0
                  ? <div className="empty"><div className="empty-icon">—</div><p className="empty-text">Aucun utilisateur trouvé</p></div>
                  : <div className="table-wrap">
                      <table>
                        <thead><tr><th>Nom</th><th>Email</th><th>Rôle d’accès</th><th>Profil d’usage</th><th>Statut</th><th>Créé le</th><th>Actions</th></tr></thead>
                        <tbody>
                          {filteredUsers.map(u => (
                            <tr key={u.id}>
                              <td style={{ fontWeight:600 }}>{u.firstName} {u.lastName}</td>
                              <td>{u.email}</td>
                              <td>
                                <span className={`badge badge-${u.role}`}>{u.role}</span>
                                {u.employeeRole && <span className="badge badge-admin">{u.employeeRole}</span>}
                              </td>
                              <td>
                                {u.profiles.length
                                  ? u.profiles.map((profile) => (
                                      <span className="badge badge-user" key={profile}>{getUserProfileLabel(profile)}</span>
                                    ))
                                  : <span className="badge">À classer</span>}
                              </td>
                              <td>
                                <span style={{ display:"inline-flex",alignItems:"center",gap:"0.4rem",fontSize:"0.9rem",fontWeight:600,color:u.active ? "var(--success)" : "var(--danger)" }}>
                                  <span className={`status-dot ${u.active ? "active" : "inactive"}`}/>
                                  {u.active ? "Actif" : "Inactif"}
                                </span>
                              </td>
                              <td>{new Date(u.createdAt).toLocaleDateString("fr-FR")}</td>
                              <td>
                                <div className="action-btns">
                                  <button className="btn-sm" onClick={() => { setModalMode("edit"); setSelectedUser(u); setFormData({ email:u.email, firstName:u.firstName||"", lastName:u.lastName||"", password:"", employeeRole:u.employeeRole || "", profiles:u.profiles }); setShowModal(true); }}>Éditer</button>
                                  <button className="btn-sm" onClick={() => handleToggleActive(u.id, u.active)}>{u.active ? "Désactiver" : "Activer"}</button>
                                  <button className="btn-sm danger" onClick={() => { if (confirm("Supprimer cet utilisateur ?")) handleDeleteUser(u.id); }}>Supprimer</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>}
              </div>

              <button className="fab" aria-label="Ajouter un utilisateur" onClick={() => { setModalMode("add"); setFormData({ email:"",firstName:"",lastName:"",password:"",employeeRole:"",profiles:[] }); setSelectedUser(null); setShowModal(true); }}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            </>)}

            {/* ═══ ARTICLES ═══ */}
            {activeTab === "articles" && (<>
              <div className="admin-header">
                <div className="admin-eyebrow">Publications</div>
                <h1 className="admin-title">Articles & Actualités</h1>
                <p className="admin-sub">Gérez les articles et publications</p>
              </div>

              {articleSuccess && <div className="alert alert-ok">✓ {articleSuccess}</div>}

              {showArticleForm ? (
                <div className="form-panel">
                  <div className="form-panel-header">
                    <span className="form-panel-title">Nouvel article</span>
                    <button className="form-panel-close" aria-label="Fermer" onClick={() => setShowArticleForm(false)}>✕</button>
                  </div>
                  {articleError && <div className="alert alert-err">⚠ {articleError}</div>}
                  <form onSubmit={handleSubmitArticle}>
                    <div className="form-row-grid">
                      <div className="form-group">
                        <label className="form-label">Titre *</label>
                        <input type="text" className="form-input" value={articleFormData.title} onChange={e => setArticleFormData({...articleFormData,title:e.target.value})} placeholder="Titre de l'article" required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Catégorie *</label>
                        <select className="form-select" value={articleFormData.category} onChange={e => setArticleFormData({...articleFormData,category:e.target.value})}>
                          <option>Articles techniques</option>
                          <option>Innovations</option>
                          <option>Événements</option>
                          <option>Veille sectorielle</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Résumé *</label>
                      <textarea className="form-textarea" value={articleFormData.excerpt} onChange={e => setArticleFormData({...articleFormData,excerpt:e.target.value})} placeholder="Courte description pour l'aperçu" required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Contenu *</label>
                      <textarea className="form-textarea" style={{ minHeight:160 }} value={articleFormData.content} onChange={e => setArticleFormData({...articleFormData,content:e.target.value})} placeholder="Contenu complet de l'article" required />
                    </div>
                    <div className="form-row-grid">
                      <div className="form-group">
                        <label className="form-label">URL Image</label>
                        <input type="text" className="form-input" value={articleFormData.image} onChange={e => setArticleFormData({...articleFormData,image:e.target.value})} placeholder="https://…" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Auteur</label>
                        <input type="text" className="form-input" value={articleFormData.author} onChange={e => setArticleFormData({...articleFormData,author:e.target.value})} placeholder="Nom de l'auteur" />
                      </div>
                    </div>
                    <div className="modal-actions">
                      <button type="button" className="btn-cancel-fill" onClick={() => setShowArticleForm(false)}>Annuler</button>
                      <button type="submit" className="btn-primary-fill" disabled={submittingArticle}>{submittingArticle ? "Création…" : "Créer l'article"}</button>
                    </div>
                  </form>
                </div>
              ) : (
                <button className="btn-add" onClick={() => { setShowArticleForm(true); setArticleError(""); setArticleSuccess(""); }}>
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Nouvel article
                </button>
              )}

              {renderContentList(loadingArticles, articles, "📝", "Aucun article pour le moment", (a) => (
                <div key={a.id} className="content-card" onClick={() => setActionSheetArticle(a)}>
                  <div className="content-card-title">{a.title}</div>
                  <div className="content-card-meta">
                    <span className="cat-badge">{a.category}</span>
                    <span className={getPublishedStatus(a.published).className}>{getPublishedStatus(a.published).text}</span>
                    <span className="content-date">{new Date(a.createdAt).toLocaleDateString("fr-FR")}</span>
                    {a.author && <span className="content-date">par {a.author}</span>}
                  </div>
                  <div className="content-card-excerpt">{a.excerpt}</div>
                </div>
              ))}

              {!showArticleForm && (
                <button className="fab" aria-label="Nouvel article" onClick={() => { setShowArticleForm(true); setArticleError(""); setArticleSuccess(""); }}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
              )}
            </>)}

            {/* ═══ BROCHURES ═══ */}
            {activeTab === "brochures" && (<>
              <div className="admin-header">
                <div className="admin-eyebrow">Documents</div>
                <h1 className="admin-title">Brochures</h1>
                <p className="admin-sub">Gérez les documents téléchargeables</p>
              </div>

              {brochureSuccess && <div className="alert alert-ok">✓ {brochureSuccess}</div>}

              {showBrochureForm ? (
                <div className="form-panel">
                  <div className="form-panel-header">
                    <span className="form-panel-title">Uploader une brochure</span>
                    <button className="form-panel-close" aria-label="Fermer" onClick={() => setShowBrochureForm(false)}>✕</button>
                  </div>
                  {brochureError && <div className="alert alert-err">⚠ {brochureError}</div>}
                  <form onSubmit={handleSubmitBrochure}>
                    <div className="form-group">
                      <label className="form-label">Nom *</label>
                      <input type="text" className="form-input" value={brochureFormData.name} onChange={e => setBrochureFormData({...brochureFormData,name:e.target.value})} placeholder="Ex: Brochure Services 2025" required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea className="form-textarea" value={brochureFormData.description} onChange={e => setBrochureFormData({...brochureFormData,description:e.target.value})} placeholder="Description de la brochure" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Fichier PDF ou Image *</label>
                      <input type="file" className="form-input" accept=".pdf,.png,.jpg,.jpeg,.gif" onChange={e => setBrochureFile(e.target.files?.[0] || null)} required />
                      {brochureFile && <p style={{ fontSize:"0.85rem",color:"var(--steel)",marginTop:6 }}>{brochureFile.name} — {(brochureFile.size/1024/1024).toFixed(2)} MB</p>}
                    </div>
                    <div className="modal-actions">
                      <button type="button" className="btn-cancel-fill" onClick={() => setShowBrochureForm(false)}>Annuler</button>
                      <button type="submit" className="btn-primary-fill" disabled={submittingBrochure}>{submittingBrochure ? "Upload…" : "Uploader"}</button>
                    </div>
                  </form>
                </div>
              ) : (
                <button className="btn-add" onClick={() => { setShowBrochureForm(true); setBrochureError(""); setBrochureSuccess(""); }}>
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Uploader une brochure
                </button>
              )}

              {renderContentList(loadingBrochures, brochures, "📄", "Aucune brochure pour le moment", (b) => (
                <div key={b.id} className="content-card" onClick={() => setActionSheetBrochure(b)}>
                  <div className="content-card-title">{b.name}</div>
                  <div className="content-card-meta">
                    <span className="cat-badge">{b.type || "PDF"}</span>
                    <span className={getBrochureStatus(b.published).className}>{getBrochureStatus(b.published).text}</span>
                    {b.fileSize && <span className="content-date">{(Number.parseInt(b.fileSize, 10)/1024/1024).toFixed(2)} MB</span>}
                    <span className="content-date">{new Date(b.createdAt).toLocaleDateString("fr-FR")}</span>
                  </div>
                  {b.description && <div className="content-card-excerpt">{b.description}</div>}
                </div>
              ))}

              {!showBrochureForm && (
                <button className="fab" aria-label="Uploader une brochure" onClick={() => { setShowBrochureForm(true); setBrochureError(""); setBrochureSuccess(""); }}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
              )}
            </>)}

            {/* ═══ INSCRIPTIONS ═══ */}
            {activeTab === "inscriptions" && (<>
              <div className="admin-header">
                <div className="admin-eyebrow">Gestion</div>
                <h1 className="admin-title">Inscriptions</h1>
                <p className="admin-sub">Acceptez ou rejetez les demandes d'inscription</p>
              </div>

              {inscriptionsPending > 0 && (
                <div className="alert alert-warn">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" style={{ flexShrink:0,marginTop:2 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  {inscriptionsPending} demande{inscriptionsPending > 1 ? "s" : ""} en attente de traitement
                </div>
              )}

              <div className="filter-row">
                <select value={filterInscriptionStatus} onChange={e => setFilterInscriptionStatus(e.target.value as "all" | "liste_attente" | "confirme" | "annule")}>
                  <option value="all">Tous les statuts</option>
                  <option value="liste_attente">En attente</option>
                  <option value="confirme">Confirmés</option>
                  <option value="annule">Annulés</option>
                </select>
              </div>

              {renderContentList(loadingInscriptions, inscriptions, "◎", "Aucune inscription", (inscription) => {
                const accentClass = inscription.status === "confirme" ? "insc-confirme" : inscription.status === "annule" ? "insc-annule" : "insc-attente";
                const statusClass =
                  inscription.status === "confirme"
                    ? "pub-on"
                    : inscription.status === "liste_attente" || inscription.status === "demande_en_attente"
                      ? "pub-wait"
                      : "pub-off";
                return (
                  <div key={inscription.id} className={`content-card ${accentClass}`} onClick={() => setActionSheetInscription(inscription)}>
                    <div className="content-card-title">{inscription.firstName} {inscription.lastName}</div>
                    <div className="content-card-meta">
                      <span className="cat-badge">{inscription.formation?.name || "Formation"}</span>
                      <span className={statusClass}>
                        {inscription.status === "confirme" ? "Confirmé" : inscription.status === "annule" ? "Annulé" : "En attente"}
                      </span>
                      <span className="content-date">{inscription.session?.location || "Lieu"}</span>
                      <span className="content-date">{new Date(inscription.session?.startDate || inscription.createdAt).toLocaleDateString("fr-FR")}</span>
                    </div>
                    <div style={{ fontSize:"0.9rem",color:"var(--steel)" }}>{inscription.email}</div>
                  </div>
                );
              })}
            </>)}

            {/* ═══ SESSIONS ═══ */}
            {activeTab === "sessions" && (<>
              <div className="admin-header">
                <div className="admin-eyebrow">Gestion</div>
                <h1 className="admin-title">Sessions de Formation</h1>
                <p className="admin-sub">Créez et gérez les sessions de formation</p>
              </div>

              {sessionSuccess && <div className="alert alert-ok">✓ {sessionSuccess}</div>}
              {sessionError && <div className="alert alert-err">⚠ {sessionError}</div>}

              {!showSessionForm && (
                <button className="btn-add" onClick={() => { setShowSessionForm(true); setSessionError(""); setSessionSuccess(""); }}>
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Créer une session
                </button>
              )}

              {showSessionForm && (
                <div className="section-form">
                  <div className="form-panel-header">
                    <span className="section-form-title">Nouvelle session</span>
                    <button className="form-panel-close" aria-label="Fermer" onClick={() => setShowSessionForm(false)}>✕</button>
                  </div>
                  <form onSubmit={handleCreateSession}>
                    <div className="form-row-grid">
                      <div className="form-group">
                        <label className="form-label">Formation *</label>
                        <select className="form-select" value={sessionFormData.formationId} onChange={e => setSessionFormData({...sessionFormData, formationId: e.target.value})} required>
                          <option value="">Sélectionner une formation</option>
                          {formations.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Capacité *</label>
                        <input type="number" className="form-input" value={sessionFormData.capacity} onChange={e => setSessionFormData({...sessionFormData, capacity: e.target.value})} min="1" required/>
                      </div>
                    </div>
                    <div className="form-row-grid">
                      <div className="form-group">
                        <label className="form-label">Date début *</label>
                        <input type="datetime-local" className="form-input" value={sessionFormData.startDate} onChange={e => setSessionFormData({...sessionFormData, startDate: e.target.value})} required/>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Date fin *</label>
                        <input type="datetime-local" className="form-input" value={sessionFormData.endDate} onChange={e => setSessionFormData({...sessionFormData, endDate: e.target.value})} required/>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Lieu *</label>
                      <input type="text" className="form-input" value={sessionFormData.location} onChange={e => setSessionFormData({...sessionFormData, location: e.target.value})} placeholder="Dakar, N'Djamena, Abidjan…" required/>
                    </div>
                    <div className="modal-actions">
                      <button type="button" className="btn-cancel-fill" onClick={() => setShowSessionForm(false)} disabled={submittingSession}>Annuler</button>
                      <button type="submit" className="btn-primary-fill" disabled={submittingSession}>{submittingSession ? "Création…" : "Créer la session"}</button>
                    </div>
                  </form>
                </div>
              )}

              <span className="section-label">Sessions existantes</span>

              {loadingSessions
                ? <div className="empty"><div className="spinner"/></div>
                : sessions.length === 0
                  ? <div className="empty"><div className="empty-icon">📅</div><p className="empty-text">Aucune session créée</p></div>
                  : <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,19rem),1fr))",gap:"0.9rem" }}>
                      {sessions.map(session => {
                        const formation = formations.find(f => f.id === session.formationId);
                        const fillPct = session.capacity > 0 ? Math.round(((session.capacity - session.available) / session.capacity) * 100) : 0;
                        return (
                          <div key={session.id} className="session-card" onClick={() => setActionSheetSession(session)}>
                            <div className="session-card-name">{formation?.name || "Formation"}</div>
                            <div className="session-card-row">
                              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                              {session.location}
                            </div>
                            <div className="session-card-row">
                              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                              {new Date(session.startDate).toLocaleDateString("fr-FR")} — {new Date(session.endDate).toLocaleDateString("fr-FR")}
                            </div>
                            {session.status && (
                              <div className={getSessionStatusClass(session.status)}>
                                {session.status}
                              </div>
                            )}
                            <div className="session-capacity">
                              <div className="capacity-bar"><div className="capacity-fill" style={{ width:`${fillPct}%` }}/></div>
                              <span style={{ fontSize:"0.8rem",fontWeight:600,color:"var(--steel)",flexShrink:0 }}>{session.available}/{session.capacity}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
              }
            </>)}

            {/* ═══ E-COMMERCE ═══ */}
            {activeTab === "ecommerce" && (<>
              <div className="admin-header">
                <div className="admin-eyebrow">Commerce</div>
                <div className="market-stats-heading">
                  <div>
                    <h1 className="admin-title">
                      {selectedCompany?.type === "groupe" ? "Ventes FiSAFi Groupe" : "FiSAFi Market"}
                    </h1>
                    <p className="admin-sub">
                      {selectedCompany
                        ? `Données Odoo de ${selectedCompany.name}, isolées des autres sociétés.`
                        : "Choisissez FiSAFi Groupe ou FiSAFi Market avec le logo FiSAFi."}
                    </p>
                  </div>
                  <button className="btn-sm market-refresh" onClick={() => void fetchMarketStats()} disabled={loadingMarketStats || selectedCompanyId === null}>
                    {loadingMarketStats ? "Actualisation…" : "Actualiser"}
                  </button>
                </div>
              </div>

              {selectedCompanyId === null && (
                <div className="alert alert-err" role="status">
                  {odooCompaniesError
                    ? odooCompaniesError
                    : loadingOdooCompanies
                      ? "Chargement des sociétés accessibles dans Odoo…"
                      : "Sélectionnez FiSAFi Groupe ou FiSAFi Market avec le logo FiSAFi du tableau de bord."}
                  {odooCompaniesError && (
                    <button className="market-retry" onClick={() => void fetchOdooCompanies()}>Réessayer</button>
                  )}
                </div>
              )}

              {marketStatsError && (
                <div className="alert alert-err" role="alert">
                  {marketStatsError}
                  <button className="market-retry" onClick={() => void fetchMarketStats()}>Réessayer</button>
                </div>
              )}

              {selectedCompanyId !== null && loadingMarketStats && !marketStats ? (
                <div className="empty"><div className="spinner"/></div>
              ) : marketStats && marketStats.company.id === selectedCompanyId ? (
                <>
                  <div className="stats-row market-stats-grid">
                    <div className="stat-card">
                      <div className="stat-num blue">{marketStats.period.orders}</div>
                      <div className="stat-label">{marketStats.company.type === "market" ? "Demandes" : "Devis / commandes"} · 30 jours</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-num green">{formatMarketCurrency(marketStats.period.confirmedRevenue)}</div>
                      <div className="stat-label">Ventes confirmées · 30 jours</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-num orange">{marketStats.period.pendingOrders}</div>
                      <div className="stat-label">Devis en attente</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-num">{marketStats.period.customers}</div>
                      <div className="stat-label">Clients · 30 jours</div>
                    </div>
                  </div>

                  <div className="market-stats-secondary">
                    <div className="content-card">
                      <span className="market-secondary-label">{marketStats.company.type === "market" ? "Taux de conversion" : "Taux de confirmation"} · 30 jours</span>
                      <strong>{marketStats.period.conversionRate.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}%</strong>
                      <span className="market-secondary-note">
                        {marketStats.period.confirmedOrders} vente{marketStats.period.confirmedOrders === 1 ? "" : "s"} confirmée{marketStats.period.confirmedOrders === 1 ? "" : "s"} sur {marketStats.period.orders} {marketStats.company.type === "market" ? "demande" : "devis / commande"}{marketStats.period.orders === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="content-card">
                      <span className="market-secondary-label">Panier moyen confirmé · 30 jours</span>
                      <strong>{formatMarketCurrency(marketStats.period.averageConfirmedOrder)}</strong>
                      <span className="market-secondary-note">
                        {marketStats.period.canceledOrders} {marketStats.company.type === "market" ? "demande" : "devis / commande"}{marketStats.period.canceledOrders === 1 ? "" : "s"} annulée{marketStats.period.canceledOrders === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>

                  <section className="market-panel" aria-labelledby="market-monthly-title">
                    <div className="market-panel-heading">
                      <div>
                        <h2 id="market-monthly-title">Ventes confirmées</h2>
                        <p>{marketStats.company.name} · six derniers mois</p>
                      </div>
                      <span className="market-chart-legend"><i/> Chiffre d’affaires</span>
                    </div>
                    {marketStats.monthly.some((month) => month.orders > 0) ? (
                      <div className="market-chart">
                        {marketStats.monthly.map((month) => {
                          const maxRevenue = Math.max(...marketStats.monthly.map((item) => item.confirmedRevenue), 0);
                          const height = maxRevenue > 0 ? Math.max((month.confirmedRevenue / maxRevenue) * 100, month.confirmedRevenue > 0 ? 6 : 0) : 0;
                          return (
                            <div className="market-chart-column" key={`${month.year}-${month.month}`}>
                              <span className="market-chart-value">{formatMarketCurrency(month.confirmedRevenue)}</span>
                              <div className="market-chart-track" aria-label={`${month.orders} ${marketStats.company.type === "market" ? "demande" : "commande"}${month.orders === 1 ? "" : "s"} en ${month.label} ${month.year}`}>
                                <div className="market-chart-bar" style={{ height: `${height}%` }}/>
                              </div>
                              <span className="market-chart-label">{month.label} {month.year}</span>
                              <span className="market-chart-count">{month.orders} {marketStats.company.type === "market" ? "demande" : "commande"}{month.orders === 1 ? "" : "s"}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="empty"><p className="empty-text">Aucune commande sur les six derniers mois pour {marketStats.company.name}.</p></div>
                    )}
                  </section>

                  <section className="market-panel" aria-labelledby="market-recent-title">
                    <div className="market-panel-heading">
                      <div>
                        <h2 id="market-recent-title">{marketStats.company.type === "market" ? "Demandes récentes" : "Devis et commandes récents"}</h2>
                        <p>Statut actuel récupéré depuis Odoo · {marketStats.company.name}</p>
                      </div>
                    </div>
                    {marketStats.recentOrders.length ? (
                      <div className="market-order-list">
                        {marketStats.recentOrders.map((order) => (
                          <article className="market-order-row" key={order.id}>
                            <div className="market-order-main">
                              <strong>{order.reference}</strong>
                              <span>{order.customer}</span>
                            </div>
                            <span className={`market-order-status market-status-${order.state}`}>
                              {getMarketOrderStatusLabel(order.state)}
                            </span>
                            <time dateTime={order.date}>{new Date(order.date).toLocaleDateString("fr-FR")}</time>
                            <strong className="market-order-total">{formatMarketCurrency(order.amountTotal)}</strong>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="empty"><p className="empty-text">Aucune commande récente pour {marketStats.company.name}.</p></div>
                    )}
                  </section>
                  <p className="market-stats-updated">
                    Actualisé le {new Date(marketStats.generatedAt).toLocaleString("fr-FR")}
                  </p>
                </>
              ) : null}
            </>)}

          </div>
        </div>
      </div>

      {/* Bottom tab bar */}
      <nav className="tab-bar" aria-label="Navigation principale">
        {([
          { id:"users", label:"Utilisateurs", icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, badge: users.length > 0 ? users.length : 0 },
          { id:"articles", label:"Articles", icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, badge: 0 },
          { id:"brochures", label:"Brochures", icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>, badge: 0 },
          { id:"inscriptions", label:"Inscrip.", icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="10.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M23 11h-6"/></svg>, badge: inscriptionsPending },
          { id:"sessions", label:"Sessions", icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, badge: 0 },
          { id:"ecommerce", label:selectedCompany?.type === "groupe" ? "Ventes" : "Market", icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L22 8H6"/><circle cx="10" cy="21" r="1"/><circle cx="18" cy="21" r="1"/></svg>, badge: 0 },
        ] as const)
          .filter((tab) => (adminTabs as readonly string[]).includes(tab.id))
          .map(t => (
          <button
            type="button"
            key={t.id}
            className={`tab-btn${activeTab === t.id ? " active" : ""}`}
            onClick={() => handleSetActiveTab(t.id)}
            aria-current={activeTab === t.id ? "page" : undefined}
          >
            <span className="tab-active-dot" aria-hidden="true"/>
            {t.icon}
            {t.label}
            {t.badge > 0 && <div className="tab-badge">{t.badge > 9 ? "9+" : t.badge}</div>}
          </button>
        ))}
      </nav>

      {/* ── ACTION SHEETS ── */}

      {/* User */}
      {actionSheetUser && (<>
        <div className="sheet-backdrop" onClick={() => setActionSheetUser(null)}/>
        <div className="sheet">
          <div className="sheet-handle"/>
          <div className="sheet-head">
            <div className="sheet-title">{actionSheetUser.firstName} {actionSheetUser.lastName}</div>
            <div className="sheet-sub">{actionSheetUser.email} · {new Date(actionSheetUser.createdAt).toLocaleDateString("fr-FR")}</div>
          </div>
          <div className="sheet-actions">
            <button className="sheet-btn primary" onClick={() => { setModalMode("edit"); setSelectedUser(actionSheetUser); setFormData({ email:actionSheetUser.email, firstName:actionSheetUser.firstName||"", lastName:actionSheetUser.lastName||"", password:"", employeeRole:actionSheetUser.employeeRole || "", profiles:actionSheetUser.profiles }); setActionSheetUser(null); setShowModal(true); }}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Modifier le profil
            </button>
            <button className="sheet-btn orange-btn" onClick={() => handleToggleActive(actionSheetUser.id, actionSheetUser.active)}>
              {actionSheetUser.active
                ? <><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>Désactiver le compte</>
                : <><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><polyline points="20 6 9 17 4 12"/></svg>Activer le compte</>}
            </button>
            <div className="sheet-divider"/>
            <button className="sheet-btn danger" onClick={() => { if (confirm(`Supprimer ${actionSheetUser.firstName ?? ""} ${actionSheetUser.lastName ?? ""} ?`)) handleDeleteUser(actionSheetUser.id); }}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              Supprimer l'utilisateur
            </button>
          </div>
          <button className="sheet-cancel" onClick={() => setActionSheetUser(null)}>Annuler</button>
        </div>
      </>)}

      {/* Article */}
      {actionSheetArticle && (<>
        <div className="sheet-backdrop" onClick={() => setActionSheetArticle(null)}/>
        <div className="sheet">
          <div className="sheet-handle"/>
          <div className="sheet-head">
            <div className="sheet-title">{actionSheetArticle.title}</div>
            <div className="sheet-sub">{actionSheetArticle.category} · {new Date(actionSheetArticle.createdAt).toLocaleDateString("fr-FR")}</div>
          </div>
          <div className="sheet-actions">
            {renderPublishButton(actionSheetArticle.id, actionSheetArticle.published)}
            <div className="sheet-divider"/>
            <button className="sheet-btn danger" onClick={() => { if (confirm("Supprimer cet article ?")) handleDeleteArticle(actionSheetArticle.id); }}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              Supprimer l'article
            </button>
          </div>
          <button className="sheet-cancel" onClick={() => setActionSheetArticle(null)}>Annuler</button>
        </div>
      </>)}

      {/* Brochure */}
      {actionSheetBrochure && (<>
        <div className="sheet-backdrop" onClick={() => setActionSheetBrochure(null)}/>
        <div className="sheet">
          <div className="sheet-handle"/>
          <div className="sheet-head">
            <div className="sheet-title">{actionSheetBrochure.name}</div>
            <div className="sheet-sub">{actionSheetBrochure.type || "PDF"} · {new Date(actionSheetBrochure.createdAt).toLocaleDateString("fr-FR")}</div>
          </div>
          <div className="sheet-actions">
            <a href={`/api/brochures/${actionSheetBrochure.id}/download`} target="_blank" rel="noopener noreferrer" className="sheet-btn primary" style={{ textDecoration:"none" }}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Télécharger
            </a>
            {renderPublishBrochureButton(actionSheetBrochure.id, actionSheetBrochure.published)}
            <div className="sheet-divider"/>
            <button className="sheet-btn danger" onClick={() => { if (confirm("Supprimer cette brochure ?")) handleDeleteBrochure(actionSheetBrochure.id); }}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              Supprimer
            </button>
          </div>
          <button className="sheet-cancel" onClick={() => setActionSheetBrochure(null)}>Annuler</button>
        </div>
      </>)}

      {/* Inscription */}
      {actionSheetInscription && (<>
        <div className="sheet-backdrop" onClick={() => setActionSheetInscription(null)}/>
        <div className="sheet">
          <div className="sheet-handle"/>
          <div className="sheet-head">
            <div className="sheet-title">{actionSheetInscription.firstName} {actionSheetInscription.lastName}</div>
            <div className="sheet-sub">{actionSheetInscription.formation?.name} · {new Date(actionSheetInscription.createdAt).toLocaleDateString("fr-FR")}</div>
          </div>
          <div className="sheet-actions">
            <div className="sheet-info">
              <div style={{ marginBottom:"0.25rem" }}><strong>Email</strong> — {actionSheetInscription.email}</div>
              <div style={{ marginBottom:"0.25rem" }}><strong>Tél.</strong> — {actionSheetInscription.phone}</div>
              <div style={{ marginBottom:"0.25rem" }}><strong>Statut</strong> — <span style={{ textTransform:"capitalize" }}>{actionSheetInscription.status.replace(/_/g, " ")}</span></div>
              <div><strong>Session</strong> — {actionSheetInscription.session?.location} · {actionSheetInscription.session?.startDate ? new Date(actionSheetInscription.session.startDate).toLocaleDateString("fr-FR") : "—"}</div>
            </div>
            <div className="sheet-divider"/>
            {actionSheetInscription.status !== "annule" && renderInscriptionActions(actionSheetInscription)}
            {(actionSheetInscription.status === "annule" || actionSheetInscription.status === "liste_attente" || actionSheetInscription.status === "demande_en_attente") && (<>
              <div className="sheet-divider"/>
              <button className="sheet-btn danger" onClick={() => { if (confirm("Supprimer cette inscription ?")) handleDeleteInscription(actionSheetInscription.id); }}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                Supprimer
              </button>
            </>)}
          </div>
          <button className="sheet-cancel" onClick={() => setActionSheetInscription(null)}>Fermer</button>
        </div>
      </>)}

      {/* Session */}
      {actionSheetSession && (<>
        <div className="sheet-backdrop" onClick={() => setActionSheetSession(null)}/>
        <div className="sheet">
          <div className="sheet-handle"/>
          <div className="sheet-head">
            <div className="sheet-title">{formations.find(f => f.id === actionSheetSession.formationId)?.name || "Session"}</div>
            <div className="sheet-sub">{new Date(actionSheetSession.startDate).toLocaleDateString("fr-FR")} · {actionSheetSession.location}</div>
          </div>
          <div className="sheet-actions">
            <div className="sheet-info">
              <div style={{ marginBottom:"0.25rem" }}><strong>Lieu</strong> — {actionSheetSession.location}</div>
              <div style={{ marginBottom:"0.25rem" }}><strong>Capacité</strong> — {actionSheetSession.capacity} places</div>
              <div><strong>Disponibles</strong> — {actionSheetSession.available} places</div>
            </div>
            <div className="sheet-divider"/>
            <button className="sheet-btn danger" onClick={() => { if (confirm("Supprimer cette session ?")) handleDeleteSession(actionSheetSession.id); }}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              Supprimer la session
            </button>
          </div>
          <button className="sheet-cancel" onClick={() => setActionSheetSession(null)}>Annuler</button>
        </div>
      </>)}

      {/* Add/Edit user modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle"/>
            <h2 className="modal-title">{modalMode === "add" ? "Nouvel Utilisateur" : "Éditer l'Utilisateur"}</h2>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={formData.email} onChange={e => setFormData({...formData,email:e.target.value})} disabled={modalMode === "edit"} placeholder="email@exemple.com"/>
            </div>
            <div className="form-row-grid">
              <div className="form-group">
                <label className="form-label">Prénom</label>
                <input type="text" className="form-input" value={formData.firstName} onChange={e => setFormData({...formData,firstName:e.target.value})} placeholder="Prénom"/>
              </div>
              <div className="form-group">
                <label className="form-label">Nom</label>
                <input type="text" className="form-input" value={formData.lastName} onChange={e => setFormData({...formData,lastName:e.target.value})} placeholder="Nom de famille"/>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="employee-role">Accès employé</label>
              <select
                id="employee-role"
                className="form-select"
                value={formData.employeeRole}
                onChange={e => setFormData({
                  ...formData,
                  employeeRole: e.target.value as typeof formData.employeeRole,
                })}
              >
                <option value="">Aucun accès employé</option>
                <option value="manager">Responsable</option>
                <option value="seller">Vendeur</option>
                <option value="cashier">Caissier</option>
                <option value="stock">Gestionnaire de stock</option>
                <option value="accountant">Comptable</option>
              </select>
            </div>
            <fieldset className="form-group user-profiles-fieldset">
              <legend className="form-label">Profils d’usage</legend>
              {(["MARKET_CUSTOMER", "TRAINING_PARTICIPANT"] as const).map((profile) => (
                <label className="user-profile-choice" key={profile}>
                  <input
                    type="checkbox"
                    checked={formData.profiles.includes(profile)}
                    onChange={() => setFormData((previous) => ({
                      ...previous,
                      profiles: previous.profiles.includes(profile)
                        ? previous.profiles.filter((item) => item !== profile)
                        : [...previous.profiles, profile],
                    }))}
                  />
                  <span>{getUserProfileLabel(profile)}</span>
                </label>
              ))}
              <small>Ces profils décrivent les services utilisés ; ils ne donnent pas de droits d’accès administrateur.</small>
            </fieldset>
            {modalMode === "add" && (
              <div className="form-group">
                <label className="form-label">Mot de passe</label>
                <input type="password" className="form-input" value={formData.password} onChange={e => setFormData({...formData,password:e.target.value})} placeholder="••••••••"/>
              </div>
            )}
            <div className="modal-actions">
              <button className="btn-cancel-fill" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn-primary-fill" onClick={handleSaveUser}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}