"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "user" | "admin";
}

interface SessionFormation {
  id: number;
  formationId: number;
  startDate: string;
  endDate: string;
  location: string;
  capacity: number;
  available: number;
  status: "ouverte" | "complète" | "fermée";
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

interface InscriptionFormation {
  id: number;
  sessionId: number;
  formationId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: "confirme" | "liste_attente" | "annule";
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
}

type TabId = "inscriptions" | "formations" | "market-orders" | "inscriptions-manage" | "users" | "articles";

interface TabType {
  id: TabId;
  label: string;
  icon: string;
  admin?: boolean;
}

const ALL_TABS: TabType[] = [
  { id: "inscriptions",        label: "Mes inscriptions",       icon: "◈" },
  { id: "formations",          label: "Formations",             icon: "◉" },
  { id: "market-orders",       label: "Mes devis Market",       icon: "▱" },
  { id: "inscriptions-manage", label: "Gérer inscriptions",     icon: "◎", admin: true },
  { id: "users",               label: "Utilisateurs",           icon: "◇", admin: true },
  { id: "articles",            label: "Articles",               icon: "◆", admin: true },
];

export default function DashboardPage() {
  const router = useRouter();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  };
  
  // Helper para construir URLs com backend
  const buildApiUrl = (endpoint: string) => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
    return backendUrl ? `${backendUrl}${endpoint}` : endpoint;
  };
  
  const [user, setUser]         = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("inscriptions");
  const [loading, setLoading]   = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Formations & inscriptions
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loadingFormations, setLoadingFormations] = useState(false);
  const [userInscriptions, setUserInscriptions] = useState<InscriptionFormation[]>([]);
  const [loadingInscriptions, setLoadingInscriptions] = useState(false);
  const [marketQuotations, setMarketQuotations] = useState<MarketQuotation[]>([]);
  const [loadingMarketQuotations, setLoadingMarketQuotations] = useState(false);
  const [marketQuotationError, setMarketQuotationError] = useState("");
  const [marketEmailVerified, setMarketEmailVerified] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [showInscriptionModal, setShowInscriptionModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionFormation | null>(null);
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [inscriptionData, setInscriptionData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
  });
  const [submittingInscription, setSubmittingInscription] = useState(false);
  const [inscriptionError, setInscriptionError] = useState('');
  const [inscriptionSuccess, setInscriptionSuccess] = useState('');

  // Articles
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  // Admin inscriptions
  const [adminInscriptions, setAdminInscriptions] = useState<InscriptionFormation[]>([]);
  const [loadingAdminInscriptions, setLoadingAdminInscriptions] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Articles techniques',
    excerpt: '',
    content: '',
    image: '',
    author: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function fetchMarketQuotations() {
    setLoadingMarketQuotations(true);
    setMarketQuotationError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/market/orders", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message =
          payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
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
      if (!orders.every((order) =>
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
        typeof order.date === "string"
      )) {
        throw new Error("Les devis reçus ne sont pas valides.");
      }
      setMarketQuotations(orders as MarketQuotation[]);
      setMarketEmailVerified(payload.emailVerified);
    } catch (fetchError) {
      console.error("[Dashboard] Could not load Market quotations:", fetchError);
      setMarketQuotationError(
        fetchError instanceof Error ? fetchError.message : "Impossible de charger vos devis.",
      );
    } finally {
      setLoadingMarketQuotations(false);
    }
  }

  const resendMarketEmailVerification = async () => {
    setResendingVerification(true);
    setVerificationMessage("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message =
          payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
            ? payload.error
            : "Impossible d’envoyer le lien de vérification.";
        throw new Error(message);
      }
      setVerificationMessage("Un nouveau lien de vérification a été envoyé à votre adresse email.");
    } catch (resendError) {
      console.error("[Dashboard] Could not resend the verification email:", resendError);
      setVerificationMessage(
        resendError instanceof Error ? resendError.message : "Impossible d’envoyer le lien de vérification.",
      );
    } finally {
      setResendingVerification(false);
    }
  };

  useEffect(() => {
    const token    = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    
    if (!token || !userData) { 
      router.push("/login"); 
      return; 
    }
    
    try {
      const user = JSON.parse(userData);
      
      // Rediriger les admins vers le dashboard admin
      if (user && user.role === "admin") {
        router.push("/admin-dashboard");
        setLoading(false);
        return;
      }
      
      setUser(user);
      setLoading(false);
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/login");
    }
  }, [router]);

  // Charger les articles au changement d'onglet
  useEffect(() => {
    if (activeTab === "articles" && user?.role === "admin") {
      fetchArticles();
    } else if (activeTab === "inscriptions-manage" && user?.role === "admin") {
      fetchAdminInscriptions();
    } else if (activeTab === "formations") {
      fetchFormations();
    } else if (activeTab === "inscriptions" && user) {
      fetchUserInscriptions();
    } else if (activeTab === "market-orders" && user) {
      void fetchMarketQuotations();
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (activeTab !== "market-orders" || !user) return;
    const interval = window.setInterval(() => {
      void fetchMarketQuotations();
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [activeTab, user]);

  const fetchAdminInscriptions = async () => {
    setLoadingAdminInscriptions(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(buildApiUrl('/api/inscriptions-manage'), {
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminInscriptions(data.data || []);
      } else {
        setAdminInscriptions([]);
      }
    } catch (err) {
      console.error('Error fetching admin inscriptions:', err);
      setAdminInscriptions([]);
    } finally {
      setLoadingAdminInscriptions(false);
    }
  };

  const handleAdminAction = async (id: number, action: 'accept' | 'reject') => {
    if (!confirm(`Confirmer l'action '${action}' pour l'inscription ${id} ?`)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(buildApiUrl('/api/inscriptions-manage'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify({ id, action })
      });
      if (res.ok) {
        await fetchAdminInscriptions();
        setSuccess(action === 'accept' ? 'Inscription acceptée' : 'Inscription rejetée');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || 'Erreur');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setError('Erreur lors de la mise à jour');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleAdminDelete = async (id: number) => {
    if (!confirm('Confirmer la suppression permanente de cette inscription ?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(buildApiUrl(`/api/inscriptions-manage/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      if (res.ok) {
        setSuccess('Inscription supprimée');
        await fetchAdminInscriptions();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || 'Erreur lors de la suppression');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setError('Erreur lors de la suppression');
      setTimeout(() => setError(''), 3000);
    }
  };

  const fetchFormations = async () => {
    setLoadingFormations(true);
    try {
      const res = await fetch("/api/formations?limit=100");
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
    try {
      const token = localStorage.getItem("token");
      if (!user?.email) {
        setUserInscriptions([]);
        setLoadingInscriptions(false);
        return;
      }

      const res = await fetch("/api/my-inscriptions", {
        headers: { 
          'Authorization': `Bearer ${token || ""}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        // Remove cancelled inscriptions from the user's personal view
        const list: InscriptionFormation[] = (data.data || []).filter((insc: InscriptionFormation) => insc.status !== 'annule');
        setUserInscriptions(list);
      } else {
        console.error('Error fetching inscriptions:', res.status);
        setUserInscriptions([]);
      }
    } catch (err) {
      console.error("Error fetching user inscriptions:", err);
      setUserInscriptions([]);
    } finally {
      setLoadingInscriptions(false);
    }
  };

  const handleInscriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInscriptionError("");
    setInscriptionSuccess("");

    if (!inscriptionData.firstName || !inscriptionData.lastName || !inscriptionData.email || !inscriptionData.phone) {
      setInscriptionError("Tous les champs obligatoires doivent être remplis");
      return;
    }

    if (!selectedSession || !selectedFormation) {
      setInscriptionError("Sélection invalide");
      return;
    }

    setSubmittingInscription(true);
    try {
      const res = await fetch(buildApiUrl("/api/inscriptions-formations"), {
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
        setInscriptionSuccess(`Inscription confirmée! ${data.message}`);
        setInscriptionData({ firstName: '', lastName: '', email: '', phone: '', company: '' });
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
    if (!confirm('Confirmer l\'annulation de cette inscription ?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(buildApiUrl(`/api/inscriptions/${inscriptionId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token || ''}` },
      });

      if (res.ok) {
        setInscriptionSuccess('Inscription annulée');
        await fetchUserInscriptions();
        await fetchFormations();
        setTimeout(() => setInscriptionSuccess(''), 3000);
      } else {
        const data = await res.json().catch(() => null);
        setInscriptionError(data?.error || "Erreur lors de l'annulation");
        setTimeout(() => setInscriptionError(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setInscriptionError("Erreur lors de l'annulation");
      setTimeout(() => setInscriptionError(''), 3000);
    }
  };

  const openInscriptionModal = (formation: Formation, session: SessionFormation) => {
    setSelectedFormation(formation);
    setSelectedSession(session);
    setInscriptionData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: '',
      company: '',
    });
    setInscriptionError("");
    setInscriptionSuccess("");
    setShowInscriptionModal(true);
  };

  const fetchArticles = async () => {
    setLoadingArticles(true);
    try {
      const res = await fetch(buildApiUrl("/api/articles?limit=100"));
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

  const handlePublishArticle = async (articleId: number, currentPublished: boolean) => {
    try {
      const res = await fetch(buildApiUrl(`/api/articles/${articleId}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !currentPublished })
      });

      if (res.ok) {
        setSuccess(!currentPublished ? 'Article publié!' : 'Article dépublié');
        await fetchArticles();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Erreur lors de la publication');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      setError('Erreur lors de la publication');
      console.error(err);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteArticle = async (articleId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet article?')) return;
    
    try {
      const res = await fetch(buildApiUrl(`/api/articles/${articleId}`), {
        method: "DELETE"
      });

      if (res.ok) {
        setSuccess('Article supprimé');
        await fetchArticles();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Erreur lors de la suppression');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      setError('Erreur lors de la suppression');
      console.error(err);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!formData.title || !formData.category || !formData.excerpt || !formData.content) {
      setError('Tous les champs obligatoires doivent être remplis');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(buildApiUrl("/api/articles"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          author: user?.firstName + ' ' + user?.lastName || 'Admin'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess('Article créé avec succès!');
        setFormData({
          title: '',
          category: 'Articles techniques',
          excerpt: '',
          content: '',
          image: '',
          author: '',
        });
        setShowArticleForm(false);
        await fetchArticles(); // Reload articles
      } else {
        setError(data.error || 'Erreur lors de la création');
      }
    } catch (err) {
      setError('Erreur lors de la création de l\'article');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  const handleTab = (id: TabId) => {
    setActiveTab(id);
    setSidebarOpen(false);
  };

  if (loading) return (
    <div className="dash-loading">
      <div className="dash-spinner" />
    </div>
  );
  if (!user) return null;

  const tabs = ALL_TABS.filter(t => !t.admin || user.role === "admin");
  const firstInitial = user.firstName?.[0] ?? "";
  const lastInitial = user.lastName?.[0] ?? "";
  const initials = (firstInitial + lastInitial).toUpperCase() || (user.email?.[0] ?? "U").toUpperCase();

  // Sessions the current user is already registered to (by sessionId)
  const registeredSessionIds = new Set<number>(userInscriptions.filter(i => i.status !== 'annule').map(i => i.sessionId));

  return (
    <>
      <Head>
        <title>Dashboard — FiSAFi Groupe</title>
        <meta name="robots" content="noindex" />
        
        <style>{`
          *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
          :root {
            --ink: #0b1829;
            --blue: #1e40af;
            --blue-deep: #0f2470;
            --orange: #e55a00;
            --orange-light: #f07030;
            --mist: #f5f4f0;
            --white: #ffffff;
            --steel: #7a8ea8;
            --line: rgba(30,64,175,0.10);
            --sidebar-w: 240px;
          }
          body { padding-top:0 !important; font-family:'Outfit',sans-serif; font-weight:300; color:var(--ink); background:var(--mist); -webkit-font-smoothing:antialiased; }

          /* ── LOADING ── */
          .dash-loading { display:flex; align-items:center; justify-content:center; min-height:100svh; background:var(--mist); }
          .dash-spinner { width:32px; height:32px; border:2px solid var(--line); border-top-color:var(--blue); border-radius:50%; animation:spin 0.7s linear infinite; }
          @keyframes spin { to { transform:rotate(360deg); } }

          /* ── LAYOUT ── */
          .dash-layout { display:flex; min-height:100svh; }

          /* ── OVERLAY (mobile) ── */
          .dash-overlay { display:none; position:fixed; inset:0; background:rgba(11,24,41,0.5); z-index:40; }
          .dash-overlay.open { display:block; }

          /* ── SIDEBAR ── */
          .dash-sidebar {
            position:fixed; top:0; left:0; bottom:0; width:var(--sidebar-w);
            background:var(--blue-deep); color:#fff; z-index:50;
            display:flex; flex-direction:column;
            transform:translateX(-100%); transition:transform 0.28s cubic-bezier(.4,0,.2,1);
          }
          .dash-sidebar.open { transform:translateX(0); }
          @media(min-width:900px) {
            .dash-sidebar { transform:translateX(0); position:sticky; top:0; height:100svh; flex-shrink:0; }
            .dash-overlay { display:none !important; }
          }

          .sidebar-head { padding:2rem 1.5rem 1.5rem; border-bottom:0.5px solid rgba(255,255,255,0.08); }
          .sidebar-logo { font-family:'Cormorant Garamond',serif; font-size:20px; font-weight:300; letter-spacing:0.2em; text-transform:uppercase; color:#fff; }
          .sidebar-logo span { color:var(--orange); }
          .sidebar-role { font-size:9px; letter-spacing:0.25em; text-transform:uppercase; color:rgba(255,255,255,0.35); margin-top:4px; }

          .sidebar-user { padding:1.25rem 1.5rem; border-bottom:0.5px solid rgba(255,255,255,0.08); display:flex; align-items:center; gap:0.75rem; }
          .sidebar-avatar { width:36px; height:36px; border-radius:50%; background:var(--orange); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:500; color:#fff; flex-shrink:0; }
          .sidebar-uname { font-size:13px; color:#fff; font-weight:400; line-height:1.3; }
          .sidebar-uemail { font-size:10px; color:rgba(255,255,255,0.4); margin-top:1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:140px; }

          .sidebar-nav { flex:1; padding:1rem 0.75rem; display:flex; flex-direction:column; gap:2px; overflow-y:auto; }
          .sidebar-tab {
            display:flex; align-items:center; gap:0.75rem;
            padding:0.75rem 0.875rem;
            border-radius:3px; border:none; background:transparent;
            color:rgba(255,255,255,0.55); cursor:pointer;
            font-family:'Outfit',sans-serif; font-size:12px; font-weight:300;
            letter-spacing:0.08em; text-transform:uppercase; text-align:left;
            transition:background 0.15s, color 0.15s;
          }
          .sidebar-tab:hover { background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.85); }
          .sidebar-tab.active { background:rgba(255,255,255,0.12); color:#fff; }
          .sidebar-tab-icon { font-size:14px; flex-shrink:0; }
          .sidebar-tab-admin { margin-top:0.5rem; padding-top:0.5rem; border-top:0.5px solid rgba(255,255,255,0.08); }

          .sidebar-foot { padding:1rem 0.75rem; border-top:0.5px solid rgba(255,255,255,0.08); }
          .sidebar-logout {
            width:100%; padding:0.75rem 1rem; display:flex; align-items:center; gap:0.6rem;
            background:rgba(229,90,0,0.15); border:0.5px solid rgba(229,90,0,0.3);
            color:rgba(255,255,255,0.7); cursor:pointer; border-radius:3px;
            font-family:'Outfit',sans-serif; font-size:11px; letter-spacing:0.12em;
            text-transform:uppercase; font-weight:300; transition:background 0.15s, color 0.15s;
          }
          .sidebar-logout:hover { background:rgba(229,90,0,0.3); color:#fff; }

          /* ══ TOPBAR (mobile) ══ FIX v3.2: @supports guard for backdrop-filter */
          .dash-topbar {
            position:sticky; top:0; z-index:30;
            display:flex; align-items:center; justify-content:space-between;
            padding:0 1rem; height:56px;
            background:rgba(245,244,240,0.95);
            border-bottom:0.5px solid var(--line);
          }
          @supports(backdrop-filter:blur(1px)){@media(min-width:900px){.dash-topbar{backdrop-filter:blur(12px);}}}
          @media(min-width:900px) { .dash-topbar { display:none; } }
          .topbar-logo { font-family:'Cormorant Garamond',serif; font-size:18px; font-weight:300; letter-spacing:0.15em; text-transform:uppercase; color:var(--blue); }
          .topbar-logo span { color:var(--orange); }
          .topbar-hamburger { background:none; border:none; cursor:pointer; display:flex; flex-direction:column; gap:5px; padding:4px; }
          .topbar-hamburger span { display:block; width:20px; height:1px; background:var(--ink); transition:transform 0.2s, opacity 0.2s; }
          .topbar-hamburger.open span:nth-child(1) { transform:translateY(6px) rotate(45deg); }
          .topbar-hamburger.open span:nth-child(2) { opacity:0; }
          .topbar-hamburger.open span:nth-child(3) { transform:translateY(-6px) rotate(-45deg); }
          
          /* ── Mobile logo ── */
          .dash-mobile-logo { display:none; }
          .dash-mobile-logo img { display:block; width:100%; height:100%; object-fit:cover; }
          @media(max-width:768px) {
            .dash-mobile-logo { display:flex; justify-content:center; width:48px; height:48px; border-radius:50%; overflow:hidden; border:1px solid var(--orange); background:#fff; margin-right:0.75rem; flex-shrink:0; }
            .dash-mobile-logo img { width:100%; height:100%; object-fit:cover; }
          }

          /* ── MAIN ── */
          .dash-main { flex:1; min-width:0; display:flex; flex-direction:column; }
          @media(min-width:900px) { .dash-main { margin-left:0; } }

          .dash-content { padding:0 1rem 3rem; max-width:900px; }
          @media(min-width:600px) { .dash-content { padding:2rem 2rem 3rem; } }
          @media(min-width:900px) { .dash-content { padding:2.5rem 3rem 4rem; } }
          .dashboard-home-link {
            display:flex; width:fit-content; align-items:center; gap:0.5rem;
            margin:0 0 1.5rem auto; padding:0.65rem 1rem;
            border:1px solid var(--line); background:#fff; color:var(--blue);
            font-family:'Outfit',sans-serif; font-size:12px; text-decoration:none;
            transition:background 0.15s, color 0.15s, border-color 0.15s;
          }
          .dashboard-home-link:hover { background:var(--blue); border-color:var(--blue); color:#fff; }

          /* ── PAGE HEADER ── */
          .page-eyebrow { font-size:9px; letter-spacing:0.3em; text-transform:uppercase; color:var(--orange); margin-bottom:0.5rem; display:flex; align-items:center; gap:0.5rem; }
          .page-eyebrow::before { content:''; width:1.25rem; height:0.5px; background:var(--orange); }
          .page-title { font-family:'Cormorant Garamond',serif; font-size:clamp(1.75rem,5vw,2.5rem); font-weight:300; color:var(--ink); line-height:1.1; margin-bottom:0.5rem; }
          .page-sub { font-size:12px; color:var(--steel); margin-bottom:2rem; }

          /* ── EMPTY STATE ── */
          .empty-box { background:var(--white); border:0.5px solid var(--line); padding:3rem 2rem; text-align:center; }
          .empty-icon { font-size:2rem; margin-bottom:0.75rem; opacity:0.3; }
          .empty-text { font-size:13px; color:var(--steel); }

          /* ── CARDS ── */
          .card-grid { display:grid; grid-template-columns:1fr; gap:1rem; }
          @media(min-width:480px) { .card-grid { grid-template-columns:repeat(2,1fr); } }
          @media(min-width:800px) { .card-grid { grid-template-columns:repeat(2,1fr); } }

          .formation-card { background:var(--white); border:0.5px solid var(--line); padding:1.5rem; transition:border-color 0.2s, box-shadow 0.2s; cursor:default; }
          .formation-card:hover { border-color:var(--blue); box-shadow:0 4px 20px rgba(30,64,175,0.08); }
          .formation-num { font-size:10px; letter-spacing:0.2em; color:var(--orange); margin-bottom:0.5rem; }
          .formation-name { font-family:'Cormorant Garamond',serif; font-size:1.2rem; font-weight:300; color:var(--ink); margin-bottom:0.4rem; }
          .formation-desc { font-size:12px; color:var(--steel); line-height:1.6; margin-bottom:1.25rem; }
          .formation-btn {
            font-size:10px; letter-spacing:0.15em; text-transform:uppercase;
            background:var(--blue); color:#fff; border:none; cursor:pointer;
            padding:0.65rem 1.25rem; font-family:'Outfit',sans-serif; font-weight:400;
            transition:background 0.2s;
          }
          .formation-btn:hover { background:var(--blue-deep); }

          /* ── TABLE ── */
          .table-wrap { background:var(--white); border:0.5px solid var(--line); overflow-x:auto; }
          table { width:100%; border-collapse:collapse; min-width:480px; }
          thead tr { border-bottom:0.5px solid var(--line); background:rgba(30,64,175,0.03); }
          th { padding:0.85rem 1rem; text-align:left; font-size:9px; letter-spacing:0.2em; text-transform:uppercase; color:var(--steel); font-weight:400; }
          td { padding:0.85rem 1rem; font-size:13px; color:var(--ink); border-bottom:0.5px solid var(--line); }
          tr:last-child td { border-bottom:none; }
          .badge { display:inline-block; padding:0.2rem 0.6rem; font-size:9px; letter-spacing:0.1em; text-transform:uppercase; }
          .badge-admin { background:rgba(30,64,175,0.1); color:var(--blue); }
          .badge-user { background:rgba(122,142,168,0.15); color:var(--steel); }

          /* ── ARTICLES HEADER ── */
          .section-bar { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem; margin-bottom:1.5rem; }
          .btn-new {
            font-size:10px; letter-spacing:0.15em; text-transform:uppercase;
            background:var(--orange); color:#fff; border:none; cursor:pointer;
            padding:0.65rem 1.25rem; font-family:'Outfit',sans-serif; font-weight:400;
            transition:background 0.2s;
          }
          .btn-new:hover { background:var(--orange-light); }

          /* ── ARTICLE FORM ── */
          .article-form { background:var(--white); border:0.5px solid var(--line); padding:2rem; margin-bottom:2rem; }
          .form-group { margin-bottom:1.5rem; }
          .form-label { display:block; font-size:12px; letter-spacing:0.1em; text-transform:uppercase; color:var(--ink); margin-bottom:0.5rem; font-weight:500; }
          .form-input, .form-textarea, .form-select {
            width:100%; padding:0.75rem 1rem; border:0.5px solid var(--line); background:var(--white);
            font-family:'Outfit',sans-serif; font-size:13px; color:var(--ink);
            transition:border-color 0.2s, box-shadow 0.2s;
          }
          .form-input:focus, .form-textarea:focus, .form-select:focus {
            outline:none; border-color:var(--blue); box-shadow:0 0 0 3px rgba(30,64,175,0.1);
          }
          .form-textarea { resize:vertical; min-height:120px; }
          .form-row { display:grid; grid-template-columns:1fr; gap:1rem; }
          @media(min-width:600px) { .form-row { grid-template-columns:1fr 1fr; } }
          .form-buttons { display:flex; gap:1rem; margin-top:2rem; }
          .btn-submit {
            flex:1; padding:0.75rem 1.5rem; background:var(--blue); color:#fff; border:none;
            cursor:pointer; font-family:'Outfit',sans-serif; font-size:12px; letter-spacing:0.1em;
            text-transform:uppercase; font-weight:500; transition:background 0.2s;
          }
          .btn-submit:hover:not(:disabled) { background:var(--blue-deep); }
          .btn-submit:disabled { opacity:0.6; cursor:not-allowed; }
          .btn-cancel {
            flex:1; padding:0.75rem 1.5rem; background:var(--line); color:var(--ink); border:none;
            cursor:pointer; font-family:'Outfit',sans-serif; font-size:12px; letter-spacing:0.1em;
            text-transform:uppercase; font-weight:500; transition:background 0.2s;
          }
          .btn-cancel:hover { background:rgba(30,64,175,0.2); }

          /* ── ALERTS ── */
          .alert { padding:1rem; margin-bottom:1rem; border-radius:3px; font-size:13px; display:flex; align-items:flex-start; gap:0.75rem; }
          .alert-error { background:rgba(220,38,38,0.1); color:#991b1b; border:0.5px solid rgba(220,38,38,0.3); }
          .alert-success { background:rgba(34,197,94,0.1); color:#166534; border:0.5px solid rgba(34,197,94,0.3); }
          .alert-icon { font-size:14px; flex-shrink:0; }

          /* ── ARTICLE LIST ── */
          .article-item { background:var(--white); border:0.5px solid var(--line); padding:1.5rem; margin-bottom:1rem; display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; transition:border-color 0.2s; }
          .article-item:hover { border-color:var(--blue); }
          .article-info { flex:1; }
          .article-title { font-family:'Cormorant Garamond',serif; font-size:1.1rem; color:var(--ink); margin-bottom:0.25rem; }
          .article-meta { font-size:11px; color:var(--steel); margin-bottom:0.5rem; display:flex; gap:1rem; flex-wrap:wrap; }
          .article-badge { display:inline-block; padding:0.2rem 0.6rem; font-size:9px; letter-spacing:0.1em; text-transform:uppercase; background:rgba(30,64,175,0.1); color:var(--blue); }
          .article-excerpt { font-size:12px; color:var(--steel); line-height:1.5; }
          .article-actions { display:flex; gap:0.75rem; flex-wrap:wrap; }
          .btn-small {
            padding:0.5rem 1rem; font-size:10px; border:0.5px solid var(--line); background:transparent; cursor:pointer;
            font-family:'Outfit',sans-serif; letter-spacing:0.1em; text-transform:uppercase; transition:background 0.2s;
          }
          .btn-small:hover { background:var(--line); }
          .market-verification-notice {
            display:flex; align-items:center; justify-content:space-between; gap:1.25rem;
            margin:1.25rem 0; padding:1rem 1.15rem;
            border:1px solid rgba(180,83,9,0.2); border-radius:14px;
            background:linear-gradient(110deg,#fff8eb,#fffdf8); color:#713f12;
            box-shadow:0 6px 18px rgba(120,72,12,0.055);
          }
          .market-verification-copy { display:flex; align-items:flex-start; gap:0.8rem; min-width:0; }
          .market-verification-icon {
            display:grid; place-items:center; width:2.35rem; height:2.35rem; flex:0 0 auto;
            border-radius:11px; background:rgba(217,119,6,0.12); color:#a45108;
          }
          .market-verification-title { margin-bottom:0.18rem; font-size:13px; font-weight:600; color:#713f12; }
          .market-verification-text { font-size:12px; line-height:1.55; color:#805b35; }
          .market-action-button {
            display:inline-flex; align-items:center; justify-content:center; gap:0.55rem;
            min-height:44px; padding:0.7rem 1rem; border:1px solid transparent; border-radius:10px;
            background:#1e40af; color:#fff; cursor:pointer; white-space:nowrap;
            font-family:'Outfit',sans-serif; font-size:12px; font-weight:500; letter-spacing:0.015em;
            box-shadow:0 5px 13px rgba(30,64,175,0.18);
            transition:background 0.18s, transform 0.18s, box-shadow 0.18s, opacity 0.18s;
          }
          .market-action-button:hover:not(:disabled) { background:#17358f; transform:translateY(-1px); box-shadow:0 8px 18px rgba(30,64,175,0.24); }
          .market-action-button:focus-visible { outline:3px solid rgba(240,120,62,0.58); outline-offset:3px; }
          .market-action-button:disabled { opacity:0.62; cursor:wait; }
          .market-refresh-row { display:flex; justify-content:flex-end; margin:1.1rem 0; }
          .market-refresh-button { min-width:154px; }
          .market-action-icon { width:16px; height:16px; flex:none; }
          .market-action-icon.spinning { animation:market-refresh-spin 0.85s linear infinite; }
          @keyframes market-refresh-spin { to { transform:rotate(360deg); } }
          .btn-publish {
            padding:0.5rem 1rem; font-size:10px; border:none; background:var(--orange); color:#fff;
            cursor:pointer; font-family:'Outfit',sans-serif; letter-spacing:0.1em; text-transform:uppercase; transition:background 0.2s;
          }
          .btn-publish:hover { background:var(--orange-light); }
          .btn-delete {
            padding:0.5rem 1rem; font-size:10px; border:0.5px solid #991b1b; background:transparent; color:#991b1b;
            cursor:pointer; font-family:'Outfit',sans-serif; letter-spacing:0.1em; text-transform:uppercase; transition:background 0.2s;
          }
          .btn-delete:hover { background:rgba(220,38,38,0.1); }

          .dash-layout { font-family:'Outfit',sans-serif; }
          .sidebar-role { font-size:11px; }
          .sidebar-uname { font-size:15px; }
          .sidebar-uemail { font-size:12px; }
          .sidebar-tab { font-size:14px; }
          .sidebar-logout { font-size:13px; }
          .topbar-logo { font-size:20px; }
          .page-eyebrow { font-size:11px; }
          .page-sub { font-size:16px; }
          .empty-text { font-size:15px; }
          .formation-num { font-size:12px; }
          .formation-name { font-size:1.45rem; }
          .formation-desc { font-size:15px; }
          .formation-btn, .btn-new, .btn-submit, .btn-cancel { font-size:14px; }
          th { font-size:11px; }
          td { font-size:15px; }
          .badge, .article-badge { font-size:11px; }
          .form-label { font-size:14px; }
          .form-input, .form-textarea, .form-select { font-size:15px; }
          .alert { font-size:15px; }
          .article-title { font-size:1.3rem; }
          .article-meta { font-size:13px; }
          .article-excerpt { font-size:15px; }
          .btn-small, .btn-publish, .btn-delete { font-size:12px; }
          .sheet-sub { font-size:14px; }
          .sheet-btn { font-size:15px; }
          .sheet-cancel { font-size:12px; }

          /* ── DASHBOARD VISUAL REFRESH ── */
          body { padding-top:0 !important; font-family:'Outfit',sans-serif; }
          .dash-layout { background:linear-gradient(135deg,#f8f9fc 0%,#f3f5f9 55%,#f7f5f1 100%); }
          .dash-sidebar {
            background:
              radial-gradient(ellipse at 10% 0%,rgba(44,91,184,0.34),transparent 42%),
              linear-gradient(180deg,#101f3e 0%,#0b1730 100%);
            box-shadow:8px 0 30px rgba(11,24,41,0.12);
          }
          .sidebar-head { padding-top:2.25rem; }
          .sidebar-logo { letter-spacing:0.12em; }
          .sidebar-user { margin:0.75rem 0.5rem 0; padding:1rem; border:1px solid rgba(255,255,255,0.09); border-radius:14px; background:rgba(255,255,255,0.045); }
          .sidebar-avatar { width:42px; height:42px; background:linear-gradient(145deg,#f07a3e,#d94e08); box-shadow:0 5px 14px rgba(229,90,0,0.24); }
          .sidebar-nav { padding:1.25rem 0.8rem; gap:0.35rem; }
          .sidebar-tab { border-radius:10px; padding:0.82rem 0.95rem; letter-spacing:0.035em; }
          .sidebar-tab:hover { background:rgba(255,255,255,0.09); }
          .sidebar-tab.active { background:linear-gradient(100deg,rgba(255,255,255,0.16),rgba(255,255,255,0.075)); box-shadow:inset 3px 0 #f0783e; }
          .sidebar-tab-icon { width:1.25rem; text-align:center; opacity:0.85; }
          .sidebar-foot { padding:1rem; }
          .sidebar-logout { justify-content:center; border-radius:10px; }
          .dash-topbar { display:flex; height:64px; background:rgba(255,255,255,0.9); border-bottom:1px solid rgba(16,38,75,0.08); }
          .dash-content { width:100%; max-width:1180px; margin:0 auto; padding:1rem 1rem 3.5rem; }
          @media(min-width:600px) { .dash-content { padding:1.4rem 2rem 3.5rem; } }
          @media(min-width:900px) { .dash-content { padding:1.5rem 3rem 4rem; } }
          .topbar-back-link {
            display:inline-flex; align-items:center; justify-content:center; gap:0.45rem;
            min-height:40px; margin-left:auto; padding:0.55rem 0.9rem;
            border:1px solid rgba(30,64,175,0.14); border-radius:999px;
            background:rgba(255,255,255,0.84); color:var(--blue);
            box-shadow:0 4px 14px rgba(15,36,112,0.045);
            font-size:13px; font-weight:500; text-decoration:none;
            transition:background 0.15s, color 0.15s, border-color 0.15s, transform 0.15s;
          }
          .topbar-back-link:hover { background:var(--blue); border-color:var(--blue); color:#fff; box-shadow:0 8px 20px rgba(30,64,175,0.18); transform:translateY(-1px); }
          .topbar-back-link:focus-visible, .sidebar-tab:focus-visible, .sidebar-logout:focus-visible, .topbar-hamburger:focus-visible {
            outline:3px solid rgba(240,120,62,0.55); outline-offset:3px;
          }
          @media(min-width:900px) { .topbar-hamburger { display:none; } }
          .page-eyebrow { letter-spacing:0.2em; font-weight:500; }
          .page-title { font-size:clamp(2rem,4vw,3rem); font-weight:400; letter-spacing:-0.025em; }
          .page-sub { max-width:64ch; line-height:1.7; color:#64748b; }
          .empty-box, .formation-card, .table-wrap, .article-form, .article-item {
            border:1px solid rgba(30,64,175,0.09); border-radius:16px;
            box-shadow:0 8px 24px rgba(18,38,75,0.045);
          }
          .empty-box { padding:clamp(2rem,5vw,3.5rem); }
          .empty-icon { color:var(--blue); opacity:0.58; }
          .formation-card { padding:1.6rem; transition:transform 0.2s,box-shadow 0.2s,border-color 0.2s; }
          .formation-card:hover { transform:translateY(-3px); box-shadow:0 14px 30px rgba(30,64,175,0.1); }
          .article-item { padding:1.35rem 1.5rem; transition:transform 0.18s,box-shadow 0.18s,border-color 0.18s; }
          .article-item:hover { transform:translateY(-2px); box-shadow:0 12px 26px rgba(18,38,75,0.08); }
          .table-wrap { overflow:hidden; }
          .article-form { padding:clamp(1.25rem,3vw,2rem); }
          .form-input, .form-textarea, .form-select { border-radius:9px; }
          .formation-btn, .btn-new, .btn-submit, .btn-cancel, .btn-small, .btn-publish, .btn-delete, .sheet-btn, .sheet-cancel {
            border-radius:8px; letter-spacing:0.06em;
          }
          .alert { border-radius:12px; }
          @media(max-width:599px) {
            .dash-content { padding-top:1rem; }
            .article-item { flex-direction:column; }
            .article-actions { width:100%; }
            .market-verification-notice { align-items:stretch; flex-direction:column; gap:1rem; padding:1rem; }
            .market-verification-notice .market-action-button { width:100%; }
            .market-refresh-row { justify-content:stretch; }
            .market-refresh-button { width:100%; }
          }
          @media(max-width:380px) {
            .dash-mobile-logo { display:none; }
            .topbar-back-link { min-height:36px; padding:0.45rem 0.7rem; font-size:12px; }
          }
        `}</style>
      </Head>

      {/* Overlay mobile */}
      <div className={`dash-overlay${sidebarOpen ? " open" : ""}`} onClick={() => setSidebarOpen(false)} />

      <div className="dash-layout">

        {/* ── SIDEBAR ── */}
        <aside className={`dash-sidebar${sidebarOpen ? " open" : ""}`}>
          <div className="sidebar-head">
            <div className="sidebar-logo">Fi<span>SAFI</span> Groupe</div>
            <div className="sidebar-role">{user.role === "admin" ? "Administrateur" : "Utilisateur"}</div>
          </div>

          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div style={{ minWidth:0 }}>
              <div className="sidebar-uname">{user.firstName} {user.lastName}</div>
              <div className="sidebar-uemail">{user.email}</div>
            </div>
          </div>

          <nav className="sidebar-nav">
            {tabs.filter(t => !t.admin).map(tab => (
              <button
                key={tab.id}
                className={`sidebar-tab${activeTab === tab.id ? " active" : ""}`}
                onClick={() => handleTab(tab.id)}
              >
                <span className="sidebar-tab-icon">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
            {user.role === "admin" && (
              <div className="sidebar-tab-admin">
                {tabs.filter(t => t.admin).map(tab => (
                  <button
                    key={tab.id}
                    className={`sidebar-tab${activeTab === tab.id ? " active" : ""}`}
                    onClick={() => handleTab(tab.id)}
                  >
                    <span className="sidebar-tab-icon">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </nav>

          <div className="sidebar-foot">
            <button className="sidebar-logout" onClick={handleLogout}>
              ⊗ &nbsp;Déconnexion
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className="dash-main">

          {/* Dashboard header */}
          <div className="dash-topbar">
            {/* Mobile circular logo */}
            <div className="dash-mobile-logo" aria-hidden="true">
              <Image src="/favicon/web-app-manifest-192x192.png" alt="FiSAFi Groupe" width={72} height={72} priority />
            </div>
            <div className="topbar-logo">Fi<span>SAFI</span></div>
            <button type="button" className="topbar-back-link" onClick={handleGoBack}>
              <span aria-hidden="true">←</span>
              <span>Retour</span>
            </button>
            <button
              className={`topbar-hamburger${sidebarOpen ? " open" : ""}`}
              aria-label="Menu"
              onClick={() => setSidebarOpen(v => !v)}
            >
              <span /><span /><span />
            </button>
          </div>

          {/* Content */}
          <div className="dash-content">
            {/* ── Mes inscriptions ── */}
            {activeTab === "inscriptions" && (
              <>
                <div className="page-eyebrow">Espace personnel</div>
                <h1 className="page-title">Mes inscriptions</h1>
                <p className="page-sub">Retrouvez toutes vos inscriptions aux formations FISAFI</p>
                {inscriptionError && (
                  <div className="alert alert-error" style={{ marginTop: '1rem' }}>
                    <span className="alert-icon">⚠</span>
                    <span>{inscriptionError}</span>
                  </div>
                )}
                {inscriptionSuccess && (
                  <div className="alert alert-success" style={{ marginTop: '1rem' }}>
                    <span className="alert-icon">✓</span>
                    <span>{inscriptionSuccess}</span>
                  </div>
                )}
                
                {loadingInscriptions ? (
                  <div className="empty-box">
                    <div className="empty-icon">⟳</div>
                    <div className="empty-text">Chargement de vos inscriptions...</div>
                  </div>
                ) : userInscriptions.length === 0 ? (
                  <div className="empty-box">
                    <div className="empty-icon">◈</div>
                    <div className="empty-text">Aucune inscription pour le moment</div>
                  </div>
                ) : (
                  <div>
                    {userInscriptions.map(inscription => (
                      <div key={inscription.id} className="article-item">
                        <div className="article-info">
                          <div className="article-title">{inscription.formation?.name || 'Formation'}</div>
                          <div className="article-meta">
                            <span className="article-badge">{inscription.status}</span>
                            <span>📍 {inscription.session?.location || 'Lieu non spécifié'}</span>
                            <span>📅 {new Date(inscription.session?.startDate || inscription.createdAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <div className="article-excerpt">
                            Inscrit le {new Date(inscription.createdAt).toLocaleDateString('fr-FR')} • {inscription.email}
                          </div>
                        </div>
                        <div className="article-actions">
                          {inscription.status !== 'annule' && (
                            <button
                              className="btn-small"
                              onClick={() => handleCancelInscription(inscription.id)}
                              style={{ background: 'transparent', border: '0.5px solid rgba(220,38,38,0.12)', color: '#991b1b' }}
                            >
                              Annuler
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === "market-orders" && (
              <>
                <div className="page-eyebrow">FiSAFi Market</div>
                <h1 className="page-title">Mes devis Market</h1>
                <p className="page-sub">
                  Consultez le statut de vos demandes. Le devis devient une commande confirmée
                  seulement après validation du vendeur dans Odoo.
                </p>

                {!marketEmailVerified && (
                  <div className="market-verification-notice">
                    <div className="market-verification-copy">
                      <span className="market-verification-icon" aria-hidden="true">
                        <svg className="market-action-icon" viewBox="0 0 24 24" fill="none">
                          <path d="M3.75 6.75h16.5v10.5H3.75z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                          <path d="m4.5 7.5 7.5 6 7.5-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <div>
                        <div className="market-verification-title">Confirmez votre adresse email</div>
                        <div className="market-verification-text">
                          Vérifiez votre adresse pour recevoir les changements de statut de vos devis.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="market-action-button"
                      disabled={resendingVerification}
                      onClick={resendMarketEmailVerification}
                    >
                      <svg className="market-action-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M4 12a8 8 0 0 1 13.66-5.66L20 8.7M20 4.5v4.2h-4.2M20 12a8 8 0 0 1-13.66 5.66L4 15.3m0 4.2v-4.2h4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {resendingVerification ? "Envoi en cours…" : "Renvoyer le lien"}
                    </button>
                  </div>
                )}
                {verificationMessage && (
                  <p className="page-sub" role="status" aria-live="polite" style={{ marginTop: "0.75rem" }}>
                    {verificationMessage}
                  </p>
                )}

                {marketQuotationError && (
                  <div className="alert alert-error" role="alert" style={{ marginTop: "1rem" }}>
                    {marketQuotationError}
                  </div>
                )}
                <div className="market-refresh-row">
                  <button
                    className="market-action-button market-refresh-button"
                    type="button"
                    onClick={() => void fetchMarketQuotations()}
                    disabled={loadingMarketQuotations}
                    aria-label={loadingMarketQuotations ? "Actualisation des devis en cours" : "Actualiser les devis"}
                  >
                    <svg
                      className={`market-action-icon${loadingMarketQuotations ? " spinning" : ""}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path d="M20 7v5h-5M4 17v-5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M5.6 9a7 7 0 0 1 11.7-2L20 9M4 15l2.7 2a7 7 0 0 0 11.7-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {loadingMarketQuotations ? "Actualisation…" : "Actualiser les devis"}
                  </button>
                </div>
                {loadingMarketQuotations ? (
                  <div className="empty-box">
                    <div className="empty-icon">⟳</div>
                    <div className="empty-text">Actualisation de vos devis…</div>
                  </div>
                ) : marketQuotations.length === 0 ? (
                  <div className="empty-box">
                    <div className="empty-icon">▱</div>
                    <div className="empty-text">Vous n’avez pas encore de demande Market.</div>
                    <Link href="/market#rayons" className="btn-small" style={{ marginTop: "1rem" }}>
                      Découvrir FiSAFi Market
                    </Link>
                  </div>
                ) : (
                  <div>
                    {marketQuotations.map((quotation) => (
                      <div key={quotation.id} className="article-item">
                        <div className="article-info">
                          <div className="article-title">Devis {quotation.reference}</div>
                          <div className="article-meta">
                            <span className="article-badge">{quotation.statusLabel}</span>
                            <span>
                              {new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(
                                quotation.amountTotal,
                              )} FCFA
                            </span>
                            <span>{new Date(quotation.date).toLocaleDateString("fr-FR")}</span>
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
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── Formations ── */}
            {activeTab === "formations" && (
              <>
                <div className="page-eyebrow">Catalogue</div>
                <h1 className="page-title">Formations disponibles</h1>
                <p className="page-sub">Choisissez votre parcours de formation</p>
                
                {loadingFormations ? (
                  <div className="empty-box">
                    <div className="empty-icon">⟳</div>
                    <div className="empty-text">Chargement des formations...</div>
                  </div>
                ) : formations.length === 0 ? (
                  <div className="empty-box">
                    <div className="empty-icon">◉</div>
                    <div className="empty-text">Aucune formation disponible</div>
                  </div>
                ) : (
                  <div className="card-grid">
                    {formations.map((formation, idx) => (
                      <div key={formation.id} className="formation-card">
                        <div className="formation-num">{String(idx + 1).padStart(2, '0')}</div>
                        <div className="formation-name">{formation.name}</div>
                        <div className="formation-desc">{formation.description}</div>
                        
                        {/* Sessions disponibles */}
                        {formation.sessions && formation.sessions.length > 0 ? (
                          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '0.5px solid var(--line)', fontSize: '12px', color: 'var(--steel)' }}>
                            <div style={{ marginBottom: '0.75rem', fontWeight: 500, color: 'var(--ink)' }}>Sessions:</div>
                            {formation.sessions.map(session => (
                              <div key={session.id} style={{ marginBottom: '0.75rem', padding: '0.75rem', background: 'rgba(30,64,175,0.02)', borderRadius: '3px' }}>
                                <div>{new Date(session.startDate).toLocaleDateString('fr-FR')}</div>
                                <div style={{ fontSize: '11px', marginTop: '2px' }}>{session.location}</div>
                                <div style={{ fontSize: '11px', marginTop: '2px', color: session.available > 0 ? 'var(--steel)' : '#991b1b' }}>
                                  {session.available > 0 ? `${session.available}/${session.capacity} places` : 'Complète'}
                                </div>
                                <button 
                                  className="formation-btn" 
                                  onClick={() => openInscriptionModal(formation, session)}
                                  disabled={session.available === 0 || registeredSessionIds.has(session.id)}
                                  style={{ marginTop: '0.5rem', width: '100%', opacity: session.available === 0 || registeredSessionIds.has(session.id) ? 0.5 : 1, cursor: session.available === 0 || registeredSessionIds.has(session.id) ? 'not-allowed' : 'pointer' }}
                                >
                                  {registeredSessionIds.has(session.id) ? 'Déjà inscrit' : (session.available === 0 ? 'Complète' : "S'inscrire")}
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '0.5px solid var(--line)', fontSize: '12px', color: 'var(--steel)' }}>
                            Aucune session disponible
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── Gérer inscriptions (Admin) ── */}
            {activeTab === "inscriptions-manage" && (
              <>
                <div className="page-eyebrow">Administration</div>
                <h1 className="page-title">Gérer les inscriptions</h1>
                <p className="page-sub">Vue d'ensemble de toutes les inscriptions</p>
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
                          <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--steel)' }}>Chargement...</td>
                        </tr>
                      ) : adminInscriptions.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--steel)' }}>Aucune inscription</td>
                        </tr>
                      ) : (
                        adminInscriptions.map(insc => (
                          <tr key={insc.id}>
                            <td>{insc.firstName} {insc.lastName}</td>
                            <td>{insc.email}</td>
                            <td>{insc.formation?.name || '-'}</td>
                            <td><span className={`badge ${insc.status === 'confirme' ? 'badge-admin' : 'badge-user'}`}>{insc.status}</span></td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {(['liste_attente', 'demande_en_attente'] as string[]).includes(insc.status) && (
                                  <button className="btn-small" onClick={() => handleAdminAction(insc.id, 'accept')}>Accepter</button>
                                )}
                                {(['confirme','liste_attente','demande_en_attente'] as string[]).includes(insc.status) && (
                                  <button className="btn-small" onClick={() => handleAdminAction(insc.id, 'reject')}>Rejeter</button>
                                )}
                                {( ['annule','liste_attente','demande_en_attente'].includes(insc.status) ) && (
                                  <button className="btn-delete" onClick={() => handleAdminDelete(insc.id)}>Supprimer</button>
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

            {/* ── Utilisateurs (Admin) ── */}
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
                        <td>{user.firstName} {user.lastName}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`badge ${user.role === "admin" ? "badge-admin" : "badge-user"}`}>
                            {user.role}
                          </span>
                        </td>
                        <td style={{ color:"var(--steel)" }}>—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── Articles (Admin) ── */}
            {activeTab === "articles" && (
              <>
                <div className="section-bar">
                  <div>
                    <div className="page-eyebrow">Administration</div>
                    <h1 className="page-title">Articles & Actualités</h1>
                  </div>
                  {!showArticleForm && (
                    <button className="btn-new" onClick={() => { setShowArticleForm(true); setError(''); setSuccess(''); }}>
                      + Nouvel article
                    </button>
                  )}
                </div>

                {/* Formulaire de création */}
                {showArticleForm && (
                  <form className="article-form" onSubmit={handleSubmitArticle}>
                    {error && (
                      <div className="alert alert-error">
                        <span className="alert-icon">⚠</span>
                        <span>{error}</span>
                      </div>
                    )}
                    {success && (
                      <div className="alert alert-success">
                        <span className="alert-icon">✓</span>
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
                        style={{ minHeight: '200px' }}
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

                {/* Liste des articles */}
                {loadingArticles ? (
                  <div className="empty-box">
                    <div className="empty-icon">⟳</div>
                    <div className="empty-text">Chargement des articles...</div>
                  </div>
                ) : articles.length === 0 ? (
                  <div className="empty-box">
                    <div className="empty-icon">◆</div>
                    <div className="empty-text">Aucun article pour le moment</div>
                  </div>
                ) : (
                  <div>
                    <p className="page-sub" style={{ marginBottom: '1.5rem' }}>
                      {articles.length} article{articles.length > 1 ? 's' : ''} créé{articles.length > 1 ? 's' : ''}
                    </p>
                    {articles.map(article => (
                      <div key={article.id} className="article-item">
                        <div className="article-info">
                          <div className="article-title">{article.title}</div>
                          <div className="article-meta">
                            <span className="article-badge">{article.category}</span>
                            <span>{new Date(article.createdAt).toLocaleDateString('fr-FR')}</span>
                            <span>{article.published ? '✓ Publié' : 'Non publié'}</span>
                          </div>
                          <div className="article-excerpt">{article.excerpt}</div>
                        </div>
                        <div className="article-actions">
                          {!article.published && (
                            <button 
                              className="btn-publish"
                              onClick={() => handlePublishArticle(article.id, article.published)}
                            >
                              Publier
                            </button>
                          )}
                          {article.published && (
                            <button 
                              className="btn-publish"
                              onClick={() => handlePublishArticle(article.id, article.published)}
                              style={{ background: 'var(--steel)' }}
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

      {/* Modal d'inscription */}
      {showInscriptionModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(11, 24, 41, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }} onClick={() => setShowInscriptionModal(false)}>
          <div style={{ backgroundColor: 'var(--white)', borderRadius: '6px', padding: '2rem', maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.5rem', fontWeight: 300, marginBottom: '0.5rem' }}>
              Inscription • {selectedFormation?.name}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--steel)', marginBottom: '1.5rem' }}>
              {selectedSession && `${new Date(selectedSession.startDate).toLocaleDateString('fr-FR')} • ${selectedSession.location}`}
            </p>

            {inscriptionError && (
              <div style={{ padding: '1rem', marginBottom: '1rem', backgroundColor: 'rgba(220,38,38,0.1)', color: '#991b1b', borderRadius: '3px', fontSize: '13px', border: '0.5px solid rgba(220,38,38,0.3)' }}>
                ⚠ {inscriptionError}
              </div>
            )}

            <form onSubmit={handleInscriptionSubmit}>
              <div className="form-group">
                <label className="form-label">Prénom *</label>
                <input
                  type="text"
                  className="form-input"
                  value={inscriptionData.firstName}
                  onChange={e => setInscriptionData({ ...inscriptionData, firstName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nom *</label>
                <input
                  type="text"
                  className="form-input"
                  value={inscriptionData.lastName}
                  onChange={e => setInscriptionData({ ...inscriptionData, lastName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  className="form-input"
                  value={inscriptionData.email}
                  onChange={e => setInscriptionData({ ...inscriptionData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Téléphone *</label>
                <input
                  type="tel"
                  className="form-input"
                  value={inscriptionData.phone}
                  onChange={e => setInscriptionData({ ...inscriptionData, phone: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Entreprise (optionnel)</label>
                <input
                  type="text"
                  className="form-input"
                  value={inscriptionData.company}
                  onChange={e => setInscriptionData({ ...inscriptionData, company: e.target.value })}
                />
              </div>

              <div className="form-buttons" style={{ marginTop: '1.5rem' }}>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={submittingInscription}
                >
                  {submittingInscription ? "Inscription..." : "Confirmer l'inscription"}
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