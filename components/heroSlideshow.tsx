"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";

/* ─────────────────────────────────────────────
   Types & constantes
   ───────────────────────────────────────────── */
type SlidePalette = { accent: string; accentRgb: string; cardBg: string; ghostBg1: string; ghostBg2: string; inkLight: string; inkDark: string };

const PALETTES: SlidePalette[] = [
  { accent: "#7C6AF5", accentRgb: "124,106,245", cardBg: "#F5F3FF", ghostBg1: "#E8E3F7", ghostBg2: "#DDD7F2", inkLight: "#A49DE4", inkDark: "#2A2060" },
  { accent: "#3B82F6", accentRgb: "59,130,246", cardBg: "#EFF6FF", ghostBg1: "#DBEAFE", ghostBg2: "#BFDBFE", inkLight: "#93B5F5", inkDark: "#1E3A6E" },
  { accent: "#D97706", accentRgb: "217,119,6",   cardBg: "#FFFBF0", ghostBg1: "#FEF3C7", ghostBg2: "#FDE68A", inkLight: "#E0B96A", inkDark: "#451A03" },
  { accent: "#059669", accentRgb: "5,150,105",   cardBg: "#F0FDF9", ghostBg1: "#D1FAE5", ghostBg2: "#A7F3D0", inkLight: "#6ECFAA", inkDark: "#064E3B" },
  { accent: "#F05A1A", accentRgb: "240,90,26",   cardBg: "#FFF7F3", ghostBg1: "#FFE8DC", ghostBg2: "#FFD5C2", inkLight: "#F0A07A", inkDark: "#4A1800" },
  { accent: "#C026B0", accentRgb: "192,38,176",  cardBg: "#FDF4FE", ghostBg1: "#F5D0FE", ghostBg2: "#EAADF4", inkLight: "#D88AE8", inkDark: "#4A0063" },
];

interface Slide {
  src: string;
  alt: string;
  eyebrow: string;
  desc: string;
}

const DEFAULT_SLIDES: Slide[] = [
  { src: "https://i.pinimg.com/originals/a1/43/d1/a143d10f9442151675d4e74e1d225b4d.gif", alt: "FiSAFi – cybersécurité",
    eyebrow: "Cybersécurité Avancée",
    desc: "Détection, prévention et réponse aux incidents pour une protection complète de vos systèmes." },
  { src: "https://i.pinimg.com/originals/a5/67/75/a567754bc4d6f47aa9dce10fddbf9aaf.gif", alt: "FiSAFi – infrastructure",
    eyebrow: "Infrastructure Résiliente",
    desc: "Conception et déploiement d'architectures résilientes adaptées à votre organisation." },
  { src: "https://i.pinimg.com/originals/23/2b/c8/232bc816e6901e5ec4b88cf3128e1916.gif", alt: "FiSAFi – conseil",
    eyebrow: "Conseil Technologique",
    desc: "Expertise senior pour piloter vos projets de transformation numérique en toute confiance." },
  { src: "https://i.pinimg.com/originals/79/a6/cc/79a6cc3163bcd2d964488d8ae62d03df.gif", alt: "FiSAFi – transformation",
    eyebrow: "Transformation Digitale",
    desc: "Accompagnement sur mesure pour faire évoluer votre SI vers les standards de demain." },
  { src: "https://i.pinimg.com/736x/be/e2/d5/bee2d5d466ff81920146e8de938e9f91.jpg", alt: "FiSAFi – services managés",
    eyebrow: "Services Managés 24/7",
    desc: "Une équipe dédiée disponible à toute heure pour assurer la continuité de vos opérations." },
  { src: "https://i.pinimg.com/1200x/51/22/c9/5122c9f061de79ba51b94401f8638dbf.jpg", alt: "FiSAFi – solutions",
    eyebrow: "Solutions Personnalisées",
    desc: "Des réponses technologiques conçues spécifiquement pour les enjeux de votre secteur." },
];

const SERVICES_SLIDES: Slide[] = [
  { src: "https://i.pinimg.com/736x/80/41/99/8041992ed3076083dc5ad1e7f5c90181.jpg", alt: "Services – réseaux",
    eyebrow: "Réseaux & Télécommunications",
    desc: "Architecture, déploiement et supervision de vos infrastructures réseau." },
  { src: "https://i.pinimg.com/1200x/e8/ce/0f/e8ce0fd1ffe096dee7d7b85b261b626f.jpg", alt: "Services – infrastructure",
    eyebrow: "Infrastructure IT & Virtualisation",
    desc: "Optimisez vos ressources grâce à la virtualisation et aux solutions cloud hybrides." },
  { src: "https://i.pinimg.com/1200x/67/3c/54/673c54c87878338793b7bd30801ec1fc.jpg", alt: "Services – cybersécurité",
    eyebrow: "Cybersécurité & Protection",
    desc: "Audits, SOC managé et solutions de protection pour sécuriser vos actifs numériques." },
  { src: "https://i.pinimg.com/1200x/41/e4/8f/41e48f226597daf5235a91aabd887093.jpg", alt: "Services – conseil",
    eyebrow: "Conseil & Accompagnement",
    desc: "Nos experts vous guident à chaque étape de votre stratégie IT." },
];

const TRAINING_SLIDES: Slide[] = [
  { src: "/17.jpeg", alt: "Formation – présentielle",
    eyebrow: "Sessions Présentielles",
    desc: "Des formations animées par des experts certifiés pour une montée en compétences rapide." },
  { src: "https://i.pinimg.com/1200x/7e/33/65/7e3365afd1719903d79624475cc3bc61.jpg", alt: "Formation – e-learning",
    eyebrow: "Parcours en ligne",
    desc: "Accédez à nos modules e-learning à votre rythme, depuis n'importe où dans le monde." },
  { src: "https://i.pinimg.com/1200x/31/fd/55/31fd55cd1a1616648836ef96254ce103.jpg", alt: "Formation – hybride",
    eyebrow: "Mode Hybride",
    desc: "Combinez présentiel et distanciel pour une flexibilité maximale sans compromis sur la qualité." },
  { src: "https://i.pinimg.com/1200x/22/0c/55/220c553e5e8bdb36377e41329925fa4b.jpg", alt: "Formation – certifications",
    eyebrow: "Préparation aux certifications",
    desc: "Programmes intensifs alignés sur les certifications officielles des grands éditeurs." },
];

function hexRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ─────────────────────────────────────────────
   Composant principal
   ───────────────────────────────────────────── */
export default function HeroSlideshow({
  variant = "home",
  hideCTA = false,
  ctaText = "Nos services",
  ctaHref = "/services",
}: {
  variant?: "home" | "services" | "training";
  hideCTA?: boolean;
  ctaText?: string;
  ctaHref?: string;
}) {
  const slides = useMemo(() =>
    variant === "services" ? SERVICES_SLIDES :
    variant === "training" ? TRAINING_SLIDES :
    DEFAULT_SLIDES,
  [variant]);

  const [current, setCurrent]       = useState(0);
  const [prevIdx, setPrevIdx]       = useState<number | null>(null);
  const [imgKey, setImgKey]         = useState(0);
  const [autoEnabled, setAutoEnabled] = useState(true);

  const cardsTrackRef       = useRef<HTMLDivElement>(null);
  const currentRef          = useRef(0);
  const isProgrammaticScroll = useRef(false);
  const autoTimer           = useRef<ReturnType<typeof setInterval>>();
  const inactivityTimer     = useRef<ReturnType<typeof setTimeout>>();

  const palette = PALETTES[current % PALETTES.length];
  const total   = String(slides.length).padStart(2, "0");

  const updateCurrent = useCallback((idx: number) => {
    if (idx === currentRef.current) return;
    setPrevIdx(currentRef.current);
    setImgKey(k => k + 1);
    currentRef.current = idx;
    setCurrent(idx);
  }, []);

  const pauseAuto = useCallback(() => {
    setAutoEnabled(false);
    clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => setAutoEnabled(true), 8000);
  }, []);

  const goTo = useCallback((idx: number) => {
    const track = cardsTrackRef.current;
    if (!track) return;
    const targetX = track.clientWidth * idx;
    isProgrammaticScroll.current = true;
    updateCurrent(idx);
    track.scrollTo({ left: targetX, behavior: "smooth" });
    const release = () => { isProgrammaticScroll.current = false; track.removeEventListener("scrollend", release); };
    track.addEventListener("scrollend", release, { once: true });
    setTimeout(() => { if (isProgrammaticScroll.current) { track.removeEventListener("scrollend", release); isProgrammaticScroll.current = false; } }, 700);
  }, [updateCurrent]);

  useEffect(() => {
    if (!autoEnabled) return;
    autoTimer.current = setInterval(() => goTo((currentRef.current + 1) % slides.length), 8000);
    return () => clearInterval(autoTimer.current);
  }, [autoEnabled, slides.length, goTo]);

  useEffect(() => {
    const track = cardsTrackRef.current;
    if (!track) return;
    let t: ReturnType<typeof setTimeout> | null = null;
    const handleScroll = () => {
      if (isProgrammaticScroll.current) return;
      pauseAuto();
      if (t) clearTimeout(t);
      t = setTimeout(() => {
        const idx = Math.round(track.scrollLeft / track.clientWidth);
        updateCurrent(Math.max(0, Math.min(idx, slides.length - 1)));
        t = null;
      }, 80);
    };
    track.addEventListener("scroll", handleScroll, { passive: true });
    return () => { track.removeEventListener("scroll", handleScroll); if (t) clearTimeout(t); };
  }, [pauseAuto, updateCurrent, slides.length]);

  const attachDrag = useCallback((el: HTMLDivElement) => {
    let dragging = false, startX = 0, startLeft = 0;
    const onDown  = (e: MouseEvent) => { dragging = true; startX = e.pageX; startLeft = el.scrollLeft; el.style.cursor = "grabbing"; el.style.userSelect = "none"; pauseAuto(); el.style.scrollBehavior = "auto"; };
    const onMove  = (e: MouseEvent) => { if (!dragging) return; el.scrollLeft = startLeft - (e.pageX - startX); };
    const onUp    = () => { dragging = false; el.style.cursor = "grab"; el.style.removeProperty("user-select"); el.style.scrollBehavior = "smooth"; };
    el.addEventListener("mousedown", onDown);
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseup",   onUp);
    el.addEventListener("mouseleave", onUp);
    return () => { el.removeEventListener("mousedown", onDown); el.removeEventListener("mousemove", onMove); el.removeEventListener("mouseup", onUp); el.removeEventListener("mouseleave", onUp); };
  }, [pauseAuto]);

  useEffect(() => {
    const el = cardsTrackRef.current;
    if (!el) return;
    return attachDrag(el);
  }, [attachDrag]);

  const css = useMemo(() => `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=Jost:wght@200;300;400;500;600;700&display=swap');

    /* ── Root ───────────────────────────────── */
    .hs-root {
      --bg: #080f18;
      --bg2: #0d1a28;
      --grain-opacity: 0.038;
      width: 100%;
      display: flex;
      flex-direction: column;
      background: var(--bg);
      overflow: hidden;
      isolation: isolate;
      position: relative;
    }

    /* Subtle grain texture overlay */
    .hs-root::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: 100;
      pointer-events: none;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
      opacity: var(--grain-opacity);
      mix-blend-mode: overlay;
    }

    /* ── Image Container ─────────────────────── */
    .hs-image-container {
      position: relative;
      height: clamp(260px, 54vw, 70vh);
      width: 100%;
      background: var(--bg);
      user-select: none;
      overflow: hidden;
    }

    /* Crossfade: outgoing slide */
    .hs-img-layer {
      position: absolute;
      inset: 0;
      will-change: opacity, transform;
    }
    .hs-img-layer--prev {
      animation: hs-fadeOut 0.72s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    .hs-img-layer--curr {
      animation: hs-fadeIn 0.72s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    @keyframes hs-fadeOut {
      0%   { opacity: 1; transform: scale(1); }
      100% { opacity: 0; transform: scale(1.03); }
    }
    @keyframes hs-fadeIn {
      0%   { opacity: 0; transform: scale(1.04); }
      100% { opacity: 1; transform: scale(1); }
    }

    /* Multi-layer gradient vignette */
    .hs-image-container::after {
      content: '';
      position: absolute;
      inset: 0;
      background:
        linear-gradient(to bottom,
          rgba(8,15,24,0.12) 0%,
          transparent 35%,
          rgba(8,15,24,0.18) 60%,
          rgba(8,15,24,0.72) 100%
        ),
        linear-gradient(to right,
          rgba(8,15,24,0.22) 0%,
          transparent 30%,
          transparent 70%,
          rgba(8,15,24,0.22) 100%
        );
      pointer-events: none;
      z-index: 4;
    }

    /* Slide counter */
    .hs-slide-num {
      position: absolute;
      bottom: 16px;
      right: 20px;
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 12px;
      font-style: italic;
      font-weight: 400;
      color: rgba(255,255,255,0.38);
      letter-spacing: 0.1em;
      z-index: 10;
    }

    /* Animated accent line at bottom of image */
    .hs-image-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 2px;
      background: linear-gradient(to right, transparent, var(--hs-accent), transparent);
      z-index: 10;
      transition: width 0.5s cubic-bezier(0.25,0.46,0.45,0.94), background 0.45s ease;
      opacity: 0.7;
    }

    /* ── Cards Track ─────────────────────────── */
    .hs-cards-track {
      width: 100%;
      display: flex;
      overflow-x: scroll;
      scroll-snap-type: x mandatory;
      scrollbar-width: none;
      -ms-overflow-style: none;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior-x: contain;
      cursor: grab;
      background: var(--bg2);
    }
    .hs-cards-track:active { cursor: grabbing; }
    .hs-cards-track::-webkit-scrollbar { display: none; }

    .hs-card-slide {
      flex: 0 0 100%;
      scroll-snap-align: start;
      scroll-snap-stop: always;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 2.4rem 2rem 1.8rem;
    }

    /* ── Card Stack (skeuomorphic notebook) ──── */
    .hs-card-scene {
      display: flex;
      flex-direction: column;
      align-items: center;
      filter: drop-shadow(0 32px 48px rgba(0,0,0,0.42));
    }

    /* Washi-tape pin */
    .hs-pin {
      width: 44px;
      height: 14px;
      border-radius: 2px;
      margin-bottom: -2px;
      z-index: 10;
      flex-shrink: 0;
      position: relative;
      transition: background 0.45s ease;
      opacity: 0.88;
    }
    .hs-pin::before {
      content: '';
      position: absolute;
      inset: 2px;
      background: rgba(255,255,255,0.16);
      border-radius: 1px;
    }

    .hs-stack {
      position: relative;
      width: clamp(248px, 76vw, 322px);
    }
    .hs-ghost {
      position: absolute;
      inset: 0;
      border-radius: 4px;
      transition: background 0.45s ease;
    }
    .hs-ghost--far  { transform: rotate(3.8deg) translateY(6px) translateX(2px); z-index: 0; opacity: 0.55; }
    .hs-ghost--near { transform: rotate(-2.4deg) translateY(4px) translateX(-1px); z-index: 1; opacity: 0.78; }

    .hs-card {
      position: relative;
      z-index: 2;
      border-radius: 4px;
      overflow: hidden;
      transform: rotate(-0.6deg);
      transition: background 0.45s ease;
      box-shadow:
        0 1px 1px rgba(0,0,0,0.10),
        0 3px 6px rgba(0,0,0,0.12),
        0 8px 20px rgba(0,0,0,0.18),
        0 20px 40px rgba(0,0,0,0.24),
        0 40px 64px rgba(0,0,0,0.12);
    }

    /* Red margin line */
    .hs-card-margin {
      position: absolute;
      left: 2.5rem;
      top: 0;
      bottom: 0;
      width: 1px;
      transition: background 0.45s ease;
    }

    /* Spiral holes */
    .hs-card-holes {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      width: 2.5rem;
      display: flex;
      flex-direction: column;
      justify-content: space-evenly;
      align-items: center;
      gap: 0;
      pointer-events: none;
      z-index: 3;
    }
    .hs-hole {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: var(--bg2);
      box-shadow: inset 0 1px 2px rgba(0,0,0,0.25);
      flex-shrink: 0;
    }

    .hs-card-body {
      padding: 1.5rem 1.8rem 1.9rem 3.2rem;
      position: relative;
      z-index: 2;
    }

    /* Index number */
    .hs-card-num {
      display: block;
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 13.5px;
      font-style: italic;
      font-weight: 400;
      letter-spacing: 0.1em;
      line-height: 1;
      margin-bottom: 0.55rem;
      transition: color 0.45s ease;
    }

    .hs-card-rule {
      width: 22px;
      height: 1px;
      margin-bottom: 0.7rem;
      transition: background 0.45s ease;
    }

    .hs-card-title {
      font-family: 'Jost', Arial, sans-serif;
      font-size: clamp(1.05rem, 3.6vw, 1.32rem);
      font-weight: 600;
      color: #16100b;
      line-height: 1.2;
      letter-spacing: -0.02em;
      margin: 0 0 0.7rem;
    }

    .hs-card-desc {
      font-family: 'Jost', Arial, sans-serif;
      font-size: clamp(0.82rem, 2.4vw, 0.92rem);
      font-weight: 300;
      color: #645a51;
      line-height: 1.66;
      margin: 0;
    }

    /* Subtle bottom fade on card */
    .hs-card::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 28px;
      background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.028));
      pointer-events: none;
      z-index: 5;
    }

    /* ── Text Panel ──────────────────────────── */
    .hs-text-panel {
      position: relative;
      background: var(--bg2);
      display: flex;
      flex-direction: column;
      align-items: stretch;
      overflow: hidden;
    }

    /* panel: no ambient glow */

    /* Vertical progress bar */
    .hs-vbar {
      position: absolute;
      left: 1.6rem;
      top: 1.4rem;
      bottom: 4.6rem;
      width: 1px;
      background: rgba(255,255,255,0.055);
      overflow: visible;
      pointer-events: none;
      z-index: 10;
    }
    .hs-vbar::before {
      content: '';
      position: absolute;
      top: 0;
      left: -1px;
      width: 3px;
      height: 6px;
      border-radius: 2px;
      background: rgba(255,255,255,0.08);
    }
    .hs-vbar-fill {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      transition: height 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94), background 0.45s ease;
      border-radius: 0 0 2px 2px;
    }
    /* Small accent cap on bar fill */
    .hs-vbar-fill::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: -1px;
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: var(--hs-accent, #7C6AF5);
      
      opacity: 0.6;
      transition: background 0.45s ease;
    }
    @media (max-width: 480px) {
      .hs-vbar { display: none; }
    }

    /* ── Bottom Controls ─────────────────────── */
    .hs-bottom {
      position: relative;
      z-index: 5;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
      padding: 0 2rem 2.6rem;
    }

    /* Thin decorative line above bottom */
    .hs-bottom::before {
      content: '';
      display: block;
      width: 100%;
      height: 1px;
      background: rgba(255,255,255,0.038);
      margin-bottom: 0.1rem;
    }

    .hs-actions {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .hs-btn-primary, .hs-btn-ghost {
      display: inline-flex;
      align-items: center;
      gap: 1rem;
      font-family: 'Jost', Arial, sans-serif;
      font-size: 9.5px;
      letter-spacing: 0.32em;
      text-transform: uppercase;
      text-decoration: none;
      transition: color 0.28s ease, letter-spacing 0.28s ease;
      position: relative;
    }
    .hs-btn-primary {
      font-weight: 400;
      color: rgba(255,255,255,0.55);
    }
    .hs-btn-ghost {
      font-weight: 300;
      color: rgba(255,255,255,0.24);
      letter-spacing: 0.25em;
    }
    .hs-btn-primary:hover { color: rgba(255,255,255,0.92); letter-spacing: 0.36em; }
    .hs-btn-ghost:hover   { color: rgba(255,255,255,0.72); letter-spacing: 0.28em; }

    /* Animated arrow */
    .hs-btn-arrow {
      display: inline-flex;
      align-items: center;
      overflow: hidden;
      width: 20px;
      height: 10px;
      position: relative;
      flex-shrink: 0;
    }
    .hs-btn-arrow::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      width: 100%;
      height: 1px;
      background: currentColor;
      transform: translateY(-50%);
      transition: transform 0.28s ease;
    }
    .hs-btn-arrow::after {
      content: '';
      position: absolute;
      right: 0;
      top: 50%;
      width: 3px;
      height: 3px;
      border-right: 1px solid currentColor;
      border-top: 1px solid currentColor;
      transform: translateY(-50%) rotate(45deg);
      transition: transform 0.28s ease;
    }
    .hs-btn-primary:hover .hs-btn-arrow::before { transform: translateY(-50%) translateX(5px); }
    .hs-btn-primary:hover .hs-btn-arrow::after  { transform: translateY(-50%) rotate(45deg) translateX(3px); }
    .hs-btn-ghost:hover .hs-btn-arrow::before  { transform: translateY(-50%) translateX(4px); }
    .hs-btn-ghost:hover .hs-btn-arrow::after   { transform: translateY(-50%) rotate(45deg) translateX(2px); }

    /* ── Dot Navigation ──────────────────────── */
    .hs-dots {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    .hs-dot {
      height: 2px;
      background: rgba(255,255,255,0.12);
      border: none;
      padding: 0;
      cursor: pointer;
      border-radius: 2px;
      transition: background 0.42s ease, width 0.42s cubic-bezier(0.34, 1.2, 0.64, 1), opacity 0.42s ease;
      width: 18px;
    }
    .hs-dot--active {
      width: 42px;
      opacity: 0.9;
    }
    .hs-dot:hover:not(.hs-dot--active) {
      background: rgba(255,255,255,0.32);
      width: 26px;
    }

    /* ── Card entrance animation ─────────────── */
    @keyframes hs-cardSlideIn {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .hs-card-scene {
      animation: hs-cardSlideIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
    }
  `, []);

  return (
    <section
      className="hs-root"
      style={{
        // CSS custom properties for accent color, reactive to current slide
        ["--hs-accent" as string]: palette.accent,
        ["--hs-accent-glow" as string]: `rgba(${palette.accentRgb}, 0.1)`,
      } as React.CSSProperties}
    >
      {/* ── Image zone ──────────────────────── */}
      <div className="hs-image-container">
        {/* Crossfade: previous layer fades out */}
        {prevIdx !== null && (
          <div key={`prev-${imgKey}`} className="hs-img-layer hs-img-layer--prev">
            <Image
              src={slides[prevIdx].src}
              alt={slides[prevIdx].alt}
              fill
              sizes="100vw"
              style={{ objectFit: "cover", objectPosition: "center top" }}
              draggable={false}
            />
          </div>
        )}
        {/* Current layer fades in */}
        <div key={`curr-${imgKey}`} className="hs-img-layer hs-img-layer--curr">
          <Image
            src={slides[current].src}
            alt={slides[current].alt}
            fill
            priority={current === 0}
            sizes="100vw"
            style={{ objectFit: "cover", objectPosition: "center top" }}
            draggable={false}
          />
        </div>

        {/* Animated accent bar at bottom */}
        <div
          className="hs-image-bar"
          style={{
            width: `${((current + 1) / slides.length) * 100}%`,
            background: `linear-gradient(to right, transparent, ${palette.accent}, transparent)`,
          }}
        />

        <div className="hs-slide-num">
          {String(current + 1).padStart(2, "0")} / {total}
        </div>
      </div>

      {/* ── Text & cards panel ──────────────── */}
      <div className="hs-text-panel">
        {/* Vertical progress bar */}
        <div className="hs-vbar">
          <div
            className="hs-vbar-fill"
            style={{
              height: `${((current + 1) / slides.length) * 100}%`,
              background: palette.accent,
            }}
          />
        </div>

        {/* Scrollable card track */}
        <div className="hs-cards-track" ref={cardsTrackRef}>
          {slides.map((slide, idx) => {
            const p   = PALETTES[idx % PALETTES.length];
            const num = String(idx + 1).padStart(2, "0");
            return (
              <div key={idx} className="hs-card-slide">
                <div className="hs-card-scene">
                  {/* Washi tape pin */}
                  <div
                    className="hs-pin"
                    style={{
                      background: `linear-gradient(to right, ${hexRgba(p.accent, 0.7)}, ${hexRgba(p.accent, 0.9)})`,
                      
                    }}
                  />

                  {/* Stacked cards */}
                  <div className="hs-stack">
                    <div className="hs-ghost hs-ghost--far"  style={{ background: p.ghostBg2 }} />
                    <div className="hs-ghost hs-ghost--near" style={{ background: p.ghostBg1 }} />

                    <div
                      className="hs-card"
                      style={{
                        backgroundColor: p.cardBg,
                        backgroundImage: `repeating-linear-gradient(
                          transparent 0px,
                          transparent 26px,
                          ${hexRgba("#000000", 0.028)} 26px,
                          ${hexRgba("#000000", 0.028)} 27px
                        )`,
                        backgroundPositionY: "48px",
                      }}
                    >
                      {/* Red margin line */}
                      <div
                        className="hs-card-margin"
                        style={{ background: hexRgba(p.accent, 0.2) }}
                      />

                      {/* Spiral holes */}
                      <div className="hs-card-holes">
                        {[...Array(5)].map((_, hi) => (
                          <div key={hi} className="hs-hole" />
                        ))}
                      </div>

                      <div className="hs-card-body">
                        <span
                          className="hs-card-num"
                          style={{ color: p.accent }}
                        >
                          {num}
                        </span>
                        <div
                          className="hs-card-rule"
                          style={{ background: hexRgba(p.accent, 0.28) }}
                        />
                        <h2 className="hs-card-title">{slide.eyebrow}</h2>
                        <p  className="hs-card-desc">{slide.desc}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom controls */}
        <div className="hs-bottom">
          {!hideCTA && (
            <div className="hs-actions">
              <Link href={ctaHref} className="hs-btn-primary">
                <span>{ctaText}</span>
                <span className="hs-btn-arrow" aria-hidden />
              </Link>
              <Link href="/#contact" className="hs-btn-ghost">
                <span>Nous contacter</span>
                <span className="hs-btn-arrow" aria-hidden />
              </Link>
            </div>
          )}

          <nav className="hs-dots" aria-label="Navigation">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => { goTo(i); pauseAuto(); }}
                aria-label={`Diapositive ${i + 1}`}
                className={`hs-dot${i === current ? " hs-dot--active" : ""}`}
                style={i === current ? { background: PALETTES[i % PALETTES.length].accent } : undefined}
              />
            ))}
          </nav>
        </div>
      </div>

      <style>{css}</style>
    </section>
  );
}