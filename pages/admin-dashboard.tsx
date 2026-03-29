"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "user" | "admin";
  active: boolean;
  createdAt: string;
}
interface AdminUser extends User {}
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

export default function AdminDashboard() {
  const router = useRouter();
  const buildApiUrl = (ep: string) => {
    const b = process.env.NEXT_PUBLIC_BACKEND_URL || "";
    return b ? `${b}${ep}` : ep;
  };

  // Helper functions to extract nested ternaries
  const getTabLabel = (tab: "users" | "articles" | "brochures" | "inscriptions" | "sessions"): string => {
    const labels: Record<string, string> = {
      users: "Gestion Utilisateurs",
      articles: "Articles",
      brochures: "Brochures",
      inscriptions: "Inscriptions",
      sessions: "Sessions"
    };
    return labels[tab] || "";
  };

  const getSessionStatusColor = (status: string | undefined): string => {
    if (status === "ouverte") return "#16a34a";
    if (status === "complète") return "#dc2626";
    return "#7a8ea8";
  };

  const getPublishedStatus = (published: boolean): { className: string; text: string } => ({
    className: published ? "pub-on" : "pub-off",
    text: published ? "Publié" : "Brouillon"
  });

  const getBrochureStatus = (published: boolean): { className: string; text: string } => ({
    className: published ? "pub-on" : "pub-off",
    text: published ? "Publiée" : "Non publiée"
  });

  const getSeedingButtonStyle = (isInProgress: boolean) => ({
    padding: '0.5rem 1rem',
    backgroundColor: isInProgress ? '#ccc' : 'var(--blue)',
    color: 'white' as const,
    border: 'none' as const,
    borderRadius: '4px',
    cursor: isInProgress ? 'not-allowed' : 'pointer' as const,
    fontSize: '12px',
    fontWeight: 500
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

  const renderContentList = (loading: boolean, items: any[], emptyIcon: string, emptyText: string, renderItem: (item: any) => React.ReactNode) => {
    if (loading) {
      return <div className="empty"><div style={{ width:24,height:24,border:"1.5px solid rgba(30,64,175,0.15)",borderTopColor:"var(--blue)",borderRadius:"50%",animation:"spin 0.7s linear infinite" }}/></div>;
    }
    if (items.length===0) {
      return <div className="empty"><div className="empty-icon">{emptyIcon}</div><p className="empty-text">{emptyText}</p></div>;
    }
    return items.map(renderItem);
  };

  const renderInscriptionActions = (inscription: any) => {
    if (inscription.status === "liste_attente" || inscription.status === "demande_en_attente") {
      return (
        <>
          <button className="sheet-btn primary" onClick={() => { console.log("Accepting:", inscription.id); handleAcceptInscription(inscription.id); setActionSheetInscription(null); fetchInscriptions(); }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><polyline points="20 6 9 17 4 12"/></svg>
            Accepter la demande
          </button>
          <button className="sheet-btn orange-btn" onClick={() => { console.log("Rejecting waitlist:", inscription.id); handleRejectInscription(inscription.id); setActionSheetInscription(null); fetchInscriptions(); }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
            Rejeter la demande
          </button>
        </>
      );
    }
    if (inscription.status === "confirme") {
      return (
        <button className="sheet-btn danger" onClick={() => { console.log("Rejecting confirmed:", inscription.id); handleRejectInscription(inscription.id); setActionSheetInscription(null); fetchInscriptions(); }}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          Annuler l'inscription
        </button>
      );
    }
    return null;
  };

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [navOpen, setNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "articles" | "brochures" | "inscriptions" | "sessions">("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "admin" | "user">("all");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");

  // Inscriptions management
  const [inscriptions, setInscriptions] = useState<InscriptionFormation[]>([]);
  const [loadingInscriptions, setLoadingInscriptions] = useState(false);
  const [filterInscriptionStatus, setFilterInscriptionStatus] = useState<"all" | "liste_attente" | "confirme" | "annule">("all");
  const [actionSheetInscription, setActionSheetInscription] = useState<InscriptionFormation | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState({ email: "", firstName: "", lastName: "", password: "" });
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

  // Sessions management
  const [formations, setFormations] = useState<Formation[]>([]);
  const [sessions, setSessions] = useState<SessionFormation[]>([]);
  const [actionSheetSession, setActionSheetSession] = useState<SessionFormation | null>(null);
  const [loadingFormations, setLoadingFormations] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionFormData, setSessionFormData] = useState({
    formationId: "",
    startDate: "",
    endDate: "",
    location: "",
    capacity: "20",
  });
  const [submittingSession, setSubmittingSession] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [sessionSuccess, setSessionSuccess] = useState("");

  // Seed sessions
  
  const [actionSheetBrochure, setActionSheetBrochure] = useState<any | null>(null);

  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token || !userData) { router.push("/login"); return; }
    const user = JSON.parse(userData);
    if (user.role !== "admin") { router.push("/dashboard"); return; }
    setCurrentUser(user);
    fetchUsers();
    setLoading(false);
  }, [router]);

  // Persist tab selection in URL and localStorage, and restore on mount
  useEffect(() => {
    const VALID_TABS = ["users", "articles", "brochures", "inscriptions", "sessions"] as const;
    try {
      // Try URL param first
      const params = new URLSearchParams(window.location.search);
      const q = params.get("tab");
      if (q && VALID_TABS.includes(q as any)) {
        handleSetActiveTab(q as any);
      } else {
        // Fallback to localStorage
        const stored = localStorage.getItem("adminActiveTab");
        if (stored && VALID_TABS.includes(stored as any)) handleSetActiveTab(stored as any);
      }
    } catch (e) {
      // ignore (e.g., during SSR) -- component is client only
    }
  }, []);

  // Sync activeTab to URL (shallow) and localStorage
  useEffect(() => {
    try {
      localStorage.setItem("adminActiveTab", activeTab);
      router.replace({ pathname: router.pathname, query: { ...router.query, tab: activeTab } }, undefined, { shallow: true });
    } catch (e) {
      // ignore
    }
  }, [activeTab]);

  // Scroll position persistence per tab
  const currentTabRef = useRef(activeTab);
  const saveScrollForTab = (tab: string) => {
    try {
      sessionStorage.setItem(`adminScroll_${tab}`, String(window.scrollY || 0));
    } catch (e) {
      // ignore
    }
  };

  const restoreScrollForTab = (tab: string) => {
    try {
      const v = sessionStorage.getItem(`adminScroll_${tab}`);
      if (v !== null) {
        const y = parseInt(v) || 0;
        window.requestAnimationFrame(() => window.scrollTo(0, y));
      }
    } catch (e) {
      // ignore
    }
  };

  // Save previous tab scroll before switching
  const handleSetActiveTab = (tab: typeof activeTab) => {
    try {
      saveScrollForTab(currentTabRef.current);
    } catch {}
    currentTabRef.current = tab;
    setActiveTab(tab);
  };

  // restore scroll when activeTab changes
  useEffect(() => {
    restoreScrollForTab(activeTab);
  }, [activeTab]);

  // Save on unload
  useEffect(() => {
    const onBeforeUnload = () => saveScrollForTab(currentTabRef.current);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  // Save scroll when navigating away via next/router
  useEffect(() => {
    const onRouteChangeStart = (url: string) => {
      try {
        // if leaving this page, persist scroll
        if (!url.includes(router.pathname)) {
          saveScrollForTab(currentTabRef.current);
        }
      } catch (e) {}
    };
    router.events.on('routeChangeStart', onRouteChangeStart);
    return () => router.events.off('routeChangeStart', onRouteChangeStart);
  }, [router.events]);

  useEffect(() => {
    if (activeTab === "articles") {
      fetchArticles();
    } else if (activeTab === "brochures") {
      fetchBrochures();
    } else if (activeTab === "inscriptions") {
      fetchInscriptions();
    } else if (activeTab === "sessions") {
      fetchFormations();
      fetchSessions();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const r = await fetch(buildApiUrl("/api/users"), { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) setUsers(await r.json());
    } catch {}
  };

  const fetchInscriptions = async () => {
    setLoadingInscriptions(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        showToast("Non authentifié", "err");
        setLoadingInscriptions(false);
        return;
      }
      const query = filterInscriptionStatus !== "all" ? `?status=${filterInscriptionStatus}` : "";
      const url = buildApiUrl(`/api/inscriptions-manage${query}`);
      console.log("Fetching inscriptions from:", url);
      const r = await fetch(url, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (r.ok) {
        const data = await r.json();
        setInscriptions(data.data || []);
      } else {
        const errText = await r.text();
        console.error("Fetch inscriptions error:", r.status, errText);
        showToast(`Erreur ${r.status}: ${r.statusText}`, "err");
      }
    } catch (err) {
      console.error("Error fetching inscriptions:", err);
      showToast("Erreur réseau", "err");
    } finally {
      setLoadingInscriptions(false);
    }
  };

  const handleAcceptInscription = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("Non authentifié", "err");
        return;
      }
      const body = { id, action: "accept" };
      console.log("Sending PATCH body:", body);
      const r = await fetch(buildApiUrl("/api/inscriptions-manage"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      if (r.ok) {
        showToast("Inscription acceptée");
        setActionSheetInscription(null);
        await fetchInscriptions();
      } else {
        const errText = await r.text();
        console.error("Accept inscription error:", r.status, errText);
        showToast(`Erreur ${r.status}: ${errText}`, "err");
      }
    } catch (err) {
      console.error("Accept error:", err);
      showToast("Erreur réseau", "err");
    }
  };

  const handleRejectInscription = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("Non authentifié", "err");
        return;
      }
      const body = { id, action: "reject" };
      console.log("Sending PATCH body:", body);
      const r = await fetch(buildApiUrl("/api/inscriptions-manage"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      if (r.ok) {
        showToast("Inscription rejetée");
        setActionSheetInscription(null);
        await fetchInscriptions();
      } else {
        const errText = await r.text();
        console.error("Reject inscription error:", r.status, errText);
        showToast(`Erreur ${r.status}: ${errText}`, "err");
      }
    } catch (err) {
      console.error("Reject error:", err);
      showToast("Erreur réseau", "err");
    }
  };

  const handleDeleteInscription = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("Non authentifié", "err");
        return;
      }
      const r = await fetch(buildApiUrl(`/api/inscriptions-manage/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.ok) {
        showToast("Inscription supprimée");
        setActionSheetInscription(null);
        await fetchInscriptions();
      } else {
        const errText = await r.text().catch(() => "");
        console.error("Delete inscription error:", r.status, errText);
        showToast(`Erreur ${r.status}: ${errText || r.statusText}`, "err");
      }
    } catch (err) {
      console.error("Delete inscription exception:", err);
      showToast("Erreur réseau", "err");
    }
  };

  const handleSeedSessions = async () => {
    // removed seed functionality
  };

  const fetchFormations = async () => {
    setLoadingFormations(true);
    try {
      const r = await fetch("/api/formations?limit=100");
      if (r.ok) {
        const data = await r.json();
        setFormations(data.data?.formations || []);
      }
    } catch (err) {
      console.error("Error fetching formations:", err);
    } finally {
      setLoadingFormations(false);
    }
  };

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const token = localStorage.getItem("token");
      const r = await fetch(buildApiUrl("/api/sessions"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.ok) {
        const data = await r.json();
        setSessions(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleDeleteSession = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("Non authentifié", "err");
        return;
      }
      const r = await fetch(buildApiUrl(`/api/sessions/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.ok) {
        showToast("Session supprimée");
        setActionSheetSession(null);
        await fetchSessions();
      } else {
        const errText = await r.text();
        console.error("Delete session error:", r.status, errText);
        showToast(`Erreur ${r.status}: ${errText}`, "err");
      }
    } catch (err) {
      console.error("Delete session exception:", err);
      showToast("Erreur réseau", "err");
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSessionError("");
    setSessionSuccess("");
    
    if (!sessionFormData.formationId || !sessionFormData.startDate || !sessionFormData.endDate || !sessionFormData.location) {
      setSessionError("Tous les champs obligatoires doivent être remplis");
      return;
    }

    setSubmittingSession(true);
    try {
      const token = localStorage.getItem("token");
      const r = await fetch(buildApiUrl("/api/sessions"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          formationId: parseInt(sessionFormData.formationId),
          startDate: new Date(sessionFormData.startDate).toISOString(),
          endDate: new Date(sessionFormData.endDate).toISOString(),
          location: sessionFormData.location,
          capacity: parseInt(sessionFormData.capacity),
        })
      });
      if (r.ok) {
        setSessionSuccess("Session créée avec succès!");
        setSessionFormData({ formationId: "", startDate: "", endDate: "", location: "", capacity: "20" });
        setShowSessionForm(false);
        await fetchSessions();
        setTimeout(() => setSessionSuccess(""), 3000);
      } else {
        const errText = await r.text();
        setSessionError(errText || "Erreur lors de la création");
      }
    } catch (err) {
      setSessionError((err as Error).message);
    } finally {
      setSubmittingSession(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const ms = u.email.toLowerCase().includes(searchQuery.toLowerCase()) || `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    const mr = filterRole === "all" || u.role === filterRole;
    const ma = filterActive === "all" || (filterActive === "active" ? u.active : !u.active);
    return ms && mr && ma;
  });

  const handleSaveUser = async () => {
    if (!formData.email || !formData.firstName || !formData.lastName) { showToast("Champs requis manquants", "err"); return; }
    try {
      const token = localStorage.getItem("token");
      const url = modalMode === "add" ? "/api/users" : `/api/users/${selectedUser?.id}`;
      const r = await fetch(url, { method: modalMode === "add" ? "POST" : "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(formData) });
      if (r.ok) { await fetchUsers(); setShowModal(false); showToast(modalMode === "add" ? "Utilisateur créé" : "Mis à jour"); }
      else showToast("Erreur lors de la sauvegarde", "err");
    } catch { showToast("Erreur réseau", "err"); }
  };

  const handleDeleteUser = async (userId: string) => {
    setActionSheetUser(null);
    try {
      const token = localStorage.getItem("token");
      const r = await fetch(buildApiUrl(`/api/users/${userId}`), { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) { await fetchUsers(); showToast("Utilisateur supprimé"); }
      else showToast("Erreur suppression", "err");
    } catch { showToast("Erreur réseau", "err"); }
  };

  const handleToggleActive = async (userId: string, current: boolean) => {
    setActionSheetUser(null);
    try {
      const token = localStorage.getItem("token");
      const r = await fetch(buildApiUrl(`/api/users/${userId}/toggle-active`), { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) { await fetchUsers(); showToast(current ? "Compte désactivé" : "Compte activé"); }
      else showToast("Erreur", "err");
    } catch { showToast("Erreur réseau", "err"); }
  };

  const handleLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); router.push("/"); };

  const fetchArticles = async () => {
    setLoadingArticles(true);
    const token = localStorage.getItem("token");
    
    // List of endpoints to try, in order of preference
    const endpoints = [
      "/api/fetch-articles-admin",
      "/api/admin/articles", 
      "/api/articles/manage",
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`📡 Trying endpoint: ${endpoint}`);
        const r = await fetch(endpoint, { 
          headers: { Authorization: `Bearer ${token || ""}` },
          method: "GET"
        });
        
        if (r.ok) { 
          const d = await r.json();
          const articleList = Array.isArray(d.data) ? d.data : (d.data?.data || []);
          console.log(`✅ Success with ${endpoint}, got ${articleList.length} articles`);
          setArticles(articleList);
          setLoadingArticles(false);
          return;
        }
        
        console.warn(`⚠️ ${endpoint} returned ${r.status}, trying next...`);
      } catch (err) {
        console.warn(`⚠️ ${endpoint} failed:`, err);
      }
    }
    
    // All endpoints failed
    console.error("❌ All article endpoints failed");
    setArticles([]);
    setLoadingArticles(false);
  };

  const handleSubmitArticle = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setArticleError(""); 
    setArticleSuccess("");
    if (!articleFormData.title || !articleFormData.excerpt || !articleFormData.content) { 
      setArticleError("Champs obligatoires manquants"); 
      return; 
    }
    setSubmittingArticle(true);
    try {
      const token = localStorage.getItem("token");
      const r = await fetch("/api/articles", { 
        method: "POST", 
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token || ""}` }, 
        body: JSON.stringify({ 
          ...articleFormData, 
          author: `${currentUser?.firstName} ${currentUser?.lastName}` 
        }) 
      });
      const d = await r.json();
      if (r.ok) { 
        setArticleSuccess("Article créé!");
        setArticleFormData({ title: "", category: "Articles techniques", excerpt: "", content: "", image: "", author: "" }); 
        setShowArticleForm(false);
        
        // Add the new article to the list optimistically
        const newArticle: Article = {
          id: d.data?.id || Date.now(),
          title: articleFormData.title,
          category: articleFormData.category,
          excerpt: articleFormData.excerpt,
          content: articleFormData.content,
          image: articleFormData.image,
          author: `${currentUser?.firstName} ${currentUser?.lastName}`,
          published: false,
          createdAt: new Date().toISOString(),
        };
        
        setArticles([newArticle, ...articles]);
        
        // Refresh in background to ensure sync
        setTimeout(() => fetchArticles(), 1000);
        setTimeout(() => setArticleSuccess(""), 3000); 
      } else {
        setArticleError(d.error || "Erreur création");
      }
    } catch (err) { 
      console.error("Submit article error:", err);
      setArticleError("Erreur: " + (err as Error).message); 
    } finally { 
      setSubmittingArticle(false); 
    }
  };

  const handlePublishArticle = async (id: number, current: boolean) => {
    setActionSheetArticle(null);
    try {
      const token = localStorage.getItem("token");
      const r = await fetch(buildApiUrl(`/api/articles/${id}`), { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token || ""}` }, body: JSON.stringify({ published: !current }) });
      if (r.ok) { showToast(!current ? "Article publié" : "Article dépublié"); await fetchArticles(); }
      else showToast("Erreur", "err");
    } catch { showToast("Erreur réseau", "err"); }
  };

  const handleDeleteArticle = async (id: number) => {
    setActionSheetArticle(null);
    try {
      const token = localStorage.getItem("token");
      const r = await fetch(buildApiUrl(`/api/articles/${id}`), { method: "DELETE", headers: { Authorization: `Bearer ${token || ""}` } });
      if (r.ok) { showToast("Article supprimé"); await fetchArticles(); }
      else showToast("Erreur", "err");
    } catch { showToast("Erreur réseau", "err"); }
  };

  const fetchBrochures = async () => {
    setLoadingBrochures(true);
    try {
      const token = localStorage.getItem("token");
      const r = await fetch("/api/brochures/manage", { headers: { Authorization: `Bearer ${token || ""}` } });
      if (r.ok) { const d = await r.json(); setBrochures(d.data || []); }
    } catch {} finally { setLoadingBrochures(false); }
  };

  const handleSubmitBrochure = async (e: React.FormEvent) => {
    e.preventDefault(); setBrochureError(""); setBrochureSuccess("");
    if (!brochureFormData.name || !brochureFile) { setBrochureError("Fichier et nom requis"); return; }
    setSubmittingBrochure(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!backendUrl) { setBrochureError("Backend URL manquant"); setSubmittingBrochure(false); return; }
      try {
        const r = await fetch(`${backendUrl}/api/brochures/upload`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token") || ""}` }, body: JSON.stringify({ fileBuffer: base64, fileName: brochureFile!.name, ...brochureFormData }) });
        const d = await r.json();
        if (r.ok) { setBrochureSuccess("Brochure uploadée!"); setBrochureFormData({ name: "", description: "" }); setBrochureFile(null); setShowBrochureForm(false); await fetchBrochures(); setTimeout(() => setBrochureSuccess(""), 3000); }
        else setBrochureError(d.error || "Erreur upload");
      } catch (err) { setBrochureError("Erreur: " + (err as Error).message); }
      finally { setSubmittingBrochure(false); }
    };
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
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100svh", background: "#f5f4f0" }}>
      <div style={{ width: 28, height: 28, border: "2px solid rgba(30,64,175,0.12)", borderTopColor: "#1e40af", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
    </div>
  );

  const initials = ((currentUser.firstName?.[0] || "") + (currentUser.lastName?.[0] || "")).toUpperCase() || currentUser.email[0].toUpperCase();

  return (
    <>
      <Head>
        <title>Admin Dashboard — FiSAFi Groupe</title>
        <meta name="robots" content="noindex" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Outfit:wght@200;300;400;500&display=swap" rel="stylesheet" />
        <style>{`
          *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
          :root{
            --ink:#0b1829;
            --blue:#1e40af;
            --blue-deep:#0f2470;
            --orange:#e55a00;
            --orange-light:#f07030;
            --mist:#f5f4f0;
            --white:#ffffff;
            --steel:#7a8ea8;
            --line:rgba(30,64,175,0.10);
            --success:#10b981;
            --danger:#ef4444;
          }
          html,body{background:var(--mist);color:var(--ink);font-family:'Outfit',sans-serif;font-weight:300;-webkit-font-smoothing:antialiased;overflow-x:hidden;}
          @keyframes spin{to{transform:rotate(360deg);}}
          @keyframes fadeUp{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
          @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
          @keyframes sheetUp{from{transform:translateY(100%);}to{transform:translateY(0);}}

          /* ── LAYOUT ── */
          .admin-layout{display:flex;min-height:100svh;}

          /* ── SIDEBAR (desktop) ── */
          .admin-sidebar{
            display:none;
            position:sticky;top:0;height:100svh;
            width:270px;flex-shrink:0;
            background:var(--blue-deep);
            flex-direction:column;
          }
          @media(min-width:900px){.admin-sidebar{display:flex;}}
          .sidebar-section{padding:1.5rem 1.5rem;border-bottom:0.5px solid rgba(255,255,255,0.08);}
          .sidebar-logo{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:300;letter-spacing:0.2em;text-transform:uppercase;color:#fff;}
          .sidebar-logo span{color:var(--orange);}
          .sidebar-badge{font-size:9px;letter-spacing:0.28em;text-transform:uppercase;color:var(--orange);margin-top:4px;}
          .sidebar-user{display:flex;align-items:center;gap:0.875rem;}
          .sidebar-avatar{width:40px;height:40px;border-radius:50%;background:var(--orange);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:400;color:#fff;flex-shrink:0;}
          .sidebar-name{font-size:13px;color:#fff;font-weight:400;}
          .sidebar-email{font-size:10px;color:rgba(255,255,255,0.4);margin-top:2px;}
          .sidebar-nav{flex:1;padding:1rem 0.75rem;overflow-y:auto;}
          .sidebar-link{
            display:block;padding:0.85rem 1rem;
            color:rgba(255,255,255,0.55);text-decoration:none;
            font-size:11px;letter-spacing:0.15em;text-transform:uppercase;
            transition:background 0.15s,color 0.15s;
            margin-bottom:2px;background:none;border:none;
            border-left:2px solid transparent;cursor:pointer;
            text-align:left;width:100%;font-family:'Outfit',sans-serif;font-weight:300;
          }
          .sidebar-link:hover{background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.85);}
          .sidebar-link.active{background:rgba(255,255,255,0.10);color:#fff;border-left-color:var(--orange);}
          .sidebar-logout{padding:1rem 0.75rem;border-top:0.5px solid rgba(255,255,255,0.08);}
          .btn-logout{width:100%;padding:0.8rem 1rem;background:rgba(229,90,0,0.12);border:0.5px solid rgba(229,90,0,0.25);color:rgba(255,255,255,0.65);cursor:pointer;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;font-family:'Outfit',sans-serif;transition:background 0.15s,color 0.15s;}
          .btn-logout:hover{background:rgba(229,90,0,0.25);color:#fff;}

          /* ── MOBILE TOPBAR ── */
          .mob-topbar{
            position:sticky;top:0;z-index:100;
            display:flex;align-items:center;justify-content:space-between;
            padding:0 1.25rem;
            padding-top:env(safe-area-inset-top);
            height:calc(60px + env(safe-area-inset-top));
            background:rgba(245,244,240,0.97);
            backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
            border-bottom:0.5px solid var(--line);
          }
          @media(min-width:900px){.mob-topbar{display:none;}}
          .mob-logo{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:300;letter-spacing:0.2em;text-transform:uppercase;color:var(--blue);}
          .mob-logo span{color:var(--orange);}
          .mob-menu-btn{display:flex;flex-direction:column;justify-content:center;align-items:center;gap:5px;width:36px;height:36px;background:transparent;border:none;cursor:pointer;padding:4px;}
          .mob-menu-btn span{display:block;width:22px;height:1px;background:var(--ink);transition:transform 0.25s,opacity 0.25s;transform-origin:center;}
          .mob-menu-btn.open span:nth-child(1){transform:translateY(6px) rotate(45deg);}
          .mob-menu-btn.open span:nth-child(2){opacity:0;}
          .mob-menu-btn.open span:nth-child(3){transform:translateY(-6px) rotate(-45deg);}

          /* ── MOBILE NAV (slides from right — matches site style) ── */
          .mob-menu{
            position:fixed;top:calc(60px + env(safe-area-inset-top));left:0;right:0;bottom:0;
            z-index:99;background:var(--mist);
            display:flex;flex-direction:column;padding:1.5rem;
            border-top:0.5px solid var(--line);
            transform:translateX(100%);
            transition:transform 0.3s cubic-bezier(0.4,0,0.2,1);
            overflow-y:auto;
          }
          .mob-menu.open{transform:translateX(0);}
          .mob-menu-user{display:flex;align-items:center;gap:0.75rem;padding-bottom:1.5rem;border-bottom:0.5px solid var(--line);margin-bottom:0.25rem;}
          .mob-menu-avatar{width:44px;height:44px;border-radius:50%;background:var(--orange);display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:400;color:#fff;flex-shrink:0;}
          .mob-menu-name{font-size:13px;color:var(--ink);font-weight:400;}
          .mob-menu-email{font-size:11px;color:var(--steel);margin-top:2px;}
          .mob-nav-link{
            display:block;padding:1.1rem 0;
            font-size:12px;letter-spacing:0.18em;text-transform:uppercase;
            color:var(--steel);
            background:none;border:none;border-bottom:0.5px solid var(--line);
            text-decoration:none;cursor:pointer;
            text-align:left;width:100%;font-family:'Outfit',sans-serif;font-weight:300;
            transition:color 0.2s,padding-left 0.2s;
          }
          .mob-nav-link:hover,.mob-nav-link.active{color:var(--ink);padding-left:0.5rem;}
          .mob-nav-link.active{color:var(--orange);}
          .mob-logout{margin-top:1.5rem;border-bottom:none !important;background:var(--blue);color:#fff !important;text-align:center !important;padding:1rem !important;transition:background 0.2s !important;}
          .mob-logout:hover{background:var(--blue-deep) !important;padding-left:0 !important;}

          /* ── BOTTOM TAB BAR ── */
          .tab-bar{
            position:fixed;bottom:0;left:0;right:0;z-index:80;
            display:flex;
            background:rgba(245,244,240,0.97);
            backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
            border-top:0.5px solid var(--line);
            padding-bottom:env(safe-area-inset-bottom);
          }
          @media(min-width:900px){.tab-bar{display:none;}}
          .tab-btn{
            flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
            gap:4px;padding:0.6rem 0.25rem;position:relative;
            background:none;border:none;cursor:pointer;
            font-family:'Outfit',sans-serif;font-size:9px;
            letter-spacing:0.15em;text-transform:uppercase;
            color:var(--steel);transition:color 0.18s;
          }
          .tab-btn.active{color:var(--blue);}
          .tab-btn svg{width:19px;height:19px;}
          .tab-active-line{position:absolute;top:0;left:50%;transform:translateX(-50%);width:20px;height:2px;background:var(--orange);opacity:0;transition:opacity 0.18s;}
          .tab-btn.active .tab-active-line{opacity:1;}

          /* ── MAIN ── */
          .admin-main{flex:1;display:flex;flex-direction:column;min-width:0;}
          .admin-content{flex:1;padding:2rem 1.25rem 110px;max-width:900px;margin:0 auto;width:100%;}
          @media(min-width:900px){.admin-content{padding:3.5rem 3rem 3rem;}}

          /* ── PAGE HEADER ── */
          .admin-header{margin-bottom:2rem;}
          .admin-eyebrow{font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:var(--orange);margin-bottom:0.75rem;display:flex;align-items:center;gap:0.6rem;}
          .admin-eyebrow::before{content:'';width:1.5rem;height:0.5px;background:var(--orange);}
          .admin-title{font-family:'Cormorant Garamond',serif;font-size:clamp(2rem,8vw,3rem);font-weight:300;color:var(--ink);line-height:1.1;margin-bottom:0.4rem;}
          .admin-sub{font-size:12px;color:var(--steel);}

          /* ── STATS ── */
          .stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:0.75rem;margin-bottom:1.75rem;}
          .stat-card{background:var(--white);border:0.5px solid var(--line);padding:1rem 0.75rem;text-align:center;}
          .stat-num{font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:300;color:var(--ink);}
          .stat-num.blue{color:var(--blue);}
          .stat-num.green{color:var(--success);}
          .stat-label{font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:var(--steel);margin-top:2px;}

          /* ── SEARCH / FILTERS ── */
          .search-box{display:flex;align-items:center;gap:0.5rem;padding:0.7rem 1rem;background:var(--white);border:0.5px solid var(--line);margin-bottom:1rem;}
          .search-box svg{width:14px;height:14px;color:var(--steel);flex-shrink:0;}
          .search-box input{flex:1;background:none;border:none;font-family:'Outfit',sans-serif;font-size:13px;font-weight:300;color:var(--ink);outline:none;}
          .search-box input::placeholder{color:var(--steel);}
          .filter-row{display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1.5rem;}
          select{padding:0.55rem 0.875rem;background:var(--white);border:0.5px solid var(--line);font-family:'Outfit',sans-serif;font-size:11px;letter-spacing:0.08em;cursor:pointer;color:var(--ink);transition:border-color 0.2s;}
          select:hover,select:focus{outline:none;border-color:var(--blue);}

          /* ── USER CARD (mobile tap target) ── */
          .user-card{
            background:var(--white);border:0.5px solid var(--line);
            padding:1rem 1.25rem;margin-bottom:0.5rem;
            display:flex;align-items:center;gap:0.875rem;
            cursor:pointer;transition:border-color 0.2s,padding-left 0.2s;
          }
          .user-card:hover{border-color:var(--blue);padding-left:1.5rem;}
          .user-card-avatar{width:38px;height:38px;border-radius:50%;background:var(--orange);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:400;color:#fff;flex-shrink:0;}
          .user-card-avatar.is-admin{background:var(--blue);}
          .user-card-info{flex:1;min-width:0;}
          .user-card-name{font-size:13px;font-weight:400;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
          .user-card-email{font-size:11px;color:var(--steel);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
          .user-card-right{display:flex;align-items:center;gap:0.5rem;flex-shrink:0;}
          .status-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}
          .status-dot.active{background:var(--success);}
          .status-dot.inactive{background:var(--danger);}
          .badge{display:inline-block;padding:0.25rem 0.6rem;font-size:9px;letter-spacing:0.12em;text-transform:uppercase;font-weight:400;}
          .badge-admin{background:rgba(30,64,175,0.10);color:var(--blue);}
          .badge-user{background:rgba(122,142,168,0.12);color:var(--steel);}
          .chevron{width:13px;height:13px;color:var(--steel);}

          /* ── TABLE (desktop) ── */
          .table-wrap{background:var(--white);border:0.5px solid var(--line);overflow-x:auto;}
          table{width:100%;border-collapse:collapse;min-width:600px;}
          thead{background:rgba(30,64,175,0.03);}
          th{padding:1rem 1.25rem;text-align:left;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:var(--steel);font-weight:400;border-bottom:0.5px solid var(--line);}
          td{padding:1rem 1.25rem;font-size:13px;color:var(--ink);border-bottom:0.5px solid var(--line);font-weight:300;}
          tr:last-child td{border-bottom:none;}
          tr:hover td{background:rgba(30,64,175,0.02);}
          .action-btns{display:flex;gap:0.5rem;}
          .btn-sm{padding:0.35rem 0.75rem;background:none;border:0.5px solid var(--line);font-size:10px;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;font-family:'Outfit',sans-serif;color:var(--ink);transition:background 0.2s,border-color 0.2s,color 0.2s;}
          .btn-sm:hover{background:rgba(30,64,175,0.06);border-color:var(--blue);color:var(--blue);}
          .btn-sm.danger{border-color:rgba(239,68,68,0.3);color:var(--danger);}
          .btn-sm.danger:hover{background:rgba(239,68,68,0.06);}

          /* show/hide helpers */
          .mob-only{display:block;}
          .desk-only{display:none;}
          @media(min-width:900px){.mob-only{display:none;}.desk-only{display:block;}}

          /* ── ACTION SHEET ── */
          .sheet-backdrop{position:fixed;inset:0;z-index:200;background:rgba(11,24,41,0.5);backdrop-filter:blur(4px);animation:fadeIn 0.2s;}
          .sheet{position:fixed;bottom:0;left:0;right:0;z-index:201;background:var(--white);border-top:2px solid var(--blue);padding-bottom:calc(1.5rem + env(safe-area-inset-bottom));animation:sheetUp 0.28s cubic-bezier(0.4,0,0.2,1);}
          .sheet-handle{width:32px;height:3px;background:var(--line);margin:0.75rem auto;}
          .sheet-head{padding:0.75rem 1.5rem 1rem;border-bottom:0.5px solid var(--line);}
          .sheet-title{font-family:'Cormorant Garamond',serif;font-size:1.25rem;font-weight:300;color:var(--ink);}
          .sheet-sub{font-size:11px;color:var(--steel);margin-top:3px;}
          .sheet-actions{padding:0.5rem 0.75rem;}
          .sheet-btn{display:flex;align-items:center;gap:0.875rem;width:100%;padding:0.95rem 0.75rem;background:none;border:none;font-family:'Outfit',sans-serif;font-size:13px;font-weight:300;color:var(--ink);cursor:pointer;transition:background 0.15s;text-align:left;letter-spacing:0.02em;}
          .sheet-btn:hover{background:rgba(30,64,175,0.04);}
          .sheet-btn svg{width:17px;height:17px;flex-shrink:0;color:var(--steel);}
          .sheet-btn.primary{color:var(--blue);}
          .sheet-btn.primary svg{color:var(--blue);}
          .sheet-btn.orange-btn{color:var(--orange);}
          .sheet-btn.orange-btn svg{color:var(--orange);}
          .sheet-btn.danger{color:var(--danger);}
          .sheet-btn.danger svg{color:var(--danger);}
          .sheet-divider{height:0.5px;background:var(--line);margin:0.25rem 0;}
          .sheet-cancel{margin:0.5rem 0.75rem 0;width:calc(100% - 1.5rem);padding:0.95rem;background:var(--mist);border:0.5px solid var(--line);font-family:'Outfit',sans-serif;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:var(--steel);cursor:pointer;transition:background 0.2s;}
          .sheet-cancel:hover{background:rgba(30,64,175,0.04);}

          /* ── FAB ── */
          .fab{position:fixed;bottom:calc(56px + env(safe-area-inset-bottom) + 1.25rem);right:1.25rem;z-index:70;width:50px;height:50px;background:var(--orange);border:none;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(229,90,0,0.35);transition:background 0.2s,transform 0.15s;}
          .fab:hover{background:var(--orange-light);}
          .fab:active{transform:scale(0.96);}
          .fab svg{width:20px;height:20px;}
          @media(min-width:900px){.fab{bottom:2rem;right:2.5rem;}}

          /* ── MODAL ── */
          .modal-backdrop{position:fixed;inset:0;z-index:200;background:rgba(11,24,41,0.5);backdrop-filter:blur(4px);display:flex;align-items:flex-end;justify-content:center;animation:fadeIn 0.2s;}
          @media(min-width:600px){.modal-backdrop{align-items:center;}}
          .modal{background:var(--white);border-top:2px solid var(--blue);width:100%;max-width:520px;padding:1.75rem 1.5rem;padding-bottom:calc(1.75rem + env(safe-area-inset-bottom));animation:sheetUp 0.28s ease;max-height:90svh;overflow-y:auto;}
          @media(min-width:600px){.modal{border:0.5px solid var(--line);border-top:2px solid var(--blue);animation:fadeUp 0.28s ease;}}
          .modal-handle{width:32px;height:3px;background:var(--line);margin:0 auto 1.5rem;}
          .modal-title{font-family:'Cormorant Garamond',serif;font-size:1.6rem;font-weight:300;color:var(--ink);margin-bottom:1.5rem;}
          .form-group{margin-bottom:1.25rem;}
          .form-label{display:block;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:var(--steel);margin-bottom:0.4rem;font-weight:400;}
          .form-input{width:100%;padding:0.75rem;background:var(--white);border:0.5px solid var(--line);font-family:'Outfit',sans-serif;font-size:13px;font-weight:300;color:var(--ink);transition:border-color 0.2s;}
          .form-input:focus{outline:none;border-color:var(--blue);}
          .form-input::placeholder{color:var(--steel);}
          .form-select{width:100%;padding:0.75rem;background:var(--white);border:0.5px solid var(--line);font-family:'Outfit',sans-serif;font-size:13px;font-weight:300;color:var(--ink);cursor:pointer;}
          .form-select:focus{outline:none;border-color:var(--blue);}
          .form-textarea{width:100%;padding:0.75rem;background:var(--white);border:0.5px solid var(--line);font-family:'Outfit',sans-serif;font-size:13px;font-weight:300;color:var(--ink);resize:vertical;min-height:100px;}
          .form-textarea:focus{outline:none;border-color:var(--blue);}
          .form-textarea::placeholder{color:var(--steel);}
          .modal-actions{display:flex;gap:0.75rem;margin-top:1.5rem;}
          .btn-primary-fill{flex:1;padding:0.875rem 1.5rem;background:var(--blue);color:#fff;border:none;font-family:'Outfit',sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;cursor:pointer;font-weight:400;transition:background 0.2s;}
          .btn-primary-fill:hover{background:var(--blue-deep);}
          .btn-primary-fill:disabled{opacity:0.55;cursor:not-allowed;}
          .btn-cancel-fill{padding:0.875rem 1.25rem;background:none;border:0.5px solid var(--line);color:var(--ink);font-family:'Outfit',sans-serif;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;cursor:pointer;transition:background 0.2s;}
          .btn-cancel-fill:hover{background:rgba(30,64,175,0.04);}

          /* ── ARTICLE / BROCHURE CARD ── */
          .content-card{background:var(--white);border:0.5px solid var(--line);padding:1.25rem 1.5rem;margin-bottom:0.5rem;cursor:pointer;transition:border-color 0.2s,box-shadow 0.2s;}
          .content-card:hover{border-color:var(--orange);box-shadow:0 3px 10px rgba(229,90,0,0.07);}
          .content-card-title{font-family:'Cormorant Garamond',serif;font-size:1.1rem;font-weight:300;color:var(--ink);margin-bottom:0.35rem;}
          .content-card-meta{display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.5rem;}
          .content-card-excerpt{font-size:12px;color:var(--steel);line-height:1.65;}
          .cat-badge{display:inline-block;padding:0.2rem 0.6rem;font-size:9px;letter-spacing:0.12em;text-transform:uppercase;background:rgba(30,64,175,0.08);color:var(--blue);}
          .pub-on{display:inline-block;padding:0.2rem 0.6rem;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;background:rgba(16,185,129,0.1);color:var(--success);}
          .pub-off{display:inline-block;padding:0.2rem 0.6rem;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;background:rgba(122,142,168,0.1);color:var(--steel);}
          .content-date{font-size:10px;color:var(--steel);}

          /* ── FORM PANEL ── */
          .form-panel{background:var(--white);border:0.5px solid var(--line);border-top:2px solid var(--blue);padding:1.5rem;margin-bottom:1.5rem;}
          .form-panel-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;}
          .form-panel-title{font-family:'Cormorant Garamond',serif;font-size:1.3rem;font-weight:300;color:var(--ink);}
          .form-panel-close{background:none;border:none;cursor:pointer;color:var(--steel);font-size:18px;line-height:1;transition:color 0.2s;}
          .form-panel-close:hover{color:var(--ink);}
          .form-row-grid{display:grid;grid-template-columns:1fr;gap:0;}
          @media(min-width:560px){.form-row-grid{grid-template-columns:1fr 1fr;gap:0 1.25rem;}}

          /* ── ALERTS / TOAST ── */
          .alert{padding:0.875rem 1rem;font-size:12px;margin-bottom:1rem;display:flex;align-items:flex-start;gap:0.5rem;line-height:1.5;}
          .alert-err{background:rgba(239,68,68,0.05);border:0.5px solid rgba(239,68,68,0.2);color:#b91c1c;}
          .alert-ok{background:rgba(16,185,129,0.05);border:0.5px solid rgba(16,185,129,0.2);color:#047857;}
          .toast{position:fixed;bottom:calc(64px + env(safe-area-inset-bottom) + 1rem);left:50%;transform:translateX(-50%);z-index:300;padding:0.7rem 1.25rem;background:var(--ink);color:#fff;font-family:'Outfit',sans-serif;font-size:12px;font-weight:400;letter-spacing:0.06em;white-space:nowrap;animation:fadeUp 0.25s ease;pointer-events:none;box-shadow:0 4px 16px rgba(11,24,41,0.2);}
          .toast.err{background:var(--danger);}
          @media(min-width:900px){.toast{bottom:2.5rem;}}

          /* ── EMPTY ── */
          .empty{padding:3rem 1rem;text-align:center;}
          .empty-icon{font-size:2rem;opacity:0.2;margin-bottom:0.75rem;}
          .empty-text{font-size:13px;color:var(--steel);}

          /* ── ADD BTN ── */
          .btn-add{display:inline-flex;align-items:center;gap:0.5rem;padding:0.8rem 1.5rem;background:var(--blue);color:#fff;border:none;font-family:'Outfit',sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;cursor:pointer;font-weight:400;transition:background 0.2s;margin-bottom:1.75rem;}
          .btn-add:hover{background:var(--blue-deep);}
        `}</style>
      </Head>

      {/* Toast */}
      {toast && <div className={`toast${toast.type === "err" ? " err" : ""}`}>{toast.msg}</div>}

      {/* Mobile menu */}
      <nav className={`mob-menu${navOpen ? " open" : ""}`}>
        <div className="mob-menu-user">
          <div className="mob-menu-avatar">{initials}</div>
          <div>
            <div className="mob-menu-name">{currentUser.firstName} {currentUser.lastName}</div>
            <div className="mob-menu-email">{currentUser.email}</div>
          </div>
        </div>
        {(["users","articles","brochures","inscriptions","sessions"] as const).map(tab => (
          <button key={tab} className={`mob-nav-link${activeTab===tab?" active":""}`} onClick={() => { handleSetActiveTab(tab); setNavOpen(false); }}>
            {getTabLabel(tab)}
          </button>
        ))}
        <a href="/dashboard" className="mob-nav-link">Retour Dashboard</a>
        <button className="mob-nav-link mob-logout" onClick={handleLogout}>Déconnexion</button>
      </nav>

      <div className="admin-layout">
        {/* Sidebar desktop */}
        <aside className="admin-sidebar">
          <div className="sidebar-section">
            <div className="sidebar-logo">Fi<span>SAFI</span></div>
            <div className="sidebar-badge">Admin Dashboard</div>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-user">
              <div className="sidebar-avatar">{initials}</div>
              <div>
                <div className="sidebar-name">{currentUser.firstName} {currentUser.lastName}</div>
                <div className="sidebar-email">{currentUser.email}</div>
              </div>
            </div>
          </div>
          <nav className="sidebar-nav">
            {(["users","articles","brochures","inscriptions","sessions"] as const).map(tab => (
              <button key={tab} className={`sidebar-link${activeTab===tab?" active":""}`} onClick={() => handleSetActiveTab(tab)}>
                {getTabLabel(tab)}
              </button>
            ))}
            <a href="/dashboard" className="sidebar-link" style={{ marginTop:"1rem",paddingTop:"1rem",borderTop:"0.5px solid rgba(255,255,255,0.08)",display:"block" }}>Retour Dashboard</a>
          </nav>
          <div className="sidebar-logout">
            <button className="btn-logout" onClick={handleLogout}>Déconnexion</button>
          </div>
        </aside>

        <div className="admin-main">
          {/* Mobile topbar */}
          <header className="mob-topbar">
            <div className="mob-logo">Fi<span>SAFI</span></div>
            <button className={`mob-menu-btn${navOpen?" open":""}`} onClick={() => setNavOpen(!navOpen)}>
              <span/><span/><span/>
            </button>
          </header>

          <div className="admin-content">

            {/* Seed Sessions Utility removed */}

            {/* ═══ USERS ═══ */}
            {activeTab==="users" && (<>
              <div className="admin-header">
                <div className="admin-eyebrow">Gestion</div>
                <h1 className="admin-title">Utilisateurs</h1>
                <p className="admin-sub">Gérez les comptes et les droits d'accès</p>
              </div>

              <div className="stats-row">
                <div className="stat-card"><div className="stat-num">{users.length}</div><div className="stat-label">Total</div></div>
                <div className="stat-card"><div className="stat-num green">{users.filter(u=>u.active).length}</div><div className="stat-label">Actifs</div></div>
                <div className="stat-card"><div className="stat-num blue">{users.filter(u=>u.role==="admin").length}</div><div className="stat-label">Admins</div></div>
              </div>

              <div className="search-box">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input placeholder="Chercher par email ou nom…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>

              <div className="filter-row">
                <select value={filterRole} onChange={e => setFilterRole(e.target.value as any)}>
                  <option value="all">Tous les rôles</option>
                  <option value="user">Utilisateur</option>
                  <option value="admin">Admin</option>
                </select>
                <select value={filterActive} onChange={e => setFilterActive(e.target.value as any)}>
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                </select>
              </div>

              {/* Mobile: cards */}
              <div className="mob-only">
                {filteredUsers.length===0
                  ? <div className="empty"><div className="empty-icon">—</div><p className="empty-text">Aucun utilisateur trouvé</p></div>
                  : filteredUsers.map(u => (
                    <div key={u.id} className="user-card" onClick={() => setActionSheetUser(u)}>
                      <div className={`user-card-avatar${u.role==="admin"?" is-admin":""}`}>
                        {((u.firstName?.[0]||"")+(u.lastName?.[0]||"")).toUpperCase()||u.email[0].toUpperCase()}
                      </div>
                      <div className="user-card-info">
                        <div className="user-card-name">{u.firstName} {u.lastName}</div>
                        <div className="user-card-email">{u.email}</div>
                      </div>
                      <div className="user-card-right">
                        <div className={`status-dot ${u.active?"active":"inactive"}`}/>
                        <span className={`badge badge-${u.role}`}>{u.role}</span>
                        <svg className="chevron" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Desktop: table */}
              <div className="desk-only">
                {filteredUsers.length===0
                  ? <div className="empty"><div className="empty-icon">—</div><p className="empty-text">Aucun utilisateur trouvé</p></div>
                  : <div className="table-wrap">
                      <table>
                        <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Créé le</th><th>Actions</th></tr></thead>
                        <tbody>
                          {filteredUsers.map(u => (
                            <tr key={u.id}>
                              <td>{u.firstName} {u.lastName}</td>
                              <td>{u.email}</td>
                              <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                              <td>
                                <span style={{ display:"inline-flex",alignItems:"center",gap:"0.4rem",fontSize:12,color:u.active?"var(--success)":"var(--danger)" }}>
                                  <span className={`status-dot ${u.active?"active":"inactive"}`}/>
                                  {u.active?"Actif":"Inactif"}
                                </span>
                              </td>
                              <td>{new Date(u.createdAt).toLocaleDateString("fr-FR")}</td>
                              <td>
                                <div className="action-btns">
                                  <button className="btn-sm" onClick={() => { setModalMode("edit"); setSelectedUser(u); setFormData({ email:u.email, firstName:u.firstName||"", lastName:u.lastName||"", password:"" }); setShowModal(true); }}>Éditer</button>
                                  <button className="btn-sm" onClick={() => handleToggleActive(u.id,u.active)}>{u.active?"Désactiver":"Activer"}</button>
                                  <button className="btn-sm danger" onClick={() => { if(confirm("Supprimer cet utilisateur ?")) handleDeleteUser(u.id); }}>Supprimer</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>}
              </div>

              <button className="fab" onClick={() => { setModalMode("add"); setFormData({ email:"",firstName:"",lastName:"",password:"" }); setSelectedUser(null); setShowModal(true); }}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            </>)}

            {/* ═══ ARTICLES ═══ */}
            {activeTab==="articles" && (<>
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
                    <button className="form-panel-close" onClick={() => setShowArticleForm(false)}>✕</button>
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
                      <button type="submit" className="btn-primary-fill" disabled={submittingArticle}>{submittingArticle?"Création…":"Créer l'article"}</button>
                    </div>
                  </form>
                </div>
              ) : (
                <button className="btn-add" onClick={() => { setShowArticleForm(true); setArticleError(""); setArticleSuccess(""); }}>+ Nouvel article</button>
              )}

              {renderContentList(
                loadingArticles,
                articles,
                "📝",
                "Aucun article pour le moment",
                (a) => (
                  <div key={a.id} className="content-card" onClick={() => setActionSheetArticle(a)}>
                    <div className="content-card-title">{a.title}</div>
                    <div className="content-card-meta">
                      <span className="cat-badge">{a.category}</span>
                      <span className={getPublishedStatus(a.published).className}>{getPublishedStatus(a.published).text}</span>
                      <span className="content-date">{new Date(a.createdAt).toLocaleDateString("fr-FR")}</span>
                    </div>
                    <div className="content-card-excerpt">{a.excerpt}</div>
                  </div>
                )
              )}

              {!showArticleForm && <button className="fab" onClick={() => { setShowArticleForm(true); setArticleError(""); setArticleSuccess(""); }}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>}
            </>)}

            {/* ═══ BROCHURES ═══ */}
            {activeTab==="brochures" && (<>
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
                    <button className="form-panel-close" onClick={() => setShowBrochureForm(false)}>✕</button>
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
                      <input type="file" className="form-input" accept=".pdf,.png,.jpg,.jpeg,.gif" onChange={e => setBrochureFile(e.target.files?.[0]||null)} required />
                      {brochureFile && <p style={{ fontSize:11,color:"var(--steel)",marginTop:6 }}>{brochureFile.name} — {(brochureFile.size/1024/1024).toFixed(2)} MB</p>}
                    </div>
                    <div className="modal-actions">
                      <button type="button" className="btn-cancel-fill" onClick={() => setShowBrochureForm(false)}>Annuler</button>
                      <button type="submit" className="btn-primary-fill" disabled={submittingBrochure}>{submittingBrochure?"Upload…":"Uploader"}</button>
                    </div>
                  </form>
                </div>
              ) : (
                <button className="btn-add" onClick={() => { setShowBrochureForm(true); setBrochureError(""); setBrochureSuccess(""); }}>+ Uploader une brochure</button>
              )}

              {renderContentList(
                loadingBrochures,
                brochures,
                "📄",
                "Aucune brochure pour le moment",
                (b) => (
                  <div key={b.id} className="content-card" onClick={() => setActionSheetBrochure(b)}>
                    <div className="content-card-title">{b.name}</div>
                    <div className="content-card-meta">
                      <span className="cat-badge">{b.type||"PDF"}</span>
                      <span className={getBrochureStatus(b.published).className}>{getBrochureStatus(b.published).text}</span>
                      {b.fileSize && <span className="content-date">{(Number.parseInt(b.fileSize,10)/1024/1024).toFixed(2)} MB</span>}
                      <span className="content-date">{new Date(b.createdAt).toLocaleDateString("fr-FR")}</span>
                    </div>
                    {b.description && <div className="content-card-excerpt">{b.description}</div>}
                  </div>
                )
              )}

              {!showBrochureForm && <button className="fab" onClick={() => { setShowBrochureForm(true); setBrochureError(""); setBrochureSuccess(""); }}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>}
            </>)}

            {/* ═══ INSCRIPTIONS ═══ */}
            {activeTab==="inscriptions" && (<>
              <div className="admin-header">
                <div className="admin-eyebrow">Gestion</div>
                <h1 className="admin-title">Inscriptions aux formations</h1>
                <p className="admin-sub">Acceptez ou rejetez les demandes d'inscription</p>
              </div>

              <div className="filter-row">
                <select value={filterInscriptionStatus} onChange={e => setFilterInscriptionStatus(e.target.value as any)}>
                  <option value="all">Tous les statuts</option>
                  <option value="liste_attente">En attente</option>
                  <option value="confirme">Confirmés</option>
                  <option value="annule">Annulés</option>
                </select>
              </div>

              {renderContentList(
                loadingInscriptions,
                inscriptions,
                "◎",
                "Aucune inscription",
                (inscription) => (
                  <div key={inscription.id} className="content-card" onClick={() => setActionSheetInscription(inscription)}>
                    <div className="content-card-title">{inscription.firstName} {inscription.lastName}</div>
                    <div className="content-card-meta">
                      <span className="cat-badge">{inscription.formation?.name || "Formation"}</span>
                      <span className={inscription.status==="confirme"?"pub-on":"pub-off"}>{inscription.status}</span>
                      <span className="content-date">{inscription.session?.location || "Lieu"}</span>
                      <span className="content-date">{new Date(inscription.session?.startDate||inscription.createdAt).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>
                )
              )}
            </>)}

            {/* ═══ SESSIONS ═══ */}
            {activeTab==="sessions" && (<>
              <div className="admin-header">
                <div className="admin-eyebrow">Gestion</div>
                <h1 className="admin-title">Sessions de Formation</h1>
                <p className="admin-sub">Créez et gérez les sessions de formation</p>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <button className="btn-add" onClick={() => { setShowSessionForm(true); setSessionError(""); setSessionSuccess(""); }}>+ Créer une session</button>
              </div>

              {sessionSuccess && <div className="alert alert-ok">✓ {sessionSuccess}</div>}
              {sessionError && <div className="alert alert-err">⚠ {sessionError}</div>}

              {showSessionForm && (
                <div style={{ padding: "1.5rem", backgroundColor: "rgba(245,244,240,0.5)", border: "0.5px solid var(--line)", borderRadius: "6px", marginBottom: "1.5rem" }}>
                  <h3 style={{ marginBottom: "1rem", fontSize: "14px", fontWeight: 500 }}>Formulaire de création</h3>
                  <form onSubmit={handleCreateSession}>
                    <div className="form-row-grid">
                      <div className="form-group">
                        <label className="form-label">Formation *</label>
                        <select className="form-input" value={sessionFormData.formationId} onChange={e => setSessionFormData({...sessionFormData, formationId: e.target.value})} required>
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
                      <input type="text" className="form-input" value={sessionFormData.location} onChange={e => setSessionFormData({...sessionFormData, location: e.target.value})} placeholder="Dakar, N'djamena, etc." required/>
                    </div>
                    <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                      <button type="submit" className="btn-primary-fill" disabled={submittingSession}>
                        {submittingSession ? "Création..." : "Créer la session"}
                      </button>
                      <button type="button" className="btn-cancel-fill" onClick={() => setShowSessionForm(false)} disabled={submittingSession}>
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <h3 style={{ fontSize: "13px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--steel)", marginTop: "2rem", marginBottom: "1rem" }}>Sessions existantes</h3>
              {(() => {
                if (loadingSessions) {
                  return <div className="empty"><div style={{ width:24,height:24,border:"1.5px solid rgba(30,64,175,0.15)",borderTopColor:"var(--blue)",borderRadius:"50%",animation:"spin 0.7s linear infinite" }}/></div>;
                }
                if (sessions.length === 0) {
                  return <div className="empty"><div className="empty-icon">📅</div><p className="empty-text">Aucune session créée</p></div>;
                }
                return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                      {sessions.map(session => {
                        const formation = formations.find(f => f.id === session.formationId);
                        return (
                                  <div key={session.id} className="content-card" onClick={() => setActionSheetSession(session)} style={{ padding: "1rem", border: "0.5px solid var(--line)", borderRadius: "6px", backgroundColor: "var(--white)" }}>
                            <div style={{ fontWeight: 500, marginBottom: "0.5rem" }}>{formation?.name || "Formation"}</div>
                            <div style={{ fontSize: "12px", color: "var(--steel)", marginBottom: "0.5rem" }}>
                              📍 {session.location}
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--steel)", marginBottom: "0.5rem" }}>
                              📅 {new Date(session.startDate).toLocaleDateString('fr-FR')} - {new Date(session.endDate).toLocaleDateString('fr-FR')}
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--steel)" }}>
                              Capacité: {session.available}/{session.capacity}
                            </div>
                            {session.status && (
                              <div style={{ fontSize: "11px", color: getSessionStatusColor(session.status), marginTop: "0.5rem", textTransform: "uppercase", fontWeight: 500 }}>
                                Status: {session.status}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>;
              })()}
            </>)}

          </div>
        </div>
      </div>

      {/* Bottom tab bar (mobile) */}
      <nav className="tab-bar">
        {([
          { id:"users", label:"Utilisateurs", icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
          { id:"articles", label:"Articles", icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
          { id:"brochures", label:"Brochures", icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> },
          { id:"inscriptions", label:"Inscriptions", icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="10.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M23 11h-6"/></svg> },
          { id:"sessions", label:"Sessions", icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
        ] as const).map(t => (
          <button key={t.id} className={`tab-btn${activeTab===t.id?" active":""}`} onClick={() => handleSetActiveTab(t.id)}>
            <div className="tab-active-line"/>
            {t.icon}
            {t.label}
          </button>
        ))}
      </nav>

      {/* User action sheet */}
      {actionSheetUser && (<>
        <div className="sheet-backdrop" onClick={() => setActionSheetUser(null)}/>
        <div className="sheet">
          <div className="sheet-handle"/>
          <div className="sheet-head">
            <div className="sheet-title">{actionSheetUser.firstName} {actionSheetUser.lastName}</div>
            <div className="sheet-sub">{actionSheetUser.email} · {new Date(actionSheetUser.createdAt).toLocaleDateString("fr-FR")}</div>
          </div>
          <div className="sheet-actions">
            <button className="sheet-btn primary" onClick={() => { setModalMode("edit"); setSelectedUser(actionSheetUser); setFormData({ email:actionSheetUser.email, firstName:actionSheetUser.firstName||"", lastName:actionSheetUser.lastName||"", password:"" }); setActionSheetUser(null); setShowModal(true); }}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Modifier le profil
            </button>
            <button className="sheet-btn orange-btn" onClick={() => handleToggleActive(actionSheetUser.id, actionSheetUser.active)}>
              {actionSheetUser.active
                ? <><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>Désactiver le compte</>
                : <><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><polyline points="20 6 9 17 4 12"/></svg>Activer le compte</>}
            </button>
            <div className="sheet-divider"/>
            <button className="sheet-btn danger" onClick={() => { if(confirm(`Supprimer ${actionSheetUser.firstName} ${actionSheetUser.lastName} ?`)) handleDeleteUser(actionSheetUser.id); }}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
              Supprimer l'utilisateur
            </button>
          </div>
          <button className="sheet-cancel" onClick={() => setActionSheetUser(null)}>Annuler</button>
        </div>
      </>)}

      {/* Article action sheet */}
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
            <button className="sheet-btn danger" onClick={() => { if(confirm("Supprimer cet article ?")) handleDeleteArticle(actionSheetArticle.id); }}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              Supprimer l'article
            </button>
          </div>
          <button className="sheet-cancel" onClick={() => setActionSheetArticle(null)}>Annuler</button>
        </div>
      </>)}

      {/* Brochure action sheet */}
      {actionSheetBrochure && (<>
        <div className="sheet-backdrop" onClick={() => setActionSheetBrochure(null)}/>
        <div className="sheet">
          <div className="sheet-handle"/>
          <div className="sheet-head">
            <div className="sheet-title">{actionSheetBrochure.name}</div>
            <div className="sheet-sub">{actionSheetBrochure.type||"PDF"} · {new Date(actionSheetBrochure.createdAt).toLocaleDateString("fr-FR")}</div>
          </div>
          <div className="sheet-actions">
            <a href={`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/brochures/${actionSheetBrochure.id}/download`} target="_blank" rel="noopener noreferrer" className="sheet-btn primary" style={{ textDecoration:"none" }}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Télécharger
            </a>
            {renderPublishBrochureButton(actionSheetBrochure.id, actionSheetBrochure.published)}
            <div className="sheet-divider"/>
            <button className="sheet-btn danger" onClick={() => { if(confirm("Supprimer cette brochure ?")) handleDeleteBrochure(actionSheetBrochure.id); }}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              Supprimer
            </button>
          </div>
          <button className="sheet-cancel" onClick={() => setActionSheetBrochure(null)}>Annuler</button>
        </div>
      </>)}

      {/* Inscription action sheet */}
      {actionSheetInscription && (<>
        <div className="sheet-backdrop" onClick={() => setActionSheetInscription(null)}/>
        <div className="sheet">
          <div className="sheet-handle"/>
          <div className="sheet-head">
            <div className="sheet-title">{actionSheetInscription.firstName} {actionSheetInscription.lastName}</div>
            <div className="sheet-sub">{actionSheetInscription.formation?.name} · {new Date(actionSheetInscription.createdAt).toLocaleDateString("fr-FR")}</div>
          </div>
          <div className="sheet-actions">
            <div style={{ padding:"0.75rem 0", fontSize:"12px", color:"var(--steel)", lineHeight:"1.6" }}>
              <div style={{ marginBottom:"0.4rem" }}><strong style={{ color:"var(--ink)" }}>Email:</strong> {actionSheetInscription.email}</div>
              <div style={{ marginBottom:"0.4rem" }}><strong style={{ color:"var(--ink)" }}>Téléphone:</strong> {actionSheetInscription.phone}</div>
              <div style={{ marginBottom:"0.4rem" }}><strong style={{ color:"var(--ink)" }}>Statut:</strong> <span style={{ textTransform:"capitalize" }}>{actionSheetInscription.status}</span></div>
              <div style={{ marginBottom:"0.4rem" }}><strong style={{ color:"var(--ink)" }}>Session:</strong> {actionSheetInscription.session?.location} - {new Date(actionSheetInscription.session?.startDate||"").toLocaleDateString("fr-FR")}</div>
            </div>
            <div className="sheet-divider"/>
            {actionSheetInscription.status!=="annule" && (
              <>
                {renderInscriptionActions(actionSheetInscription)}
              </>
            )}
            {(actionSheetInscription.status==="annule" || actionSheetInscription.status==="liste_attente" || actionSheetInscription.status==="demande_en_attente") && (
              <>
                <div className="sheet-divider"/>
                <button className="sheet-btn danger" onClick={() => { if(confirm('Supprimer cette inscription ?')) { handleDeleteInscription(actionSheetInscription.id); } }}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                  Supprimer
                </button>
              </>
            )}
          </div>
          <button className="sheet-cancel" onClick={() => setActionSheetInscription(null)}>Fermer</button>
        </div>
      </>)}

      {/* Session action sheet */}
      {actionSheetSession && (<>
        <div className="sheet-backdrop" onClick={() => setActionSheetSession(null)}/>
        <div className="sheet">
          <div className="sheet-handle"/>
          <div className="sheet-head">
            <div className="sheet-title">Session · {formations.find(f => f.id === actionSheetSession.formationId)?.name || 'Formation'}</div>
            <div className="sheet-sub">{new Date(actionSheetSession.startDate).toLocaleDateString('fr-FR')} · {actionSheetSession.location}</div>
          </div>
          <div className="sheet-actions">
            <div style={{ padding:"0.75rem 0", fontSize:"12px", color:"var(--steel)", lineHeight:"1.6" }}>
              <div style={{ marginBottom:"0.4rem" }}><strong style={{ color:"var(--ink)" }}>Capacité:</strong> {actionSheetSession.capacity}</div>
              <div style={{ marginBottom:"0.4rem" }}><strong style={{ color:"var(--ink)" }}>Disponible:</strong> {actionSheetSession.available}</div>
            </div>
            <div className="sheet-divider"/>
            <button className="sheet-btn danger" onClick={() => { if(confirm('Supprimer cette session ?')) { handleDeleteSession(actionSheetSession.id); } }}>
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
            <h2 className="modal-title">{modalMode==="add"?"Nouvel Utilisateur":"Éditer l'Utilisateur"}</h2>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={formData.email} onChange={e => setFormData({...formData,email:e.target.value})} disabled={modalMode==="edit"} placeholder="email@exemple.com"/>
            </div>
            <div className="form-group">
              <label className="form-label">Prénom</label>
              <input type="text" className="form-input" value={formData.firstName} onChange={e => setFormData({...formData,firstName:e.target.value})} placeholder="Prénom"/>
            </div>
            <div className="form-group">
              <label className="form-label">Nom</label>
              <input type="text" className="form-input" value={formData.lastName} onChange={e => setFormData({...formData,lastName:e.target.value})} placeholder="Nom de famille"/>
            </div>
            {modalMode==="add" && (
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