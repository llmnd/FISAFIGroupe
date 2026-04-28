"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Image from "next/image"; // ← ajouté pour le logo image

const LOGIN_CSS = `
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { margin: 0; padding: 0; height: 100%; }

  :root {
    --ink: #0b1829;
    --blue: #1e40af;
    --blue-deep: #0f2470;
    --orange: #e55a00;
    --gold: #c9a84c;
    --mist: #f5f4f0;
    --steel: #7a8ea8;
  }

  .lw {
    display: grid;
    grid-template-columns: 1fr 1fr;
    min-height: 100dvh;
    font-family: 'DM Sans', sans-serif;
  }

  .l-left {
    position: relative;
    background: #060e1e;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 2.75rem 3rem;
    overflow: hidden;
  }
  .l-canvas { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0.8; }
  .l-left-grad {
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 70% 55% at 15% 20%, rgba(30,64,175,0.22) 0%, transparent 60%),
      radial-gradient(ellipse 55% 45% at 85% 80%, rgba(229,90,0,0.13) 0%, transparent 55%),
      linear-gradient(160deg, rgba(6,14,30,0.5) 0%, rgba(6,14,30,0.0) 100%);
    pointer-events: none; z-index: 1;
  }
  .l-rule {
    position: absolute; top: 0; left: 42%; width: 0.5px; height: 100%;
    background: linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.04) 30%, rgba(255,255,255,0.04) 70%, transparent 100%);
    z-index: 1; transform: skewX(-4deg);
  }
  .l-accent-bar {
    position: absolute; top: 0; left: 3rem;
    width: 2px; height: 5.5rem;
    background: linear-gradient(180deg, var(--orange) 0%, transparent 100%);
    z-index: 2;
  }
  .l-top, .l-mid, .l-bottom { position: relative; z-index: 3; }

  /* ── Logo image (remplace le texte) ── */
  .l-logo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    transition: opacity 0.2s;
    width: 96px;
    height: 96px;
    border-radius: 50%;
    overflow: hidden;
  }
  .l-logo:hover { opacity: 0.82; }
  .l-logo img { display: block; width: 100%; height: 100%; object-fit: cover; }

  /* Mobile logo (hidden by default, shown on small screens) */
  .l-mobile-logo { display: none; }
  .l-mobile-logo img { display: block; width: 100%; height: 100%; object-fit: cover; }

  .l-mid { padding-bottom: 2rem; }
  .l-eyebrow {
    font-size: 8.5px; letter-spacing: 0.38em; text-transform: uppercase;
    color: rgba(229,115,60,0.75);
    display: flex; align-items: center; gap: 0.75rem;
    margin-bottom: 1.75rem; animation: fadeUp 0.9s 0.2s both;
  }
  .l-eyebrow::before { content: ''; width: 1.75rem; height: 0.5px; background: rgba(229,115,60,0.6); flex-shrink: 0; }
  .l-headline {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(2.6rem, 4.5vw, 3.8rem);
    font-weight: 300; line-height: 1.08; color: #fff;
    letter-spacing: -0.01em; margin-bottom: 1.5rem;
    animation: fadeUp 0.9s 0.35s both;
  }
  .l-headline em { font-style: italic; color: rgba(255,255,255,0.38); }
  .l-body { font-size: 12.5px; line-height: 1.9; color: rgba(255,255,255,0.38); font-weight: 300; max-width: 30ch; animation: fadeUp 0.9s 0.5s both; }
  .l-stats { display: flex; gap: 1rem; margin-top: 2.5rem; animation: fadeUp 0.9s 0.65s both; }
  .l-stat { border: 0.5px solid rgba(255,255,255,0.1); padding: 0.6rem 1rem; backdrop-filter: blur(8px); background: rgba(255,255,255,0.03); }
  .l-stat-num { font-family: 'Cormorant Garamond', serif; font-size: 1.4rem; color: rgba(255,255,255,0.85); font-weight: 300; line-height: 1; margin-bottom: 4px; }
  .l-stat-label { font-size: 8.5px; letter-spacing: 0.22em; text-transform: uppercase; color: rgba(255,255,255,0.3); }
  .l-sig { display: flex; align-items: center; justify-content: space-between; border-top: 0.5px solid rgba(255,255,255,0.07); padding-top: 1.25rem; animation: fadeUp 0.9s 0.8s both; }
  .l-sig-inner { display: flex; align-items: center; gap: 0.85rem; }
  .l-sig-av { width: 36px; height: 36px; border-radius: 50%; border: 1px solid rgba(229,90,0,0.45); background: rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; font-size: 13px; color: rgba(255,255,255,0.5); flex-shrink: 0; }
  .l-sig-name { font-size: 11px; color: rgba(255,255,255,0.75); font-weight: 400; letter-spacing: 0.03em; }
  .l-sig-role { font-size: 8px; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.3); margin-top: 2px; }
  .l-sig-ping { display: flex; align-items: center; gap: 0.45rem; }
  .l-sig-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--orange); opacity: 0.7; animation: ping 2.5s ease-in-out infinite; }
  .l-sig-city { font-family: 'Cormorant Garamond', serif; font-size: 11.5px; font-style: italic; color: rgba(255,255,255,0.35); }

  .l-right {
    background: #fafaf8;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 3rem 3.5rem; position: relative; overflow: hidden;
  }
  .l-right::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent 0%, var(--orange) 30%, var(--blue) 70%, transparent 100%);
  }
  .l-right::after {
    content: ''; position: absolute; inset: 0;
    background-image: linear-gradient(rgba(30,64,175,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(30,64,175,0.025) 1px, transparent 1px);
    background-size: 40px 40px; pointer-events: none;
  }
  .l-form-wrap { width: 100%; max-width: 370px; position: relative; z-index: 1; animation: fadeUp 0.65s 0.1s both; }
  .l-mode-pill { display: inline-flex; border: 0.5px solid rgba(30,64,175,0.18); border-radius: 0; overflow: hidden; margin-bottom: 2rem; }
  .l-pill-btn { padding: 0.45rem 1.25rem; font-family: 'DM Sans', sans-serif; font-size: 9.5px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; background: transparent; border: none; color: rgba(11,24,41,0.38); cursor: pointer; transition: background 0.2s ease, color 0.2s ease; }
  .l-pill-btn.active { background: var(--ink); color: #fff; }
  .l-pill-btn:not(.active):hover { color: var(--ink); background: rgba(30,64,175,0.04); }
  .l-form-h { font-family: 'Cormorant Garamond', serif; font-size: 2.5rem; font-weight: 300; color: var(--ink); letter-spacing: -0.015em; line-height: 1.1; margin-bottom: 0.4rem; }
  .l-form-h em { font-style: italic; color: var(--orange); }
  .l-form-sub { font-size: 11.5px; color: var(--steel); font-weight: 300; letter-spacing: 0.02em; margin-bottom: 2.25rem; line-height: 1.5; }
  .l-fields { display: flex; flex-direction: column; gap: 0; }
  .l-field { position: relative; padding-top: 1rem; border-bottom: 1px solid rgba(11,24,41,0.1); transition: border-color 0.22s; margin-bottom: 0.2rem; }
  .l-field.focused { border-color: var(--blue); }
  .l-field label { position: absolute; left: 0; top: 1.5rem; font-size: 13px; color: rgba(11,24,41,0.38); font-weight: 300; pointer-events: none; transition: transform 0.2s cubic-bezier(0.4,0,0.2,1), color 0.2s cubic-bezier(0.4,0,0.2,1); }
  .l-field.focused label, .l-field.filled label { top: 0.15rem; font-size: 8.5px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--blue); font-weight: 500; }
  .l-field input { width: 100%; padding: 0.5rem 0 0.65rem; background: transparent; border: none; outline: none; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 400; color: var(--ink); }
  .l-field input::placeholder { color: transparent; }
  .l-field-line { position: absolute; bottom: -1px; left: 0; height: 2px; background: var(--blue); width: 0; transition: width 0.3s cubic-bezier(0.4,0,0.2,1); }
  .l-field.focused .l-field-line { width: 100%; }
  .l-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
  .l-alert { display: flex; align-items: flex-start; gap: 0.6rem; padding: 0.75rem 0.9rem; font-size: 11.5px; line-height: 1.5; margin-bottom: 0.75rem; font-weight: 400; }
  .l-alert-err { background: #fff1f2; border-left: 2px solid #f43f5e; color: #9f1239; }
  .l-alert-ok  { background: #f0fdf4; border-left: 2px solid #22c55e; color: #166534; }
  .l-alert-icon { flex-shrink: 0; margin-top: 1px; font-size: 13px; }
  .l-btn { width: 100%; margin-top: 2rem; padding: 1rem; background: var(--ink); color: #fff; border: none; font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500; letter-spacing: 0.2em; text-transform: uppercase; cursor: pointer; position: relative; overflow: hidden; transition: background 0.25s; }
  .l-btn::before { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, var(--orange), #1e40af); opacity: 0; transition: opacity 0.3s; }
  .l-btn:hover:not(:disabled)::before { opacity: 1; }
  .l-btn span { position: relative; z-index: 1; }
  .l-btn:disabled { background: #94a3b8; cursor: not-allowed; }
  .l-btn:disabled::before { display: none; }
  .l-spinner { display: inline-block; width: 12px; height: 12px; border: 1.5px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; margin-right: 0.5rem; vertical-align: middle; position: relative; z-index: 1; }
  .l-foot { display: flex; align-items: center; justify-content: center; gap: 0.4rem; margin-top: 1.75rem; font-size: 11.5px; color: rgba(11,24,41,0.4); }
  .l-foot button { background: none; border: none; font-family: 'DM Sans', sans-serif; font-size: 11.5px; font-weight: 500; color: var(--blue); cursor: pointer; padding: 0; border-bottom: 1px solid transparent; transition: border-color 0.2s; }
  .l-foot button:hover { border-bottom-color: var(--blue); }
  .l-back { display: block; text-align: center; margin-top: 2.25rem; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(11,24,41,0.28); text-decoration: none; transition: color 0.2s; }
  .l-back:hover { color: var(--ink); }
  .l-back::before { content: '← '; }
  .l-divider { display: flex; align-items: center; gap: 0.75rem; margin: 0.25rem 0 0.5rem; }
  .l-divider span { flex: 1; height: 0.5px; background: rgba(11,24,41,0.08); }
  .l-divider small { font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(11,24,41,0.25); }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin   { to { transform: rotate(360deg); } }
  @keyframes ping   { 0%, 100% { opacity: 0.35; transform: scale(1); } 50% { opacity: 0.9; transform: scale(1.35); } }

  @media (max-width: 768px) {
    .lw { grid-template-columns: 1fr; }
    .l-left { display: none; }
    .l-right { min-height: 100dvh; padding: 5rem 1.75rem 3rem; justify-content: flex-start; }
    /* hide the text pseudo-element on mobile; show circular logo instead */
    .l-form-wrap::before { display: none; }
    .l-mobile-logo { display: flex; justify-content: center; margin: -4rem auto 0.70rem; width: 72px; height: 72px; border-radius: 50%; overflow: hidden; border: 1px solid var(--orange); background: #fff; }
    .l-mobile-logo img { width: 100%; height: 100%; object-fit: cover; }
  }
`;

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: "", password: "", firstName: "", lastName: "" });
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [success,      setSuccess]      = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animId: number;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);
    const nodes: { x: number; y: number; vx: number; vy: number; r: number }[] = Array.from({ length: 38 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.5 + 0.5,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes.forEach((n) => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width)  n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(147,197,253,0.35)"; ctx.fill();
      });
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(96,165,250,${0.12 * (1 - dist / 110)})`; ctx.lineWidth = 0.6; ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null); setSuccess(null);
    try {
      const endpoint   = isLogin ? "/api/auth/login" : "/api/auth/register";
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!backendUrl) throw new Error("Backend URL not configured. Contact admin.");
      const payload = isLogin ? { email: formData.email, password: formData.password } : formData;
      const response = await fetch(`${backendUrl}${endpoint}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
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
    } catch { setError("Erreur de connexion au serveur"); }
    finally  { setLoading(false); }
  };

  const switchMode = (login: boolean) => { setIsLogin(login); setError(null); setSuccess(null); };

  return (
    <div className="lw">
      <Head>
        <title>{isLogin ? "Connexion" : "Inscription"} — FiSAFi Groupe</title>
        <meta name="robots" content="noindex" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@200;300;400;500&display=swap"
          rel="stylesheet"
        />
      </Head>

      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: LOGIN_CSS }} />

      {/* LEFT PANEL */}
      <div className="l-left">
        <canvas ref={canvasRef} className="l-canvas" />
        <div className="l-left-grad" />
        <div className="l-rule" />
        <div className="l-accent-bar" />

        <div className="l-top">
          {/* ── Logo image (remplace "Fi SAFI Groupe" en texte) ── */}
          <a href="/" className="l-logo">
            <Image
              src="/favicon/web-app-manifest-192x192.png"
              alt="FiSAFi Groupe"
              width={140}
              height={60}
              priority
            />
          </a>
        </div>

        <div className="l-mid">
          <div className="l-eyebrow">Ingénierie &amp; Conseil</div>
          <h1 className="l-headline">
            L&apos;expertise<br />qui fait<br /><em>la différence</em>
          </h1>
          <p className="l-body">
            Plateforme sécurisée de gestion et de collaboration pour les équipes FiSAFi.
          </p>
          <div className="l-stats">
            <div className="l-stat"><div className="l-stat-num">1+</div><div className="l-stat-label">Années d&apos;expérience</div></div>
            <div className="l-stat"><div className="l-stat-num">10+</div><div className="l-stat-label">Projets livrés</div></div>
          </div>
        </div>

        <div className="l-bottom">
          <div className="l-sig">
            <div className="l-sig-inner">
              <div className="l-sig-av">⬡</div>
              <div>
                <div className="l-sig-name">Équipe FiSAFi</div>
                <div className="l-sig-role">Management &amp; Conseil</div>
              </div>
            </div>
            <div className="l-sig-ping">
              <div className="l-sig-dot" />
              <span className="l-sig-city">Dakar</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="l-right">
        <div className="l-form-wrap">
          {/* Mobile circular logo (visible on small screens) */}
          <div className="l-mobile-logo" aria-hidden="true">
            <Image src="/favicon/web-app-manifest-192x192.png" alt="FiSAFi Groupe" width={72} height={72} priority />
          </div>
          <div className="l-mode-pill">
            <button className={`l-pill-btn${isLogin ? " active" : ""}`}  onClick={() => switchMode(true)}>Connexion</button>
            <button className={`l-pill-btn${!isLogin ? " active" : ""}`} onClick={() => switchMode(false)}>Inscription</button>
          </div>

          <h2 className="l-form-h">{isLogin ? <>Bon <em>retour.</em></> : <>Créer un <em>compte.</em></>}</h2>
          <p className="l-form-sub">{isLogin ? "Connectez-vous à votre espace FISAFI" : "Rejoignez la plateforme FISAFI Groupe"}</p>

          <form onSubmit={handleSubmit}>
            <div className="l-fields">
              {error   && <div className="l-alert l-alert-err"><span className="l-alert-icon">⚠</span>{error}</div>}
              {success && <div className="l-alert l-alert-ok"><span className="l-alert-icon">✓</span>{success}</div>}

              {!isLogin && (
                <div className="l-row">
                  <FloatField id="firstName" label="Prénom"  type="text" name="firstName" value={formData.firstName} onChange={handleChange} required={!isLogin} focused={focusedField==="firstName"} onFocus={()=>setFocusedField("firstName")} onBlur={()=>setFocusedField(null)} />
                  <FloatField id="lastName"  label="Nom"     type="text" name="lastName"  value={formData.lastName}  onChange={handleChange} required={!isLogin} focused={focusedField==="lastName"}  onFocus={()=>setFocusedField("lastName")}  onBlur={()=>setFocusedField(null)} />
                </div>
              )}

              <FloatField id="email"    label="Adresse email" type="email"    name="email"    value={formData.email}    onChange={handleChange} required focused={focusedField==="email"}    onFocus={()=>setFocusedField("email")}    onBlur={()=>setFocusedField(null)} />
              <FloatField id="password" label="Mot de passe"  type="password" name="password" value={formData.password} onChange={handleChange} required focused={focusedField==="password"} onFocus={()=>setFocusedField("password")} onBlur={()=>setFocusedField(null)} />
            </div>

            <button type="submit" className="l-btn" disabled={loading}>
              {loading && <span className="l-spinner" />}
              <span>{loading ? "Chargement…" : isLogin ? "Se connecter" : "Créer mon compte"}</span>
            </button>
          </form>

          <div className="l-foot">
            {isLogin ? "Pas encore de compte ?" : "Déjà inscrit ?"}
            <button onClick={() => switchMode(!isLogin)}>{isLogin ? "S'inscrire" : "Se connecter"}</button>
          </div>

          <a href="/" className="l-back">Retour à l&apos;accueil</a>
        </div>
      </div>
    </div>
  );
}

function FloatField({ id, label, type, name, value, onChange, required, focused, onFocus, onBlur }: {
  id: string; label: string; type: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean; focused: boolean; onFocus: () => void; onBlur: () => void;
}) {
  const filled = value.length > 0;
  return (
    <div className={`l-field${focused ? " focused" : ""}${filled ? " filled" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id} type={type} name={name} value={value}
        onChange={onChange} onFocus={onFocus} onBlur={onBlur} required={required}
        autoComplete={type === "password" ? "current-password" : type === "email" ? "email" : "given-name"}
        placeholder={label}
      />
      <div className="l-field-line" />
    </div>
  );
}