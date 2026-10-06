"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Image from "next/image"; // ← ajouté pour le logo image
import { ensureAuthSession } from "@/lib/clientAuthSession";

const LOGIN_CSS = `
  .lw, .lw *, .lw *::before, .lw *::after, .l-top-back {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  body:has(.lw) { padding-top: 0; }

  .lw, .l-top-back {
    --ink: #0b1829;
    --blue: #1e40af;
    --blue-deep: #0f2470;
    --orange: #e55a00;
    --gold: #c9a84c;
    --mist: #f5f4f0;
    --steel: #7a8ea8;
  }

  .lw {
    position: relative;
    display: grid;
    grid-template-columns: 1fr 1fr;
    min-height: 100vh;
    min-height: 100svh;
    font-family: 'Outfit', sans-serif;
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
    position: fixed;
    top: max(0.5rem, env(safe-area-inset-top));
    right: max(0.5rem, env(safe-area-inset-right));
    z-index: 10;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    transition: opacity 0.2s;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    overflow: hidden;
  }
  .l-logo:hover { opacity: 0.82; }
  .l-logo img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .l-mobile-logo { display: none; }
  .l-mobile-logo img { display: block; width: 100%; height: 100%; object-fit: cover; }

  .l-top { padding-top: 0.5rem; }
  .l-top-back {
    position: fixed; top: max(0.5rem, env(safe-area-inset-top)); left: max(0.5rem, env(safe-area-inset-left));
    z-index: 10; display: inline-flex; align-items: center; gap: 0.5rem;
    padding: 0.7rem 1rem; border: 1px solid rgba(11,24,41,0.15);
    background: rgba(250,250,248,0.94); color: var(--ink); box-shadow: 0 4px 16px rgba(11,24,41,0.12);
    font: 500 0.9rem/1 'Outfit', sans-serif; text-decoration: none;
    transition: background 0.2s, color 0.2s, border-color 0.2s;
  }
  .l-top-back:hover { background: var(--ink); border-color: var(--ink); color: #fff; }
  .l-top-back:focus-visible { outline: 3px solid rgba(30,64,175,0.4); outline-offset: 3px; }
  .l-top-back::before { content: '←'; }

  .l-mid { padding-bottom: 2rem; }
  .l-eyebrow {
    font-size: 0.75rem; letter-spacing: 0.3em; text-transform: uppercase;
    color: rgba(229,115,60,0.75);
    display: flex; align-items: center; gap: 0.75rem;
    margin-bottom: 1.75rem; animation: loginFadeUp 0.9s 0.2s both;
  }
  .l-eyebrow::before { content: ''; width: 1.75rem; height: 0.5px; background: rgba(229,115,60,0.6); flex-shrink: 0; }
  .l-headline {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(2.6rem, 4.5vw, 3.8rem);
    font-weight: 300; line-height: 1.08; color: #fff;
    letter-spacing: -0.01em; margin-bottom: 1.5rem;
    animation: loginFadeUp 0.9s 0.35s both;
  }
  .l-headline em { font-style: italic; color: rgba(255,255,255,0.38); }
  .l-body { font-size: 1rem; line-height: 1.8; color: rgba(255,255,255,0.55); font-weight: 300; max-width: 30ch; animation: loginFadeUp 0.9s 0.5s both; }
  .l-stats { display: flex; gap: 1rem; margin-top: 2.5rem; animation: loginFadeUp 0.9s 0.65s both; }
  .l-stat { border: 0.5px solid rgba(255,255,255,0.1); padding: 0.6rem 1rem; background: rgba(255,255,255,0.03); }
  @supports(backdrop-filter:blur(1px)){.l-stat{backdrop-filter:blur(8px);}}
  .l-stat-num { font-family: 'Cormorant Garamond', serif; font-size: 1.4rem; color: rgba(255,255,255,0.85); font-weight: 300; line-height: 1; margin-bottom: 4px; }
  .l-stat-label { font-size: 0.7rem; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.5); }
  .l-sig { display: flex; align-items: center; justify-content: space-between; border-top: 0.5px solid rgba(255,255,255,0.07); padding-top: 1.25rem; animation: loginFadeUp 0.9s 0.8s both; }
  .l-sig-inner { display: flex; align-items: center; gap: 0.85rem; }
  .l-sig-av { width: 36px; height: 36px; border-radius: 50%; border: 1px solid rgba(229,90,0,0.45); background: rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; font-size: 13px; color: rgba(255,255,255,0.5); flex-shrink: 0; }
  .l-sig-name { font-size: 0.9rem; color: rgba(255,255,255,0.85); font-weight: 400; letter-spacing: 0.03em; }
  .l-sig-role { font-size: 0.7rem; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.5); margin-top: 2px; }
  .l-sig-ping { display: flex; align-items: center; gap: 0.45rem; }
  .l-sig-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--orange); opacity: 0.7; animation: loginPing 2.5s ease-in-out infinite; }
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
  .l-form-wrap { width: 100%; max-width: 410px; position: relative; z-index: 1; animation: loginFadeUp 0.65s 0.1s both; }
  .l-mode-pill { display: inline-flex; padding: 4px; border: 1px solid rgba(30,64,175,0.12); border-radius: 999px; background: rgba(255,255,255,0.75); margin-bottom: 1.6rem; }
  .l-pill-btn { min-width: 118px; padding: 0.62rem 1.15rem; border-radius: 999px; font-family: 'Outfit', sans-serif; font-size: 0.8rem; font-weight: 500; letter-spacing: 0.07em; text-transform: uppercase; background: transparent; border: none; color: rgba(11,24,41,0.55); cursor: pointer; transition: background 0.2s ease, color 0.2s ease; }
  .l-pill-btn.active { background: var(--ink); color: #fff; box-shadow: 0 2px 6px rgba(11,24,41,0.14); }
  .l-pill-btn:not(.active):hover { color: var(--ink); background: rgba(30,64,175,0.04); }
  .l-pill-btn:focus-visible, .l-forgot button:focus-visible, .l-foot button:focus-visible { outline: 3px solid rgba(30,64,175,0.3); outline-offset: 3px; }
  .l-form-h { font-family: 'Cormorant Garamond', serif; font-size: clamp(2.6rem, 4.5vw, 3.35rem); font-weight: 300; color: var(--ink); letter-spacing: -0.015em; line-height: 1.05; margin-bottom: 0.55rem; }
  .l-form-h em { font-style: italic; color: var(--orange); }
  .l-form-sub { font-size: 0.96rem; color: var(--steel); font-weight: 300; letter-spacing: 0.01em; margin-bottom: 1.6rem; line-height: 1.6; }
  .l-fields { display: flex; flex-direction: column; gap: 0.3rem; }
  .l-field { position: relative; padding-top: 1rem; border-bottom: 1px solid rgba(11,24,41,0.1); transition: border-color 0.22s; margin-bottom: 0.35rem; }
  .l-field.focused { border-color: var(--blue); }
  .l-field label { position: absolute; left: 0; top: 1.5rem; font-size: 1rem; color: rgba(11,24,41,0.55); font-weight: 300; pointer-events: none; transition: transform 0.2s cubic-bezier(0.4,0,0.2,1), color 0.2s cubic-bezier(0.4,0,0.2,1); }
  .l-field.focused label, .l-field.filled label { top: 0.15rem; font-size: 0.7rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--blue); font-weight: 500; }
  .l-field input { width: 100%; padding: 0.5rem 0 0.65rem; background: transparent; border: none; outline: none; font-family: 'Outfit', sans-serif; font-size: 1rem; font-weight: 400; color: var(--ink); }
  .l-field input::placeholder { color: transparent; }
  .l-field-line { position: absolute; bottom: -1px; left: 0; height: 2px; background: var(--blue); width: 0; transition: width 0.3s cubic-bezier(0.4,0,0.2,1); }
  .l-field.focused .l-field-line { width: 100%; }
  .l-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .l-profile-fieldset { display: grid; gap: 0.55rem; margin: 0.6rem 0 0.9rem; padding: 0; border: 0; }
  .l-profile-fieldset legend { margin-bottom: 0.3rem; color: var(--ink); font-size: 0.88rem; font-weight: 500; }
  .l-profile-option { display: flex; align-items: flex-start; gap: 0.65rem; padding: 0.7rem 0.75rem; border: 1px solid rgba(11,24,41,0.12); border-radius: 5px; cursor: pointer; }
  .l-profile-option:has(input:checked) { border-color: rgba(30,64,175,0.55); background: rgba(30,64,175,0.04); }
  .l-profile-option input { flex: 0 0 auto; width: 16px; height: 16px; margin-top: 0.15rem; accent-color: var(--blue); }
  .l-profile-option span { display: grid; gap: 0.12rem; }
  .l-profile-option strong { color: var(--ink); font-size: 0.83rem; font-weight: 500; }
  .l-profile-option small, .l-profile-hint { color: rgba(11,24,41,0.58); font-size: 0.73rem; line-height: 1.4; }
  .l-profile-hint { padding-left: 0.1rem; }
  .l-alert { display: flex; align-items: flex-start; gap: 0.6rem; padding: 0.75rem 0.9rem; font-size: 0.9rem; line-height: 1.5; margin-bottom: 0.75rem; font-weight: 400; }
  .l-alert-err { background: #fff1f2; border-left: 2px solid #f43f5e; color: #9f1239; }
  .l-alert-ok  { background: #f0fdf4; border-left: 2px solid #22c55e; color: #166534; }
  .l-alert-icon { flex-shrink: 0; margin-top: 1px; font-size: 13px; }
  .l-btn { width: 100%; margin-top: 1.4rem; padding: 1rem; border-radius: 5px; background: var(--ink); color: #fff; border: none; font-family: 'Outfit', sans-serif; font-size: 0.9rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; position: relative; overflow: hidden; transition: background 0.25s; }
  .l-btn::before { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, var(--orange), #1e40af); opacity: 0; transition: opacity 0.3s; }
  .l-btn:hover:not(:disabled)::before { opacity: 1; }
  .l-btn span { position: relative; z-index: 1; }
  .l-btn:disabled { background: #94a3b8; cursor: not-allowed; }
  .l-btn:disabled::before { display: none; }
  .l-spinner { display: inline-block; width: 12px; height: 12px; border: 1.5px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: loginSpinner 0.7s linear infinite; margin-right: 0.5rem; vertical-align: middle; position: relative; z-index: 1; }
  .l-forgot { display: flex; justify-content: flex-end; margin-top: 0.7rem; }
  .l-forgot button { background: none; border: 0; color: var(--blue); cursor: pointer; font: inherit; font-size: 0.88rem; padding: 0.2rem 0; }
  .l-forgot button:hover, .l-foot button:hover { text-decoration: underline; text-underline-offset: 3px; }
  .l-foot { display: flex; align-items: center; justify-content: center; gap: 0.4rem; margin-top: 1.5rem; font-size: 0.9rem; color: rgba(11,24,41,0.65); }
  .l-foot button { background: none; border: none; font-family: 'Outfit', sans-serif; font-size: 0.9rem; font-weight: 500; color: var(--blue); cursor: pointer; padding: 0; border-bottom: 1px solid transparent; transition: border-color 0.2s; }
  .l-foot button:hover { border-bottom-color: var(--blue); }
  .l-divider { display: flex; align-items: center; gap: 0.75rem; margin: 0.25rem 0 0.5rem; }
  .l-divider span { flex: 1; height: 0.5px; background: rgba(11,24,41,0.08); }
  .l-divider small { font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(11,24,41,0.25); }

  @keyframes loginFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes loginSpinner { to { transform: rotate(360deg); } }
  @keyframes loginPing { 0%, 100% { opacity: 0.35; transform: scale(1); } 50% { opacity: 0.9; transform: scale(1.35); } }

  @media (max-width: 768px) {
    .lw { grid-template-columns: 1fr; }
    .l-left { display: none; }
    .l-right { min-height: 100vh; min-height: 100svh; padding: 7.5rem 1.5rem 2.5rem; justify-content: flex-start; }
    .l-form-wrap { animation: none; }
    .l-mobile-logo { display: flex; justify-content: center; margin: 0 auto 1rem; width: 64px; height: 64px; border-radius: 50%; overflow: hidden; border: 1px solid var(--orange); background: #fff; }
    .l-form-wrap::before { display: none; }
    .l-form-h { font-size: clamp(2.5rem, 10vw, 3.1rem); }
    .l-form-sub { margin-bottom: 1.25rem; }
    .l-row { gap: 0.75rem; }
  }

  @media (prefers-reduced-motion: reduce) {
    .lw *, .lw *::before, .lw *::after, .l-top-back {
      animation: none !important;
      scroll-behavior: auto !important;
      transition-duration: 0.01ms !important;
    }
  }

  @media (max-width: 380px) {
    .l-row { grid-template-columns: 1fr; gap: 0; }
    .l-mode-pill { display: flex; width: 100%; }
    .l-pill-btn { flex: 1; min-width: 0; padding-inline: 0.6rem; }
  }
`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export default function LoginPage() {
  const router = useRouter();
  const getPostLoginPath = (role?: string, employeeRole?: string | null) => {
    if (router.query.next === "/market/commande") return "/market/commande";
    if (router.query.next === "/market" && role !== "admin" && !employeeRole) return "/market";
    if (role === "admin") return "/admin-dashboard";
    if (employeeRole) return "/espace-employe";
    return "/";
  };
  const returnToMarket =
    router.query.next === "/market" || router.query.next === "/market/commande";
  const [isLogin, setIsLogin] = useState(true);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    profiles: [] as ("MARKET_CUSTOMER" | "TRAINING_PARTICIPANT")[],
  });
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [success,      setSuccess]      = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const redirectTimerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (redirectTimerRef.current !== null) {
      window.clearTimeout(redirectTimerRef.current);
    }
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    if (router.query.session === "expired") {
      setError("Votre session a expiré. Veuillez vous reconnecter.");
    } else if (router.query.passwordChanged === "1") {
      setSuccess("Votre mot de passe a été modifié. Connectez-vous avec votre nouveau mot de passe.");
    }
    void (async () => {
      try {
        if (!(await ensureAuthSession())) return;
        const response = await fetch("/api/auth/me");
        if ([401, 403, 404].includes(response.status)) return;
        if (!response.ok) {
          throw new Error(`Session check returned HTTP ${response.status}.`);
        }
        const payload: unknown = await response.json();
        if (!isRecord(payload) || !isRecord(payload.data) || typeof payload.data.role !== "string") {
          throw new Error("Session check returned invalid account data.");
        }
        localStorage.setItem("user", JSON.stringify(payload.data));
        await router.replace(getPostLoginPath(
          payload.data.role,
          "employeeRole" in payload.data && typeof payload.data.employeeRole === "string"
            ? payload.data.employeeRole
            : null,
        ));
      } catch (sessionError) {
        console.error("[Auth] Could not validate existing login:", sessionError);
        setError("Impossible de vérifier votre session. Réessayez ou reconnectez-vous.");
      }
    })();
  }, [router]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animId: number;
    let isRunning = false;
    const nodes: { x: number; y: number; vx: number; vy: number; r: number }[] = [];
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      if (nodes.length === 0) {
        nodes.push(...Array.from({ length: 38 }, () => ({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: Math.random() * 1.5 + 0.5,
        })));
      }
    };
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
      if (isRunning) animId = requestAnimationFrame(draw);
    };
    const syncAnimation = () => {
      const shouldAnimate =
        !window.matchMedia("(max-width: 768px), (prefers-reduced-motion: reduce)").matches &&
        document.visibilityState === "visible";
      if (!shouldAnimate) {
        isRunning = false;
        cancelAnimationFrame(animId);
        return;
      }
      resize();
      if (!isRunning) {
        isRunning = true;
        draw();
      }
    };
    window.addEventListener("resize", syncAnimation, { passive: true });
    document.addEventListener("visibilitychange", syncAnimation);
    syncAnimation();
    return () => {
      isRunning = false;
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", syncAnimation);
      document.removeEventListener("visibilitychange", syncAnimation);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const toggleProfile = (profile: "MARKET_CUSTOMER" | "TRAINING_PARTICIPANT") => {
    setFormData((previous) => ({
      ...previous,
      profiles: previous.profiles.includes(profile)
        ? previous.profiles.filter((item) => item !== profile)
        : [...previous.profiles, profile],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null); setSuccess(null);
    try {
      if (!isLogin && !forgotPassword && formData.profiles.length === 0) {
        setError("Choisissez au moins un module : e-commerce ou formation.");
        return;
      }
      if (forgotPassword) {
        const response = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email }),
        });
        const data: unknown = await response.json();
        if (!isRecord(data)) throw new Error("The password-reset response has an invalid format.");
        if (!response.ok) {
          setError(typeof data.error === "string" ? data.error : "Impossible de traiter la demande.");
          return;
        }
        setSuccess(
          typeof data.message === "string"
            ? data.message
            : "Si un compte correspond à cette adresse, un lien va être envoyé.",
        );
        return;
      }
      const endpoint   = isLogin ? "/api/auth/login" : "/api/auth/register";
      const payload = isLogin ? { email: formData.email, password: formData.password } : formData;
      const response = await fetch(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data: unknown = await response.json();
      if (!isRecord(data)) throw new Error("The authentication response has an invalid format.");
      if (!response.ok) {
        setError(typeof data.error === "string" ? data.error : "Une erreur est survenue.");
        return;
      }
      const userData = isRecord(data.data) ? data.data.user : null;
      if (!isRecord(userData) || typeof userData.role !== "string") {
        setError("Le serveur a renvoyé des informations de compte invalides.");
        return;
      }
      const role = userData.role;
      const employeeRole =
        typeof userData.employeeRole === "string" ? userData.employeeRole : null;
      localStorage.setItem("user", JSON.stringify(userData));
      setSuccess(isLogin ? "Connexion réussie !" : "Compte créé avec succès !");
      redirectTimerRef.current = window.setTimeout(
        () => void router.push(getPostLoginPath(role, employeeRole)),
        1200,
      );
    } catch (requestError) {
      console.error("[Auth] Authentication request failed:", requestError);
      setError("Erreur de connexion au serveur");
    }
    finally  { setLoading(false); }
  };

  const switchMode = (login: boolean) => {
    setIsLogin(login);
    setForgotPassword(false);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="lw">
      <a href={returnToMarket ? "/market" : "/"} className="l-top-back">Retour</a>
      <Head>
        <title>{forgotPassword ? "Mot de passe oublié" : isLogin ? "Connexion" : "Inscription"} — FiSAFi Groupe</title>
        <meta name="robots" content="noindex" />
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
          <a href="/" className="l-logo" aria-label="Accueil FiSAFi Groupe">
            <Image
              src="/favicon/web-app-manifest-192x192.png"
              alt=""
              width={96}
              height={96}
              loading="eager"
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
          <a href="/" className="l-mobile-logo" aria-label="Accueil FiSAFi Groupe">
            <Image
              src="/favicon/web-app-manifest-192x192.png"
              alt=""
              width={64}
              height={64}
              loading="eager"
            />
          </a>
          {!forgotPassword && (
            <div className="l-mode-pill" role="group" aria-label="Choisir le mode d’accès">
              <button type="button" className={`l-pill-btn${isLogin ? " active" : ""}`} aria-pressed={isLogin} onClick={() => switchMode(true)}>Connexion</button>
              <button type="button" className={`l-pill-btn${!isLogin ? " active" : ""}`} aria-pressed={!isLogin} onClick={() => switchMode(false)}>Inscription</button>
            </div>
          )}

          <h2 className="l-form-h">
            {forgotPassword ? <>Mot de passe <em>oublié ?</em></> : isLogin ? <>Bon <em>retour.</em></> : <>Créer un <em>compte.</em></>}
          </h2>
          <p className="l-form-sub">
            {forgotPassword
              ? "Indiquez l’adresse email de votre compte pour recevoir un lien de réinitialisation."
              : isLogin ? "Connectez-vous à votre espace FISAFI" : "Rejoignez la plateforme FISAFI Groupe"}
          </p>

          <form onSubmit={handleSubmit}>
            <div className="l-fields">
              {error   && <div className="l-alert l-alert-err"><span className="l-alert-icon">⚠</span>{error}</div>}
              {success && <div className="l-alert l-alert-ok"><span className="l-alert-icon">✓</span>{success}</div>}

              {!isLogin && !forgotPassword && (
                <div className="l-row">
                  <FloatField id="firstName" label="Prénom"  type="text" name="firstName" value={formData.firstName} onChange={handleChange} required={!isLogin} focused={focusedField==="firstName"} onFocus={()=>setFocusedField("firstName")} onBlur={()=>setFocusedField(null)} />
                  <FloatField id="lastName"  label="Nom"     type="text" name="lastName"  value={formData.lastName}  onChange={handleChange} required={!isLogin} focused={focusedField==="lastName"}  onFocus={()=>setFocusedField("lastName")}  onBlur={()=>setFocusedField(null)} />
                </div>
              )}

              {!isLogin && !forgotPassword && (
                <FloatField id="phone" label="Numéro de téléphone" type="tel" name="phone" value={formData.phone} onChange={handleChange} required focused={focusedField==="phone"} onFocus={()=>setFocusedField("phone")} onBlur={()=>setFocusedField(null)} autoComplete="tel" />
              )}

                  {!isLogin && !forgotPassword && (
                    <fieldset className="l-profile-fieldset">
                      <legend>Quels modules souhaitez-vous activer ?</legend>
                      <label className="l-profile-option">
                        <input
                          type="checkbox"
                          checked={formData.profiles.includes("MARKET_CUSTOMER")}
                          onChange={() => toggleProfile("MARKET_CUSTOMER")}
                        />
                        <span>
                          <strong>Module e-commerce</strong>
                          <small>Découvrir les produits et passer des commandes.</small>
                        </span>
                      </label>
                      <label className="l-profile-option">
                        <input
                          type="checkbox"
                          checked={formData.profiles.includes("TRAINING_PARTICIPANT")}
                          onChange={() => toggleProfile("TRAINING_PARTICIPANT")}
                        />
                        <span>
                          <strong>Module formation</strong>
                          <small>Consulter les formations et s’inscrire aux sessions.</small>
                        </span>
                      </label>
                      <small className="l-profile-hint">Vous pouvez sélectionner les deux profils.</small>
                    </fieldset>
                  )}

                  <FloatField id="email" label="Adresse email" type="email" name="email" value={formData.email} onChange={handleChange} required focused={focusedField==="email"} onFocus={()=>setFocusedField("email")} onBlur={()=>setFocusedField(null)} />
              {!forgotPassword && (
                <FloatField id="password" label="Mot de passe" type="password" name="password" value={formData.password} onChange={handleChange} required focused={focusedField==="password"} onFocus={()=>setFocusedField("password")} onBlur={()=>setFocusedField(null)} autoComplete={isLogin ? "current-password" : "new-password"} />
              )}
            </div>

            <button type="submit" className="l-btn" disabled={loading}>
              {loading && <span className="l-spinner" />}
              <span>
                {loading ? "Chargement…" : forgotPassword ? "Envoyer le lien" : isLogin ? "Se connecter" : "Créer mon compte"}
              </span>
            </button>
          </form>

          {isLogin && !forgotPassword && (
            <div className="l-forgot">
              <button
                type="button"
                onClick={() => { setForgotPassword(true); setError(null); setSuccess(null); }}
              >
                Mot de passe oublié ?
              </button>
            </div>
          )}

          {forgotPassword && (
            <div className="l-foot">
              <span>Vous vous souvenez de votre mot de passe ?</span>
              <button type="button" onClick={() => switchMode(true)}>Se connecter</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function FloatField({ id, label, type, name, value, onChange, required, focused, onFocus, onBlur, autoComplete }: {
  id: string; label: string; type: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean; focused: boolean; onFocus: () => void; onBlur: () => void;
  autoComplete?: string;
}) {
  const filled = value.length > 0;
  return (
    <div className={`l-field${focused ? " focused" : ""}${filled ? " filled" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id} type={type} name={name} value={value}
        onChange={onChange} onFocus={onFocus} onBlur={onBlur} required={required}
        autoComplete={autoComplete ?? (type === "password" ? "current-password" : type === "email" ? "email" : name === "lastName" ? "family-name" : "given-name")}
        placeholder={label}
      />
      <div className="l-field-line" />
    </div>
  );
}