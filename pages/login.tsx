"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        const redirectPath = user.role === "admin" ? "/admin-dashboard" : "/dashboard";
        router.push(redirectPath);
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
      const url = backendUrl ? `${backendUrl}${endpoint}` : endpoint;
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Une erreur est survenue");
        return;
      }

      // Save token and user data
      if (data.data?.token) {
        localStorage.setItem("token", data.data.token);
        // Extraire l'utilisateur avec son role
        const userData = data.data.user || {};
        localStorage.setItem("user", JSON.stringify(userData));
        setSuccess("Connexion réussie !");
        
        // Rediriger vers le bon dashboard selon le rôle
        const redirectPath = userData.role === "admin" ? "/admin-dashboard" : "/dashboard";
        setTimeout(() => router.push(redirectPath), 1500);
      }
    } catch (err) {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{isLogin ? "Connexion" : "Inscription"} — FiSAFi Groupe</title>
        <meta name="robots" content="noindex" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #1e40af 0%, #0f172a 100%)" }}>
        <div style={{ width: "100%", maxWidth: "400px", padding: "2rem", background: "white", borderRadius: "8px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#1e40af" }}>
              Fi<span style={{ color: "#0ea5e9" }}>SAFI</span> Groupe
            </div>
            <p style={{ color: "#666", marginTop: "0.5rem", fontSize: "14px" }}>Formations & Expertise</p>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
            <button
              onClick={() => setIsLogin(true)}
              style={{
                flex: 1,
                padding: "0.75rem",
                background: isLogin ? "#1e40af" : "#f0f0f0",
                color: isLogin ? "white" : "#666",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              Connexion
            </button>
            <button
              onClick={() => setIsLogin(false)}
              style={{
                flex: 1,
                padding: "0.75rem",
                background: !isLogin ? "#1e40af" : "#f0f0f0",
                color: !isLogin ? "white" : "#666",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              Inscription
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
            {error && (
              <div style={{ padding: "0.75rem", background: "#fee2e2", color: "#991b1b", borderRadius: "4px", fontSize: "14px" }}>
                ❌ {error}
              </div>
            )}

            {success && (
              <div style={{ padding: "0.75rem", background: "#dcfce7", color: "#166534", borderRadius: "4px", fontSize: "14px" }}>
                ✅ {success}
              </div>
            )}

            {!isLogin && (
              <>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "0.5rem" }}>
                    Prénom *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required={!isLogin}
                    placeholder="Jean"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "0.5rem" }}>
                    Nom *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required={!isLogin}
                    placeholder="Dupont"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </>
            )}

            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "0.5rem" }}>
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="vous@exemple.com"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "0.5rem" }}>
                Mot de passe *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                minLength={6}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "0.75rem",
                background: loading ? "#cbd5e1" : "#1e40af",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "14px",
              }}
            >
              {loading ? "Chargement..." : isLogin ? "Se connecter" : "S'inscrire"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: "12px", color: "#666", marginTop: "1rem" }}>
            {isLogin ? "Pas encore de compte ? " : "Vous avez un compte ? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              style={{
                background: "none",
                border: "none",
                color: "#1e40af",
                cursor: "pointer",
                textDecoration: "none",
                fontWeight: "600",
              }}
            >
              {isLogin ? "S'inscrire" : "Se connecter"}
            </button>
          </p>

          {/* Back to home */}
          <a
            href="/"
            style={{
              display: "block",
              textAlign: "center",
              marginTop: "2rem",
              color: "#1e40af",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            ← Retour à l'accueil
          </a>
        </div>
      </div>
    </>
  );
}
