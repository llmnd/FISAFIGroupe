"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "user" | "admin";
}

type TabId = "inscriptions" | "formations" | "inscriptions-manage" | "users" | "articles";

interface TabType {
  id: TabId;
  label: string;
  icon: string;
  admin?: boolean;
}

const ALL_TABS: TabType[] = [
  { id: "inscriptions",        label: "Mes inscriptions",       icon: "◈" },
  { id: "formations",          label: "Formations",             icon: "◉" },
  { id: "inscriptions-manage", label: "Gérer inscriptions",     icon: "◎", admin: true },
  { id: "users",               label: "Utilisateurs",           icon: "◇", admin: true },
  { id: "articles",            label: "Articles",               icon: "◆", admin: true },
];

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

export default function DashboardPage() {
  const router = useRouter();
  
  // Helper para construir URLs com backend
  const buildApiUrl = (endpoint: string) => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
    return backendUrl ? `${backendUrl}${endpoint}` : endpoint;
  };
  
  const [user, setUser]         = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("inscriptions");
  const [loading, setLoading]   = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
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
    }
  }, [activeTab, user]);

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

  return (
    <>
      <Head>
        <title>Dashboard — FiSAFi Groupe</title>
        <meta name="robots" content="noindex" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Outfit:wght@200;300;400;500&display=swap"
          rel="stylesheet"
        />
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
          body { font-family:'Outfit',sans-serif; font-weight:300; color:var(--ink); background:var(--mist); -webkit-font-smoothing:antialiased; }

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

          /* ── TOPBAR (mobile) ── */
          .dash-topbar {
            position:sticky; top:0; z-index:30;
            display:flex; align-items:center; justify-content:space-between;
            padding:0 1rem; height:56px;
            background:rgba(245,244,240,0.95); backdrop-filter:blur(12px);
            border-bottom:0.5px solid var(--line);
          }
          @media(min-width:900px) { .dash-topbar { display:none; } }
          .topbar-logo { font-family:'Cormorant Garamond',serif; font-size:18px; font-weight:300; letter-spacing:0.15em; text-transform:uppercase; color:var(--blue); }
          .topbar-logo span { color:var(--orange); }
          .topbar-hamburger { background:none; border:none; cursor:pointer; display:flex; flex-direction:column; gap:5px; padding:4px; }
          .topbar-hamburger span { display:block; width:20px; height:1px; background:var(--ink); transition:transform 0.2s, opacity 0.2s; }
          .topbar-hamburger.open span:nth-child(1) { transform:translateY(6px) rotate(45deg); }
          .topbar-hamburger.open span:nth-child(2) { opacity:0; }
          .topbar-hamburger.open span:nth-child(3) { transform:translateY(-6px) rotate(-45deg); }

          /* ── MAIN ── */
          .dash-main { flex:1; min-width:0; display:flex; flex-direction:column; }
          @media(min-width:900px) { .dash-main { margin-left:var(--sidebar-w); } }

          .dash-content { flex:1; padding:1.5rem 1rem 3rem; max-width:900px; }
          @media(min-width:600px) { .dash-content { padding:2rem 2rem 3rem; } }
          @media(min-width:900px) { .dash-content { padding:2.5rem 3rem 4rem; } }

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

          {/* Topbar mobile */}
          <div className="dash-topbar">
            <div className="topbar-logo">Fi<span>SAFI</span></div>
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
                <div className="empty-box">
                  <div className="empty-icon">◈</div>
                  <div className="empty-text">Aucune inscription pour le moment</div>
                </div>
              </>
            )}

            {/* ── Formations ── */}
            {activeTab === "formations" && (
              <>
                <div className="page-eyebrow">Catalogue</div>
                <h1 className="page-title">Formations disponibles</h1>
                <p className="page-sub">Choisissez votre parcours de formation</p>
                <div className="card-grid">
                  {[
                    { num:"01", name:"Administration Réseaux", desc:"Maîtrisez la conception et la gestion d'infrastructures réseaux d'entreprise." },
                    { num:"02", name:"Infrastructure IT", desc:"Déploiement, audit et maintenance de systèmes d'information performants." },
                    { num:"03", name:"Cybersécurité", desc:"Protection des données et mise en œuvre de solutions de cyberdéfense." },
                    { num:"04", name:"Certifications Pro", desc:"Préparez-vous aux certifications reconnues dans le domaine des télécoms." },
                  ].map(f => (
                    <div key={f.num} className="formation-card">
                      <div className="formation-num">{f.num}</div>
                      <div className="formation-name">{f.name}</div>
                      <div className="formation-desc">{f.desc}</div>
                      <button className="formation-btn">S&apos;inscrire</button>
                    </div>
                  ))}
                </div>
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
                      <tr>
                        <td colSpan={5} style={{ textAlign:"center", padding:"3rem", color:"var(--steel)" }}>
                          Aucune inscription
                        </td>
                      </tr>
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
    </>
  );
}