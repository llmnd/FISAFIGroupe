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
  active: boolean;
  createdAt: string;
}

interface AdminUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "user" | "admin";
  active: boolean;
  createdAt: string;
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

export default function AdminDashboard() {
  const router = useRouter();
  
  // Helper para construir URLs com backend
  const buildApiUrl = (endpoint: string) => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
    return backendUrl ? `${backendUrl}${endpoint}` : endpoint;
  };
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "articles" | "brochures">("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "admin" | "user">("all");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState({ email: "", firstName: "", lastName: "", password: "" });
  // Articles
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [articleFormData, setArticleFormData] = useState({
    title: '',
    category: 'Articles techniques',
    excerpt: '',
    content: '',
    image: '',
    author: '',
  });
  const [submittingArticle, setSubmittingArticle] = useState(false);
  const [articleError, setArticleError] = useState('');
  const [articleSuccess, setArticleSuccess] = useState('');
  // Brochures
  const [brochures, setBrochures] = useState<any[]>([]);
  const [loadingBrochures, setLoadingBrochures] = useState(false);
  const [showBrochureForm, setShowBrochureForm] = useState(false);
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [brochureFormData, setBrochureFormData] = useState({ name: '', description: '' });
  const [submittingBrochure, setSubmittingBrochure] = useState(false);
  const [brochureError, setBrochureError] = useState('');
  const [brochureSuccess, setBrochureSuccess] = useState('');

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    
    if (!token || !userData) {
      router.push("/login");
      return;
    }

    const user = JSON.parse(userData);
    if (user.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    setCurrentUser(user);
    fetchUsers();
    setLoading(false);
  }, [router]);

  // Charger les articles au changement d'onglet
  useEffect(() => {
    if (activeTab === "articles") {
      fetchArticles();
    }
    if (activeTab === "brochures") {
      fetchBrochures();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(buildApiUrl("/api/users"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const filteredUsers = users.filter((u: AdminUser) => {
    const matchesSearch = u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "all" || u.role === filterRole;
    const matchesActive = filterActive === "all" || (filterActive === "active" ? u.active : !u.active);
    return matchesSearch && matchesRole && matchesActive;
  });

  const handleAddUser = () => {
    setModalMode("add");
    setFormData({ email: "", firstName: "", lastName: "", password: "" });
    setSelectedUser(null);
    setShowModal(true);
  };

  const handleEditUser = (user: AdminUser) => {
    setModalMode("edit");
    setSelectedUser(user);
    setFormData({ email: user.email, firstName: user.firstName || "", lastName: user.lastName || "", password: "" });
    setShowModal(true);
  };

  const handleSaveUser = async () => {
    if (!formData.email || !formData.firstName || !formData.lastName) {
      alert("Veuillez remplir tous les champs requis");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const url = modalMode === "add" ? "/api/users" : `/api/users/${selectedUser?.id}`;
      const method = modalMode === "add" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchUsers();
        setShowModal(false);
        alert(modalMode === "add" ? "Utilisateur créé avec succès" : "Utilisateur mis à jour avec succès");
      } else {
        alert("Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("Error saving user:", error);
      alert("Erreur lors de la sauvegarde");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(buildApiUrl(`/api/users/${userId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        await fetchUsers();
        alert("Utilisateur supprimé avec succès");
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Erreur lors de la suppression");
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(buildApiUrl(`/api/users/${userId}/toggle-active`), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        await fetchUsers();
      } else {
        alert("Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Error toggling active:", error);
      alert("Erreur lors de la mise à jour");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  const fetchArticles = async () => {
    setLoadingArticles(true);
    try {
      const res = await fetch("/api/articles?limit=100");
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

  const handleSubmitArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setArticleError('');
    setArticleSuccess('');
    
    if (!articleFormData.title || !articleFormData.category || !articleFormData.excerpt || !articleFormData.content) {
      setArticleError('Tous les champs obligatoires doivent être remplis');
      return;
    }

    setSubmittingArticle(true);
    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...articleFormData,
          author: currentUser?.firstName + ' ' + currentUser?.lastName || 'Admin'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setArticleSuccess('Article créé avec succès!');
        setArticleFormData({
          title: '',
          category: 'Articles techniques',
          excerpt: '',
          content: '',
          image: '',
          author: '',
        });
        setShowArticleForm(false);
        await fetchArticles();
        setTimeout(() => setArticleSuccess(''), 3000);
      } else {
        const errorMsg = data.error || data.message || 'Erreur lors de la création';
        console.error('Article creation error:', { status: res.status, data });
        setArticleError(errorMsg);
      }
    } catch (err) {
      console.error('Article submission error:', err);
      setArticleError('Erreur lors de la création de l\'article: ' + (err as Error).message);
    } finally {
      setSubmittingArticle(false);
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
        setArticleSuccess(!currentPublished ? 'Article publié!' : 'Article dépublié');
        await fetchArticles();
        setTimeout(() => setArticleSuccess(''), 3000);
      } else {
        setArticleError('Erreur lors de la publication');
      }
    } catch (err) {
      setArticleError('Erreur lors de la publication');
      console.error(err);
    }
  };

  const handleDeleteArticle = async (articleId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet article?')) return;
    
    try {
      const res = await fetch(buildApiUrl(`/api/articles/${articleId}`), {
        method: "DELETE"
      });

      if (res.ok) {
        setArticleSuccess('Article supprimé');
        await fetchArticles();
        setTimeout(() => setArticleSuccess(''), 3000);
      } else {
        setArticleError('Erreur lors de la suppression');
      }
    } catch (err) {
      setArticleError('Erreur lors de la suppression');
      console.error(err);
    }
  };

  // Brochures Functions
  const fetchBrochures = async () => {
    setLoadingBrochures(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch('/api/brochures/manage', {
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBrochures(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching brochures:", err);
    } finally {
      setLoadingBrochures(false);
    }
  };

  const handleSubmitBrochure = async (e: React.FormEvent) => {
    e.preventDefault();
    setBrochureError('');
    setBrochureSuccess('');
    
    if (!brochureFormData.name || !brochureFile) {
      setBrochureError('Veuillez sélectionner un fichier et entrer un nom');
      return;
    }

    setSubmittingBrochure(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1];

        const res = await fetch('/api/brochures/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          },
          body: JSON.stringify({
            fileBuffer: base64Data,
            fileName: brochureFile.name,
            name: brochureFormData.name,
            description: brochureFormData.description,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          setBrochureSuccess('Brochure uploadée avec succès!');
          setBrochureFormData({ name: '', description: '' });
          setBrochureFile(null);
          setShowBrochureForm(false);
          await fetchBrochures();
          setTimeout(() => setBrochureSuccess(''), 3000);
        } else {
          setBrochureError(data.error || 'Erreur lors de l\'upload');
        }
        setSubmittingBrochure(false);
      };
      reader.readAsDataURL(brochureFile);
    } catch (err) {
      console.error('Brochure submission error:', err);
      setBrochureError('Erreur lors de l\'upload: ' + (err as Error).message);
      setSubmittingBrochure(false);
    }
  };

  const handlePublishBrochure = async (brochureId: string, currentPublished: boolean) => {
    try {
      const res = await fetch(buildApiUrl(`/api/brochures/${brochureId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !currentPublished }),
      });

      if (res.ok) {
        setBrochureSuccess(!currentPublished ? 'Brochure publiée!' : 'Brochure dépubliée');
        await fetchBrochures();
        setTimeout(() => setBrochureSuccess(''), 3000);
      } else {
        setBrochureError('Erreur lors de la publication');
      }
    } catch (err) {
      setBrochureError('Erreur lors de la publication');
      console.error(err);
    }
  };

  const handleDeleteBrochure = async (brochureId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette brochure?')) return;
    
    try {
      const res = await fetch(buildApiUrl(`/api/brochures/${brochureId}`), {
        method: 'DELETE',
      });

      if (res.ok) {
        setBrochureSuccess('Brochure supprimée');
        await fetchBrochures();
        setTimeout(() => setBrochureSuccess(''), 3000);
      } else {
        setBrochureError('Erreur lors de la suppression');
      }
    } catch (err) {
      setBrochureError('Erreur lors de la suppression');
      console.error(err);
    }
  };

  if (loading || !currentUser) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100svh", background: "#f5f4f0" }}>
        <div style={{ width: "32px", height: "32px", border: "2px solid rgba(30,64,175,0.10)", borderTopColor: "#1e40af", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      </div>
    );
  }

  const firstInitial = currentUser.firstName?.[0] ?? "";
  const lastInitial = currentUser.lastName?.[0] ?? "";
  const initials = (firstInitial + lastInitial).toUpperCase() || (currentUser.email?.[0] ?? "U").toUpperCase();

  return (
    <>
      <Head>
        <title>Admin Dashboard — FiSAFi Groupe</title>
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
            --success: #10b981;
            --danger: #ef4444;
          }
          body { font-family:'Outfit',sans-serif; font-weight:300; color:var(--ink); background:var(--mist); }
          @keyframes spin { to { transform:rotate(360deg); } }
          @keyframes slideIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }

          /* Layout */
          .admin-layout { display:flex; min-height:100svh; }
          .admin-overlay { display:none; position:fixed; inset:0; background:rgba(11,24,41,0.5); z-index:40; }
          .admin-overlay.open { display:block; }

          /* Sidebar */
          .admin-sidebar {
            position:fixed; top:0; left:0; bottom:0; width:240px;
            background:var(--blue-deep); color:#fff; z-index:50;
            display:flex; flex-direction:column;
            transform:translateX(-100%); transition:transform 0.28s cubic-bezier(.4,0,.2,1);
          }
          .admin-sidebar.open { transform:translateX(0); }
          @media(min-width:900px) {
            .admin-sidebar { transform:translateX(0); position:sticky; top:0; height:100svh; flex-shrink:0; }
            .admin-overlay { display:none !important; }
          }

          .sidebar-section { padding:1.5rem; border-bottom:0.5px solid rgba(255,255,255,0.08); }
          .sidebar-logo { font-family:'Cormorant Garamond',serif; font-size:20px; font-weight:300; letter-spacing:0.2em; text-transform:uppercase; color:#fff; }
          .sidebar-logo span { color:var(--orange); }
          .sidebar-badge { font-size:9px; letter-spacing:0.25em; text-transform:uppercase; color:var(--orange); margin-top:4px; }

          .sidebar-user { display:flex; align-items:center; gap:0.75rem; margin-bottom:1rem; }
          .sidebar-avatar { width:36px; height:36px; border-radius:50%; background:var(--orange); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:500; color:#fff; flex-shrink:0; }
          .sidebar-info { font-size:12px; color:#fff; }
          .sidebar-email { font-size:10px; color:rgba(255,255,255,0.4); margin-top:2px; }

          .sidebar-nav { flex:1; padding:1rem 0.75rem; overflow-y:auto; }
          .sidebar-link { display:block; padding:0.75rem 1rem; color:rgba(255,255,255,0.55); text-decoration:none; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; border-radius:3px; transition:background 0.15s, color 0.15s; margin-bottom:2px; }
          .sidebar-link:hover { background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.85); }
          .sidebar-link.active { background:rgba(255,255,255,0.12); color:#fff; }

          .sidebar-logout { padding:1rem 0.75rem; border-top:0.5px solid rgba(255,255,255,0.08); }
          .btn-logout { width:100%; padding:0.75rem 1rem; background:rgba(229,90,0,0.15); border:0.5px solid rgba(229,90,0,0.3); color:rgba(255,255,255,0.7); border-radius:3px; cursor:pointer; font-size:11px; letter-spacing:0.12em; text-transform:uppercase; font-family:'Outfit',sans-serif; transition:background 0.15s, color 0.15s; }
          .btn-logout:hover { background:rgba(229,90,0,0.3); color:#fff; }

          /* Topbar */
          .admin-topbar {
            position:sticky; top:0; z-index:30;
            display:flex; align-items:center; justify-content:space-between;
            padding:0 1rem; height:56px;
            background:rgba(245,244,240,0.95); backdrop-filter:blur(12px);
            border-bottom:0.5px solid var(--line);
          }
          @media(min-width:900px) { .admin-topbar { display:none; } }
          .topbar-logo { font-family:'Cormorant Garamond',serif; font-size:18px; font-weight:300; letter-spacing:0.15em; text-transform:uppercase; color:var(--blue); }
          .topbar-logo span { color:var(--orange); }
          .topbar-menu { background:none; border:none; cursor:pointer; width:24px; height:24px; display:flex; flex-direction:column; gap:5px; }
          .topbar-menu span { display:block; width:20px; height:1px; background:var(--ink); transition:transform 0.2s, opacity 0.2s; }
          .topbar-menu.open span:nth-child(1) { transform:translateY(6px) rotate(45deg); }
          .topbar-menu.open span:nth-child(2) { opacity:0; }
          .topbar-menu.open span:nth-child(3) { transform:translateY(-6px) rotate(-45deg); }

          /* Main */
          .admin-main { flex:1; display:flex; flex-direction:column; }
          @media(min-width:900px) { .admin-main { margin-left:240px; } }

          .admin-content { flex:1; padding:2rem 1rem; max-width:1200px; margin:0 auto; width:100%; }
          @media(min-width:600px) { .admin-content { padding:2.5rem 2rem; } }

          /* Header */
          .admin-header { margin-bottom:2.5rem; }
          .admin-eyebrow { font-size:9px; letter-spacing:0.3em; text-transform:uppercase; color:var(--orange); margin-bottom:0.5rem; display:flex; align-items:center; gap:0.5rem; }
          .admin-eyebrow::before { content:''; width:1.25rem; height:0.5px; background:var(--orange); }
          .admin-title { font-family:'Cormorant Garamond',serif; font-size:2.5rem; font-weight:300; color:var(--ink); line-height:1.1; margin-bottom:0.5rem; }
          .admin-subtitle { font-size:13px; color:var(--steel); }

          /* Toolbar */
          .admin-toolbar {
            display:grid; grid-template-columns:1fr; gap:1rem; margin-bottom:2rem;
          }
          @media(min-width:600px) { .admin-toolbar { grid-template-columns:1fr auto; } }

          .search-box {
            display:flex; align-items:center; gap:0.5rem;
            padding:0.65rem 1rem; background:var(--white); border:0.5px solid var(--line);
            border-radius:3px;
          }
          .search-box input { flex:1; background:none; border:none; font-family:'Outfit',sans-serif; font-size:13px; color:var(--ink); outline:none; }
          .search-box input::placeholder { color:var(--steel); }

          .filters { display:flex; gap:0.5rem; flex-wrap:wrap; }
          select {
            padding:0.65rem 0.85rem; background:var(--white); border:0.5px solid var(--line);
            border-radius:3px; font-family:'Outfit',sans-serif; font-size:12px; cursor:pointer;
            color:var(--ink); transition:border-color 0.2s;
          }
          select:hover { border-color:var(--blue); }
          select:focus { outline:none; border-color:var(--blue); }

          .btn-primary {
            padding:0.65rem 1.25rem; background:var(--blue); color:#fff; border:none;
            border-radius:3px; font-family:'Outfit',sans-serif; font-size:12px;
            letter-spacing:0.08em; text-transform:uppercase; cursor:pointer;
            transition:background 0.2s; font-weight:400;
          }
          .btn-primary:hover { background:var(--blue-deep); }

          /* Table */
          .table-wrap { background:var(--white); border:0.5px solid var(--line); border-radius:3px; overflow-x:auto; }
          table { width:100%; border-collapse:collapse; min-width:600px; }
          thead { background:rgba(30,64,175,0.03); }
          th { padding:1rem; text-align:left; font-size:10px; letter-spacing:0.15em; text-transform:uppercase; color:var(--steel); font-weight:400; border-bottom:0.5px solid var(--line); }
          td { padding:1rem; font-size:13px; color:var(--ink); border-bottom:0.5px solid var(--line); }
          tr:last-child td { border-bottom:none; }

          .badge {
            display:inline-block; padding:0.3rem 0.7rem;
            font-size:10px; letter-spacing:0.1em; text-transform:uppercase;
            border-radius:3px; font-weight:500;
          }
          .badge-admin { background:rgba(30,64,175,0.15); color:var(--blue); }
          .badge-user { background:rgba(122,142,168,0.15); color:var(--steel); }
          .badge-active { background:rgba(16,185,129,0.15); color:var(--success); }
          .badge-inactive { background:rgba(239,68,68,0.15); color:var(--danger); }

          .action-btns { display:flex; gap:0.5rem; }
          .btn-sm {
            padding:0.4rem 0.7rem; background:none; border:0.5px solid var(--line);
            border-radius:3px; font-size:10px; cursor:pointer; transition:background 0.2s, border-color 0.2s;
            font-family:'Outfit',sans-serif; color:var(--ink); text-transform:uppercase; letter-spacing:0.08em;
          }
          .btn-sm:hover { background:rgba(30,64,175,0.08); border-color:var(--blue); color:var(--blue); }
          .btn-sm.danger { border-color:var(--danger); color:var(--danger); }
          .btn-sm.danger:hover { background:rgba(239,68,68,0.08); }

          /* Modal */
          .modal-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:100; }
          .modal-overlay.show { display:flex; align-items:center; justify-content:center; }
          .modal {
            background:var(--white); border:0.5px solid var(--line); width:90%; max-width:500px;
            padding:2rem; border-radius:8px; animation:slideIn 0.3s ease-out;
          }
          .modal-header { margin-bottom:1.5rem; }
          .modal-title { font-family:'Cormorant Garamond',serif; font-size:1.75rem; font-weight:300; color:var(--ink); }
          .modal-body { margin-bottom:2rem; }
          .form-group { margin-bottom:1rem; }
          .form-label { display:block; font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:var(--steel); margin-bottom:0.4rem; }
          input { width:100%; padding:0.65rem 0.85rem; background:var(--white); border:0.5px solid var(--line); border-radius:3px; font-family:'Outfit',sans-serif; font-size:13px; color:var(--ink); transition:border-color 0.2s; }
          input:focus { outline:none; border-color:var(--blue); }
          .form-input { width:100%; padding:0.75rem 1rem; border:0.5px solid var(--line); background:var(--white); font-family:'Outfit',sans-serif; font-size:13px; color:var(--ink); border-radius:3px; transition:border-color 0.2s; }
          .form-input:focus { outline:none; border-color:var(--blue); box-shadow:0 0 0 3px rgba(30,64,175,0.1); }
          .form-select {
            width:100%; padding:0.65rem 0.85rem; background:var(--white); border:0.5px solid var(--line);
            border-radius:3px; font-family:'Outfit',sans-serif; font-size:13px; cursor:pointer;
            color:var(--ink); transition:border-color 0.2s;
          }
          .form-select:hover { border-color:var(--blue); }
          .form-select:focus { outline:none; border-color:var(--blue); }
          .modal-footer { display:flex; gap:1rem; justify-content:flex-end; }
          .btn-cancel { padding:0.65rem 1.25rem; background:none; border:0.5px solid var(--line); color:var(--ink); cursor:pointer; border-radius:3px; font-family:'Outfit',sans-serif; font-size:12px; transition:background 0.2s; text-transform:uppercase; letter-spacing:0.08em; }
          .btn-cancel:hover { background:rgba(30,64,175,0.04); }
          .btn-cancel:hover { background:rgba(30,64,175,0.04); }

          /* Empty state */
          .empty-state { padding:3rem 2rem; text-align:center; }
          .empty-icon { font-size:3rem; opacity:0.2; margin-bottom:1rem; }
          .empty-text { font-size:13px; color:var(--steel); }

          /* Tabs */
          .admin-tabs { display:flex; gap:1rem; margin-bottom:2rem; border-bottom:0.5px solid var(--line); }
          .admin-tab {
            padding:1rem 1.5rem; background:none; border:none; cursor:pointer;
            font-size:13px; letter-spacing:0.1em; text-transform:uppercase;
            color:var(--steel); border-bottom:2px solid transparent; transition:all 0.2s;
          }
          .admin-tab:hover { color:var(--ink); }
          .admin-tab.active { color:var(--blue); border-bottom-color:var(--blue); }

          /* Sidebar Tabs */
          .sidebar-link { display:block; padding:0.85rem 1rem; color:#fff; text-decoration:none; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; border-radius:3px; transition:all 0.2s; margin-bottom:0; background:transparent; border:none; border-left:3px solid transparent; cursor:pointer; text-align:left; width:100%; font-family:'Outfit',sans-serif; font-weight:400; }
          .sidebar-link:hover { background:rgba(255,255,255,0.08); color:#fff; }
          .sidebar-link.active { background:rgba(255,255,255,0.15); color:#fff; border-left-color:var(--orange); }

          /* Article Form */
          .article-form { background:var(--white); border:0.5px solid var(--line); padding:2rem; margin-bottom:2rem; }
          .form-group { margin-bottom:1.5rem; }
          .form-label { display:block; font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:var(--steel); margin-bottom:0.5rem; font-weight:500; }
          .form-textarea { width:100%; padding:0.75rem 1rem; border:0.5px solid var(--line); font-family:'Outfit',sans-serif; font-size:13px; color:var(--ink); min-height:120px; resize:vertical; }
          .form-textarea:focus { outline:none; border-color:var(--blue); }
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

          /* Alerts */
          .alert { padding:1rem; margin-bottom:1rem; border-radius:3px; font-size:13px; display:flex; align-items:flex-start; gap:0.75rem; }
          .alert-error { background:rgba(220,38,38,0.1); color:#991b1b; border:0.5px solid rgba(220,38,38,0.3); }
          .alert-success { background:rgba(34,197,94,0.1); color:#166534; border:0.5px solid rgba(34,197,94,0.3); }

          /* Article List */
          .article-item { background:var(--white); border:0.5px solid var(--line); padding:1.5rem; margin-bottom:1rem; display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; }
          .article-info { flex:1; }
          .article-title { font-family:'Cormorant Garamond',serif; font-size:1.1rem; color:var(--ink); margin-bottom:0.25rem; }
          .article-meta { font-size:10px; color:var(--steel); margin-bottom:0.5rem; display:flex; gap:1rem; flex-wrap:wrap; }
          .article-badge { display:inline-block; padding:0.2rem 0.6rem; font-size:9px; letter-spacing:0.1em; text-transform:uppercase; background:rgba(30,64,175,0.1); color:var(--blue); }
          .article-excerpt { font-size:12px; color:var(--steel); line-height:1.5; }
          .article-actions { display:flex; gap:0.5rem; flex-wrap:wrap; }
          .btn-publish {
            padding:0.5rem 1rem; font-size:10px; border:none; background:var(--orange); color:#fff;
            cursor:pointer; font-family:'Outfit',sans-serif; letter-spacing:0.1em; text-transform:uppercase; transition:background 0.2s;
          }
          .btn-publish:hover { background:var(--orange-light); }
        `}</style>
      </Head>

      {/* Overlay */}
      <div className={`admin-overlay${sidebarOpen ? " open" : ""}`} onClick={() => setSidebarOpen(false)} />

      <div className="admin-layout">
        {/* Sidebar */}
        <aside className={`admin-sidebar${sidebarOpen ? " open" : ""}`}>
          <div className="sidebar-section">
            <div className="sidebar-logo">Fi<span>SAFI</span></div>
            <div className="sidebar-badge">Admin Dashboard</div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-user">
              <div className="sidebar-avatar">{initials}</div>
              <div>
                <div className="sidebar-info">{currentUser.firstName} {currentUser.lastName}</div>
                <div className="sidebar-email">{currentUser.email}</div>
              </div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button
              onClick={() => { setActiveTab("users"); setSidebarOpen(false); }}
              className={`sidebar-link${activeTab === "users" ? " active" : ""}`}
            >
              Gestion Utilisateurs
            </button>
            <button
              onClick={() => { setActiveTab("articles"); setSidebarOpen(false); }}
              className={`sidebar-link${activeTab === "articles" ? " active" : ""}`}
            >
              Articles
            </button>
            <button
              onClick={() => { setActiveTab("brochures"); setSidebarOpen(false); }}
              className={`sidebar-link${activeTab === "brochures" ? " active" : ""}`}
            >
              Brochures
            </button>
            <a href="/dashboard" className="sidebar-link" style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "0.5px solid rgba(255,255,255,0.08)" }}>Retour Dashboard</a>
          </nav>

          <div className="sidebar-logout">
            <button className="btn-logout" onClick={handleLogout}>Déconnexion</button>
          </div>
        </aside>

        {/* Main */}
        <div className="admin-main">
          {/* Topbar */}
          <div className="admin-topbar">
            <div className="topbar-logo">Fi<span>SAFI</span></div>
            <button className={`topbar-menu${sidebarOpen ? " open" : ""}`} onClick={() => setSidebarOpen(!sidebarOpen)}>
              <span></span><span></span><span></span>
            </button>
          </div>

          {/* Content */}
          <div className="admin-content">
            {/* Users Tab */}
            {activeTab === "users" && (
              <>
                <div className="admin-header">
                  <div className="admin-eyebrow">Gestion</div>
                  <h1 className="admin-title">Utilisateurs</h1>
                  <p className="admin-subtitle">Gérez les utilisateurs et les droits d'accès</p>
                </div>

                {/* Toolbar */}
                <div className="admin-toolbar">
                  <div className="search-box">
                    <input
                      type="text"
                      placeholder="Chercher par email ou nom..."
                      value={searchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button className="btn-primary" onClick={handleAddUser}>Ajouter Utilisateur</button>
                </div>

                {/* Filters */}
                <div className="filters" style={{ marginBottom: "2rem" }}>
                  <select value={filterRole} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterRole((e.target.value as "all" | "admin" | "user"))}>
                    <option value="all">Tous les rôles</option>
                    <option value="user">Utilisateur</option>
                    <option value="admin">Admin</option>
                  </select>
                  <select value={filterActive} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterActive((e.target.value as "all" | "active" | "inactive"))}>
                    <option value="all">Tous les statuts</option>
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                  </select>
                </div>

                {/* Table */}
                {filteredUsers.length > 0 ? (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Nom</th>
                          <th>Email</th>
                          <th>Rôle</th>
                          <th>Statut</th>
                          <th>Créé le</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u: AdminUser) => (
                          <tr key={u.id}>
                            <td>{u.firstName} {u.lastName}</td>
                            <td>{u.email}</td>
                            <td><span className={`badge ${u.role === "admin" ? "badge-admin" : "badge-user"}`}>{u.role}</span></td>
                            <td><span className={`badge ${u.active ? "badge-active" : "badge-inactive"}`}>{u.active ? "Actif" : "Inactif"}</span></td>
                            <td>{new Date(u.createdAt).toLocaleDateString("fr-FR")}</td>
                            <td>
                              <div className="action-btns">
                                <button className="btn-sm" onClick={() => handleEditUser(u)}>Éditer</button>
                                <button className="btn-sm" onClick={() => handleToggleActive(u.id, u.active)}>
                                  {u.active ? "Désactiver" : "Activer"}
                                </button>
                                <button className="btn-sm danger" onClick={() => handleDeleteUser(u.id)}>Supprimer</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">—</div>
                    <p className="empty-text">Aucun utilisateur trouvé</p>
                  </div>
                )}
              </>
            )}

            {/* Articles Tab */}
            {activeTab === "articles" && (
              <>
                <div className="admin-header">
                  <div className="admin-eyebrow">Publications</div>
                  <h1 className="admin-title">Articles & Actualités</h1>
                  <p className="admin-subtitle">Gérez les articles et les publications</p>
                </div>

                {!showArticleForm && (
                  <button className="btn-primary" style={{ marginBottom: "2rem" }} onClick={() => { setShowArticleForm(true); setArticleError(''); setArticleSuccess(''); }}>
                    Nouvel article
                  </button>
                )}

                {/* Article Form */}
                {showArticleForm && (
                  <form className="article-form" onSubmit={handleSubmitArticle}>
                    {articleError && (
                      <div className="alert alert-error">
                        <span>⚠ {articleError}</span>
                      </div>
                    )}
                    {articleSuccess && (
                      <div className="alert alert-success">
                        <span>✓ {articleSuccess}</span>
                      </div>
                    )}

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Titre *</label>
                        <input
                          type="text"
                          className="form-input"
                          value={articleFormData.title}
                          onChange={(e) => setArticleFormData({...articleFormData, title: e.target.value})}
                          placeholder="Ex: Les tendances 2025 de l'IT"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Catégorie *</label>
                        <select
                          className="form-select"
                          value={articleFormData.category}
                          onChange={(e) => setArticleFormData({...articleFormData, category: e.target.value})}
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
                        className="form-textarea"
                        value={articleFormData.excerpt}
                        onChange={(e) => setArticleFormData({...articleFormData, excerpt: e.target.value})}
                        placeholder="Courte description qui apparaîtra en aperçu"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Contenu *</label>
                      <textarea
                        className="form-textarea"
                        value={articleFormData.content}
                        onChange={(e) => setArticleFormData({...articleFormData, content: e.target.value})}
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
                          className="form-input"
                          value={articleFormData.image}
                          onChange={(e) => setArticleFormData({...articleFormData, image: e.target.value})}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Auteur (optionnel)</label>
                        <input
                          type="text"
                          className="form-input"
                          value={articleFormData.author}
                          onChange={(e) => setArticleFormData({...articleFormData, author: e.target.value})}
                          placeholder="Votre nom"
                        />
                      </div>
                    </div>

                    <div className="form-buttons">
                      <button type="submit" className="btn-submit" disabled={submittingArticle}>
                        {submittingArticle ? "Création..." : "Créer l'article"}
                      </button>
                      <button
                        type="button"
                        className="btn-cancel"
                        onClick={() => setShowArticleForm(false)}
                        disabled={submittingArticle}
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                )}

                {/* Articles List */}
                {loadingArticles ? (
                  <div className="empty-state">
                    <div className="empty-icon">…</div>
                    <p className="empty-text">Chargement des articles...</p>
                  </div>
                ) : articles.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📝</div>
                    <p className="empty-text">Aucun article pour le moment</p>
                  </div>
                ) : (
                  <div>
                    <p className="admin-subtitle" style={{ marginBottom: "1.5rem" }}>
                      {articles.length} article{articles.length > 1 ? 's' : ''} créé{articles.length > 1 ? 's' : ''}
                    </p>
                    {articles.map(article => (
                      <div key={article.id} className="article-item">
                        <div className="article-info">
                          <div className="article-title">{article.title}</div>
                          <div className="article-meta">
                            <span className="article-badge">{article.category}</span>
                            <span>{new Date(article.createdAt).toLocaleDateString('fr-FR')}</span>
                            <span>{article.published ? '✓ Publié' : '✕ Non publié'}</span>
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
                              className="btn-sm"
                              onClick={() => handlePublishArticle(article.id, article.published)}
                              style={{ background: 'var(--steel)', color: '#fff', border: 'none' }}
                            >
                              Dépublier
                            </button>
                          )}
                          <button className="btn-sm danger" onClick={() => handleDeleteArticle(article.id)}>
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Brochures Tab */}
            {activeTab === "brochures" && (
              <>
                <div className="admin-header">
                  <div className="admin-eyebrow">Documents</div>
                  <h1 className="admin-title">Brochures</h1>
                  <p className="admin-subtitle">Gérez les brochures et documents téléchargeables</p>
                </div>

                {!showBrochureForm && (
                  <button className="btn-primary" style={{ marginBottom: "2rem" }} onClick={() => { setShowBrochureForm(true); setBrochureError(''); setBrochureSuccess(''); }}>
                    Uploader une brochure
                  </button>
                )}

                {/* Brochure Upload Form */}
                {showBrochureForm && (
                  <form className="article-form" onSubmit={handleSubmitBrochure}>
                    {brochureError && (
                      <div className="alert alert-error">
                        <span>⚠ {brochureError}</span>
                      </div>
                    )}
                    {brochureSuccess && (
                      <div className="alert alert-success">
                        <span>✓ {brochureSuccess}</span>
                      </div>
                    )}

                    <div className="form-group">
                      <label className="form-label">Nom de la brochure *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={brochureFormData.name}
                        onChange={(e) => setBrochureFormData({...brochureFormData, name: e.target.value})}
                        placeholder="Ex: Brochure Services 2025"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Description (optionnel)</label>
                      <textarea
                        className="form-textarea"
                        value={brochureFormData.description}
                        onChange={(e) => setBrochureFormData({...brochureFormData, description: e.target.value})}
                        placeholder="Description de la brochure"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Fichier PDF ou Image *</label>
                      <input
                        type="file"
                        className="form-input"
                        accept=".pdf,.png,.jpg,.jpeg,.gif"
                        onChange={(e) => setBrochureFile(e.target.files?.[0] || null)}
                        required
                      />
                      {brochureFile && (
                        <p style={{ fontSize: "12px", color: "var(--steel)", marginTop: "0.5rem" }}>
                          Fichier sélectionné: {brochureFile.name} ({(brochureFile.size / 1024 / 1024).toFixed(2)}MB)
                        </p>
                      )}
                    </div>

                    <div className="form-buttons">
                      <button type="submit" className="btn-submit" disabled={submittingBrochure}>
                        {submittingBrochure ? "Upload..." : "Uploader"}
                      </button>
                      <button
                        type="button"
                        className="btn-cancel"
                        onClick={() => setShowBrochureForm(false)}
                        disabled={submittingBrochure}
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                )}

                {/* Brochures List */}
                {loadingBrochures ? (
                  <div className="empty-state">
                    <div className="empty-icon">…</div>
                    <p className="empty-text">Chargement des brochures...</p>
                  </div>
                ) : brochures.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📄</div>
                    <p className="empty-text">Aucune brochure pour le moment</p>
                  </div>
                ) : (
                  <div>
                    <p className="admin-subtitle" style={{ marginBottom: "1.5rem" }}>
                      {brochures.length} brochure{brochures.length > 1 ? 's' : ''} uploadée{brochures.length > 1 ? 's' : ''}
                    </p>
                    {brochures.map(brochure => (
                      <div key={brochure.id} className="article-item">
                        <div className="article-info">
                          <div className="article-title">{brochure.name}</div>
                          <div className="article-meta">
                            <span className="article-badge">{brochure.type || 'PDF'}</span>
                            <span>{new Date(brochure.createdAt).toLocaleDateString('fr-FR')}</span>
                            <span>{brochure.published ? '✓ Publiée' : '✕ Non publiée'}</span>
                            {brochure.fileSize && <span>{(parseInt(brochure.fileSize, 10) / 1024 / 1024).toFixed(2)}MB</span>}
                          </div>
                          {brochure.description && (
                            <div className="article-excerpt">{brochure.description}</div>
                          )}
                        </div>
                        <div className="article-actions">
                          {!brochure.published && (
                            <button 
                              className="btn-publish"
                              onClick={() => handlePublishBrochure(brochure.id, brochure.published)}
                            >
                              Publier
                            </button>
                          )}
                          {brochure.published && (
                            <button 
                              className="btn-sm"
                              onClick={() => handlePublishBrochure(brochure.id, brochure.published)}
                              style={{ background: 'var(--steel)', color: '#fff', border: 'none' }}
                            >
                              Dépublier
                            </button>
                          )}
                          <a 
                            href={brochure.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn-sm"
                            style={{ background: 'var(--blue)', color: '#fff', border: 'none', textDecoration: 'none', display: 'inline-block' }}
                          >
                            Télécharger
                          </a>
                          <button className="btn-sm danger" onClick={() => handleDeleteBrochure(brochure.id)}>
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

      {/* Modal */}
      <div className={`modal-overlay${showModal ? " show" : ""}`} onClick={() => setShowModal(false)}>
        <div className="modal" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">{modalMode === "add" ? "Nouvel Utilisateur" : "Éditer l'Utilisateur"}</h2>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                disabled={modalMode === "edit"}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Prénom</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nom</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
            {modalMode === "add" && (
              <div className="form-group">
                <label className="form-label">Mot de passe</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn-cancel" onClick={() => setShowModal(false)}>Annuler</button>
            <button className="btn-primary" onClick={handleSaveUser}>Enregistrer</button>
          </div>
        </div>
      </div>
    </>
  );
}
