"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import "@/styles/heroSlideshow.css";

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
  { src: "https://i.pinimg.com/1200x/23/1f/43/231f436e0565a056debf3c3330a20ff4.jpg", alt: "FiSAFi – services managés",
    eyebrow: "Services Managés 24/7",
    desc: "Une équipe dédiée disponible à toute heure pour assurer la continuité de vos opérations." },
  { src: "https://i.pinimg.com/originals/1b/bd/90/1bbd90eb39091d1e84a018aae664a15d.gif", alt: "FiSAFi – solutions",
    eyebrow: "Solutions Personnalisées",
    desc: "Des réponses technologiques conçues spécifiquement pour les enjeux de votre secteur." },
    { src: "https://i.pinimg.com/1200x/23/e1/36/23e136d0c010468805abcc11b6adf877.jpg", alt: "FiSAFi – solutions",
    eyebrow: "Fibre Optique & WDM",
    desc: "Expert WDM, déploiement aérien et souterrain, suivi et contrôle des travaux haute capacité." },
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
    try {
      setPrevIdx(currentRef.current);
      setImgKey(k => k + 1);
      currentRef.current = idx;
      setCurrent(idx);
    } catch (e) {
      console.error("Update current error:", e);
    }
  }, []);

  const pauseAuto = useCallback(() => {
    setAutoEnabled(false);
    clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => setAutoEnabled(true), 8000);
  }, []);

  const goTo = useCallback((idx: number) => {
    try {
      const track = cardsTrackRef.current;
      if (!track || !track.parentElement) return; // Check if DOM exists
      
      const targetX = track.clientWidth * idx;
      if (targetX < 0 || !isFinite(targetX)) return; // Sanity check
      
      isProgrammaticScroll.current = true;
      updateCurrent(idx);
      // Safari-safe scroll without smooth behavior
      track.scrollLeft = targetX;
      setTimeout(() => { 
        if (cardsTrackRef.current) isProgrammaticScroll.current = false;
      }, 100);
    } catch (e) {
      console.error("GoTo error:", e);
      isProgrammaticScroll.current = false;
    }
  }, [updateCurrent]);

  useEffect(() => {
    if (!autoEnabled) return;
    autoTimer.current = setInterval(() => {
      goTo((currentRef.current + 1) % slides.length);
    }, 8000);
    
    return () => {
      if (autoTimer.current) clearInterval(autoTimer.current);
    };
  }, [autoEnabled, slides.length, goTo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoTimer.current) clearInterval(autoTimer.current);
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, []);

  useEffect(() => {
    const track = cardsTrackRef.current;
    if (!track) return;
    
    let scrollTimer: ReturnType<typeof setTimeout> | null = null;
    
    const handleScroll = () => {
      if (isProgrammaticScroll.current) return;
      pauseAuto();
      
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        try {
          const idx = Math.round(track.scrollLeft / track.clientWidth);
          const safeIdx = Math.max(0, Math.min(idx, slides.length - 1));
          updateCurrent(safeIdx);
        } catch (e) {
          console.error("Scroll error:", e);
        }
        scrollTimer = null;
      }, 80);
    };
    
    track.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => { 
      track.removeEventListener("scroll", handleScroll);
      if (scrollTimer) clearTimeout(scrollTimer);
    };
  }, [pauseAuto, updateCurrent, slides.length]);

  const attachDrag = useCallback((el: HTMLDivElement) => {
    let dragging = false, startX = 0, startLeft = 0;
    
    const onDown  = (e: MouseEvent) => { 
      dragging = true; 
      startX = e.pageX; 
      startLeft = el.scrollLeft; 
      el.style.cursor = "grabbing"; 
      el.style.userSelect = "none"; 
      pauseAuto();
    };
    
    const onMove  = (e: MouseEvent) => { 
      if (!dragging) return; 
      el.scrollLeft = startLeft - (e.pageX - startX); 
    };
    
    const onUp    = () => { 
      dragging = false; 
      el.style.cursor = "grab"; 
      el.style.removeProperty("user-select"); 
    };
    
    el.addEventListener("mousedown", onDown);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    
    return () => { 
      el.removeEventListener("mousedown", onDown);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [pauseAuto]);

  useEffect(() => {
    const el = cardsTrackRef.current;
    if (!el) return;
    return attachDrag(el);
  }, [attachDrag]);

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
    </section>
  );
}