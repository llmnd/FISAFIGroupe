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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        router.push(user.role === "admin" ? "/admin-dashboard" : "/dashboard");
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      if (!response.ok) { setError(data.error || "Une erreur est survenue"); return; }
      if (data.data?.token) {
        localStorage.setItem("token", data.data.token);
        const userData = data.data.user || {};
        localStorage.setItem("user", JSON.stringify(userData));
        setSuccess("Connexion réussie !");
        setTimeout(() => router.push(userData.role === "admin" ? "/admin-dashboard" : "/dashboard"), 1200);
      }
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Head>
        <title>{isLogin ? "Connexion" : "Inscription"} — FiSAFi Groupe</title>
        <meta name="robots" content="noindex" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Outfit:wght@200;300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

          body { background: #0c1526; }

          .login-root {
            min-height: 100vh;
            display: grid;
            grid-template-columns: 1fr 1fr;
            font-family: 'Outfit', sans-serif;
          }

          /* ── LEFT PANEL ── */
          .left-panel {
            background: #0c1526;
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 3rem;
            overflow: hidden;
          }

          /* Animated geometric lines */
          .geo-lines {
            position: absolute;
            inset: 0;
            pointer-events: none;
          }
          .geo-line {
            position: absolute;
            background: linear-gradient(90deg, transparent, rgba(59,130,246,0.18), transparent);
            height: 1px;
            width: 120%;
            left: -10%;
            transform-origin: left center;
            animation: sweep 8s ease-in-out infinite;
          }
          .geo-line:nth-child(1) { top: 22%; animation-delay: 0s; }
          .geo-line:nth-child(2) { top: 45%; animation-delay: 2.5s; background: linear-gradient(90deg, transparent, rgba(147,197,253,0.12), transparent); }
          .geo-line:nth-child(3) { top: 68%; animation-delay: 5s; }
          @keyframes sweep {
            0%, 100% { opacity: 0; transform: scaleX(0.3) rotate(-1deg); }
            50% { opacity: 1; transform: scaleX(1) rotate(1deg); }
          }

          /* Corner grid */
          .geo-grid {
            position: absolute;
            bottom: 0; right: 0;
            width: 280px; height: 280px;
            background-image:
              linear-gradient(rgba(59,130,246,0.07) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59,130,246,0.07) 1px, transparent 1px);
            background-size: 40px 40px;
            mask-image: radial-gradient(ellipse at 100% 100%, black 30%, transparent 70%);
          }

          /* Glowing orb */
          .geo-orb {
            position: absolute;
            top: 30%; left: 20%;
            width: 300px; height: 300px;
            background: radial-gradient(circle, rgba(30,64,175,0.25) 0%, transparent 70%);
            border-radius: 50%;
            animation: pulse 6s ease-in-out infinite;
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.6; }
            50% { transform: scale(1.15); opacity: 1; }
          }

          .left-logo {
            font-family: 'Outfit', sans-serif;
            font-size: 1.25rem;
            font-weight: 300;
            color: #e2e8f0;
            letter-spacing: 0.04em;
            position: relative;
            z-index: 1;
          }
          .left-logo span { color: #60a5fa; font-weight: 500; }

          .left-center {
            position: relative;
            z-index: 1;
          }
          .left-tagline {
            font-family: 'Cormorant Garamond', serif;
            font-size: clamp(2.4rem, 4vw, 3.4rem);
            font-weight: 300;
            color: #f1f5f9;
            line-height: 1.15;
            letter-spacing: -0.01em;
          }
          .left-tagline em {
            font-style: italic;
            color: #93c5fd;
          }
          .left-sub {
            margin-top: 1.2rem;
            font-size: 0.78rem;
            font-weight: 300;
            color: #64748b;
            letter-spacing: 0.12em;
            text-transform: uppercase;
          }

          .left-bottom {
            position: relative;
            z-index: 1;
          }
          .left-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.4rem 0.9rem;
            border: 1px solid rgba(59,130,246,0.2);
            border-radius: 2rem;
            font-size: 0.7rem;
            color: #475569;
            letter-spacing: 0.1em;
            text-transform: uppercase;
          }
          .left-badge-dot {
            width: 5px; height: 5px;
            border-radius: 50%;
            background: #3b82f6;
            animation: blink 2s ease-in-out infinite;
          }
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }

          /* ── RIGHT PANEL ── */
          .right-panel {
            background: #f8fafc;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 3rem 4rem;
            position: relative;
          }

          /* Subtle top border accent */
          .right-panel::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 3px;
            background: linear-gradient(90deg, #1e40af, #3b82f6, #93c5fd);
          }

          .form-wrap {
            width: 100%;
            max-width: 380px;
            opacity: 0;
            transform: translateY(16px);
            transition: opacity 0.5s ease, transform 0.5s ease;
          }
          .form-wrap.visible {
            opacity: 1;
            transform: translateY(0);
          }

          .form-heading {
            font-family: 'Cormorant Garamond', serif;
            font-size: 2.2rem;
            font-weight: 300;
            color: #0f172a;
            letter-spacing: -0.01em;
            margin-bottom: 0.3rem;
          }
          .form-sub {
            font-size: 0.78rem;
            color: #94a3b8;
            letter-spacing: 0.06em;
            margin-bottom: 2.4rem;
          }

          /* Tabs */
          .tabs {
            display: flex;
            border-bottom: 1px solid #e2e8f0;
            margin-bottom: 2rem;
          }
          .tab-btn {
            flex: 1;
            padding: 0.6rem 0;
            background: none;
            border: none;
            border-bottom: 2px solid transparent;
            font-family: 'Outfit', sans-serif;
            font-size: 0.78rem;
            font-weight: 500;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #94a3b8;
            cursor: pointer;
            margin-bottom: -1px;
            transition: color 0.2s, border-color 0.2s;
          }
          .tab-btn.active {
            color: #1e40af;
            border-bottom-color: #1e40af;
          }

          /* Fields */
          .fields { display: grid; gap: 1.4rem; }
          .field { position: relative; }
          .field label {
            display: block;
            font-size: 0.68rem;
            font-weight: 500;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 0.5rem;
          }
          .field input {
            width: 100%;
            padding: 0.65rem 0;
            background: transparent;
            border: none;
            border-bottom: 1px solid #cbd5e1;
            font-family: 'Outfit', sans-serif;
            font-size: 0.95rem;
            color: #0f172a;
            outline: none;
            transition: border-color 0.2s;
          }
          .field input:focus { border-bottom-color: #1e40af; }
          .field input::placeholder { color: #cbd5e1; }

          /* Two-col for first/last name */
          .fields-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

          /* Alerts */
          .alert {
            padding: 0.7rem 1rem;
            border-radius: 4px;
            font-size: 0.8rem;
            margin-bottom: 0.5rem;
          }
          .alert-error { background: #fff1f2; color: #9f1239; border-left: 3px solid #f43f5e; }
          .alert-success { background: #f0fdf4; color: #166534; border-left: 3px solid #22c55e; }

          /* Submit */
          .submit-btn {
            margin-top: 0.8rem;
            width: 100%;
            padding: 0.9rem;
            background: #1e40af;
            color: white;
            border: none;
            font-family: 'Outfit', sans-serif;
            font-size: 0.78rem;
            font-weight: 500;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            cursor: pointer;
            position: relative;
            overflow: hidden;
            transition: background 0.2s, transform 0.15s;
          }
          .submit-btn:hover:not(:disabled) { background: #1d3a9e; transform: translateY(-1px); }
          .submit-btn:disabled { background: #94a3b8; cursor: not-allowed; }
          .submit-btn::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%);
            transform: translateX(-100%);
            transition: transform 0.4s;
          }
          .submit-btn:hover::after { transform: translateX(100%); }

          .form-footer {
            margin-top: 1.6rem;
            text-align: center;
            font-size: 0.78rem;
            color: #94a3b8;
          }
          .form-footer button {
            background: none;
            border: none;
            color: #1e40af;
            font-family: 'Outfit', sans-serif;
            font-size: 0.78rem;
            font-weight: 600;
            cursor: pointer;
            padding: 0;
          }
          .back-link {
            display: block;
            margin-top: 2.5rem;
            text-align: center;
            font-size: 0.72rem;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #94a3b8;
            text-decoration: none;
            transition: color 0.2s;
          }
          .back-link:hover { color: #1e40af; }

          /* Mobile */
          @media (max-width: 768px) {
            .login-root { grid-template-columns: 1fr; }
            .left-panel { display: none; }
            .right-panel { padding: 2.5rem 1.8rem; min-height: 100vh; }
            .right-panel::before { display: none; }
            .right-panel::after {
              content: 'FiSAFI Groupe';
              position: absolute;
              top: 2rem; left: 1.8rem;
              font-family: 'Outfit', sans-serif;
              font-size: 1.1rem;
              font-weight: 300;
              color: #1e40af;
              letter-spacing: 0.04em;
            }
          }
        `}</style>
      </Head>

      <div className="login-root">

        {/* ── LEFT ── */}
        <div className="left-panel">
          <div className="geo-lines">
            <div className="geo-line" />
            <div className="geo-line" />
            <div className="geo-line" />
          </div>
          <div className="geo-grid" />
          <div className="geo-orb" />

          <div className="left-logo">Fi<span>SAFI</span> Groupe</div>

          <div className="left-center">
            <div className="left-tagline">
              L&apos;expertise<br />qui fait<br /><em>la différence</em>
            </div>
            <div className="left-sub">Ingénierie & Conseil Technologique</div>
          </div>

          <div className="left-bottom">
            <div className="left-badge">
              <div className="left-badge-dot" />
              Dakar · Sénégal
            </div>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="right-panel">
          <div className={`form-wrap${mounted ? " visible" : ""}`}>

            <div className="form-heading">
              {isLogin ? "Bon retour." : "Créer un compte."}
            </div>
            <div className="form-sub">
              {isLogin ? "Connectez-vous à votre espace FISAFI" : "Rejoignez la plateforme FISAFI Groupe"}
            </div>

            {/* Tabs */}
            <div className="tabs">
              <button className={`tab-btn${isLogin ? " active" : ""}`} onClick={() => { setIsLogin(true); setError(null); }}>
                Connexion
              </button>
              <button className={`tab-btn${!isLogin ? " active" : ""}`} onClick={() => { setIsLogin(false); setError(null); }}>
                Inscription
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="fields">
                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                {!isLogin && (
                  <div className="fields-row">
                    <div className="field">
                      <label>Prénom</label>
                      <input
                        type="text" name="firstName" value={formData.firstName}
                        onChange={handleChange} required={!isLogin} placeholder="Moussa"
                      />
                    </div>
                    <div className="field">
                      <label>Nom</label>
                      <input
                        type="text" name="lastName" value={formData.lastName}
                        onChange={handleChange} required={!isLogin} placeholder="Diallo"
                      />
                    </div>
                  </div>
                )}

                <div className="field">
                  <label>Adresse email</label>
                  <input
                    type="email" name="email" value={formData.email}
                    onChange={handleChange} required placeholder="vous@exemple.com"
                  />
                </div>

                <div className="field">
                  <label>Mot de passe</label>
                  <input
                    type="password" name="password" value={formData.password}
                    onChange={handleChange} required placeholder="••••••••" minLength={6}
                  />
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? "Chargement…" : isLogin ? "Se connecter" : "Créer mon compte"}
                </button>
              </div>
            </form>

            <div className="form-footer">
              {isLogin ? "Pas encore de compte ? " : "Déjà inscrit ? "}
              <button onClick={() => { setIsLogin(!isLogin); setError(null); }}>
                {isLogin ? "S'inscrire" : "Se connecter"}
              </button>
            </div>

            <a href="/" className="back-link">← Retour à l'accueil</a>
          </div>
        </div>

      </div>
    </div>
  );
}