"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import "@/styles/heroSlideshow.css";

/* ─────────────────────────────────────────────
   Types & constantes
   ───────────────────────────────────────────── */
type SlidePalette = {
  accent: string;
  accentRgb: string;
  cardBg: string;
  ghostBg1: string;
  ghostBg2: string;
  inkLight: string;
  inkDark: string;
  lineColor: string;
};

const PALETTES: SlidePalette[] = [
  {
    accent: "#7C6AF5", accentRgb: "124,106,245",
    cardBg: "#F7F5FF",
    ghostBg1: "#EAE6FA", ghostBg2: "#D9D3F0",
    inkLight: "#A49DE4", inkDark: "#2A2060",
    lineColor: "rgba(124,106,245,0.13)",
  },
  {
    accent: "#3B82F6", accentRgb: "59,130,246",
    cardBg: "#F0F6FF",
    ghostBg1: "#DBEAFE", ghostBg2: "#BFDBFE",
    inkLight: "#93B5F5", inkDark: "#1E3A6E",
    lineColor: "rgba(59,130,246,0.12)",
  },
  {
    accent: "#D97706", accentRgb: "217,119,6",
    cardBg: "#FFFCF3",
    ghostBg1: "#FEF3C7", ghostBg2: "#FDE68A",
    inkLight: "#E0B96A", inkDark: "#451A03",
    lineColor: "rgba(217,119,6,0.12)",
  },
  {
    accent: "#059669", accentRgb: "5,150,105",
    cardBg: "#F0FDF9",
    ghostBg1: "#D1FAE5", ghostBg2: "#A7F3D0",
    inkLight: "#6ECFAA", inkDark: "#064E3B",
    lineColor: "rgba(5,150,105,0.12)",
  },
  {
    accent: "#F05A1A", accentRgb: "240,90,26",
    cardBg: "#FFF8F5",
    ghostBg1: "#FFE8DC", ghostBg2: "#FFD5C2",
    inkLight: "#F0A07A", inkDark: "#4A1800",
    lineColor: "rgba(240,90,26,0.12)",
  },
  {
    accent: "#C026B0", accentRgb: "192,38,176",
    cardBg: "#FDF4FE",
    ghostBg1: "#F5D0FE", ghostBg2: "#EAADF4",
    inkLight: "#D88AE8", inkDark: "#4A0063",
    lineColor: "rgba(192,38,176,0.12)",
  },
];

interface Slide {
  src: string;
  alt: string;
  eyebrow: string;
  desc: string;
}

const DEFAULT_SLIDES: Slide[] = [
  {
    src: "/hero/4f.jpg",
    alt: "FiSAFi – cybersécurité",
    eyebrow: "Sécurité des systèmes",
    desc: "Audit et mesures de protection pour les systèmes et les données.",
  },
  {
    src: "/hero/FiSAFi – infrastructure.gif",
    alt: "FiSAFi – infrastructure",
    eyebrow: "Infrastructures réseau",
    desc: "Conception et déploiement d’architectures réseau selon les contraintes du site.",
  },
  {
    src: "/Conseil & accompagnement.jpg",
    alt: "FiSAFi – conseil",
    eyebrow: "Études & conseil",
    desc: "Cadrage technique et accompagnement de projets numériques.",
  },
  {
    src: "/hero/FiSAFi – transformation.gif",
    alt: "FiSAFi – transformation",
    eyebrow: "Évolution des systèmes",
    desc: "Faire évoluer les outils et les infrastructures déjà en place.",
  },
  {
    src: "/hero/FiSAFi – services managés.jpg",
    alt: "FiSAFi – services managés",
    eyebrow: "Maintenance & support",
    desc: "Maintenance des équipements et accompagnement des équipes.",
  },
  {
    src: "/hero/FiSAFi – installation réseau.jpg",
    alt: "FiSAFi – installation réseau",
    eyebrow: "Installation réseau",
    desc: "Des choix techniques liés au site, au matériel et aux usages.",
  },
  {
    src: "/hero/FiSAFi – infrastructure.gif",
    alt: "FiSAFi – fibre",
    eyebrow: "Fibre optique",
    desc: "Études, déploiement aérien ou souterrain et suivi des travaux.",
  },
];

const SERVICES_SLIDES: Slide[] = [
  {
    src: "/Infrastructure & réseaux.gif",
    alt: "Services – réseaux",
    eyebrow: "Réseaux & Télécommunications",
    desc: "Architecture, déploiement et supervision de vos infrastructures réseau.",
  },
  {
    src: "/Cloud & virtualisation.jpg",
    alt: "Services – infrastructure",
    eyebrow: "Infrastructure IT & Virtualisation",
    desc: "Optimisez vos ressources grâce à la virtualisation et aux solutions cloud hybrides.",
  },
  {
    src: "/Cybersécurité.gif",
    alt: "Services – cybersécurité",
    eyebrow: "Cybersécurité & Protection",
    desc: "Audits, SOC managé et solutions de protection pour sécuriser vos actifs numériques.",
  },
  {
    src: "/Conseil & accompagnement.jpg",
    alt: "Services – conseil",
    eyebrow: "Conseil & Accompagnement",
    desc: "Nos experts vous guident à chaque étape de votre stratégie IT.",
  },
];

const TRAINING_SLIDES: Slide[] = [
  {
    src: "/1.jpeg",
    alt: "Formation – présentielle",
    eyebrow: "Sessions Présentielles",
    desc: "Des formations animées par des experts certifiés pour une montée en compétences rapide.",
  },
  {
    src: "/Cloud & virtualisation.jpg",
    alt: "Formation – e-learning",
    eyebrow: "Parcours en ligne",
    desc: "Accédez à nos modules e-learning à votre rythme, depuis n'importe où dans le monde.",
  },
  {
    src: "/17.jpeg",
    alt: "Formation – hybride",
    eyebrow: "Mode Hybride",
    desc: "Combinez présentiel et distanciel pour une flexibilité maximale sans compromis sur la qualité.",
  },
  {
    src: "/Sécurité des systèmes.jpg",
    alt: "Formation – certifications",
    eyebrow: "Préparation aux certifications",
    desc: "Programmes intensifs alignés sur les certifications officielles des grands éditeurs.",
  },
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
  const slides = useMemo(
    () =>
      variant === "services"
        ? SERVICES_SLIDES
        : variant === "training"
        ? TRAINING_SLIDES
        : DEFAULT_SLIDES,
    [variant]
  );

  const [current, setCurrent]         = useState(0);
  const [prevIdx, setPrevIdx]         = useState<number | null>(null);
  const [imgKey, setImgKey]           = useState(0);
  const [autoEnabled, setAutoEnabled] = useState(true);

  const cardsTrackRef        = useRef<HTMLDivElement>(null);
  const currentRef           = useRef(0);
  const isProgrammaticScroll = useRef(false);
  const autoTimer            = useRef<ReturnType<typeof setInterval>>();
  const inactivityTimer      = useRef<ReturnType<typeof setTimeout>>();

  const palette = PALETTES[current % PALETTES.length];
  const total   = String(slides.length).padStart(2, "0");

  const updateCurrent = useCallback((idx: number) => {
    if (idx === currentRef.current) return;
    try {
      setPrevIdx(currentRef.current);
      setImgKey((k) => k + 1);
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

  const goTo = useCallback(
    (idx: number) => {
      try {
        const track = cardsTrackRef.current;
        if (!track || !track.parentElement) return;
        const targetX = track.clientWidth * idx;
        if (targetX < 0 || !isFinite(targetX)) return;
        isProgrammaticScroll.current = true;
        updateCurrent(idx);
        track.scrollLeft = targetX;
        setTimeout(() => {
          if (cardsTrackRef.current) isProgrammaticScroll.current = false;
        }, 100);
      } catch (e) {
        console.error("GoTo error:", e);
        isProgrammaticScroll.current = false;
      }
    },
    [updateCurrent]
  );

  useEffect(() => {
    if (!autoEnabled) return;
    autoTimer.current = setInterval(() => {
      goTo((currentRef.current + 1) % slides.length);
    }, 8000);
    return () => { if (autoTimer.current) clearInterval(autoTimer.current); };
  }, [autoEnabled, slides.length, goTo]);

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
          const idx     = Math.round(track.scrollLeft / track.clientWidth);
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

  const attachDrag = useCallback(
    (el: HTMLDivElement) => {
      let dragging = false, startX = 0, startLeft = 0;
      const onDown = (e: MouseEvent) => {
        dragging   = true;
        startX     = e.pageX;
        startLeft  = el.scrollLeft;
        el.style.cursor     = "grabbing";
        el.style.userSelect = "none";
        pauseAuto();
      };
      const onMove = (e: MouseEvent) => {
        if (!dragging) return;
        el.scrollLeft = startLeft - (e.pageX - startX);
      };
      const onUp = () => {
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
    },
    [pauseAuto]
  );

  useEffect(() => {
    const el = cardsTrackRef.current;
    if (!el) return;
    return attachDrag(el);
  }, [attachDrag]);

  return (
    <section
      className={`hs-root hs-root--${variant}`}
      aria-roledescription="carrousel"
      aria-label="Présentation FiSAFi"
      style={
        {
          "--hs-accent":      palette.accent,
          "--hs-accent-rgb":  palette.accentRgb,
          "--hs-accent-glow": `rgba(${palette.accentRgb}, 0.08)`,
        } as React.CSSProperties
      }
    >
      {/* ── Image zone ──────────────────────── */}
      <div className="hs-image-container">
        {prevIdx !== null && (
          <div
            key={`prev-${imgKey}`}
            className="hs-img-layer hs-img-layer--prev"
            aria-hidden="true"
          >
            <Image
              src={slides[prevIdx].src}
              alt=""
              fill
              sizes="(min-width: 980px) 55vw, 100vw"
              style={{ objectFit: "cover", objectPosition: "center top" }}
              draggable={false}
            />
          </div>
        )}
        <div key={`curr-${imgKey}`} className="hs-img-layer hs-img-layer--curr">
          <Image
            src={slides[current].src}
            alt={slides[current].alt}
            fill
            priority={current === 0}
            sizes="(min-width: 980px) 55vw, 100vw"
            style={{ objectFit: "cover", objectPosition: "center top" }}
            draggable={false}
          />
        </div>

        {/* Barre accent animée */}
        <div
          className="hs-image-bar"
          aria-hidden="true"
          style={{
            width: `${((current + 1) / slides.length) * 100}%`,
            background: `linear-gradient(to right, transparent, ${palette.accent}, transparent)`,
          }}
        />

        <div className="hs-slide-num" aria-hidden="true">
          {String(current + 1).padStart(2, "0")} / {total}
        </div>
      </div>

      {/* ── Text & cards panel ──────────────── */}
      <div className="hs-text-panel">
        {/* Barre de progression verticale */}
        <div className="hs-vbar" aria-hidden="true">
          <div
            className="hs-vbar-fill"
            style={{
              height: `${((current + 1) / slides.length) * 100}%`,
              background: palette.accent,
            }}
          />
        </div>

        {/* Track scrollable des cartes */}
        <div className="hs-cards-track" ref={cardsTrackRef}>
          {slides.map((slide, idx) => {
            const p   = PALETTES[idx % PALETTES.length];
            const num = String(idx + 1).padStart(2, "0");

            // Lignes horizontales du cahier
            const notebookLines = `repeating-linear-gradient(
              transparent 0px,
              transparent 27px,
              ${p.lineColor} 27px,
              ${p.lineColor} 28px
            )`;

            const isActive = idx === current;

            return (
              <div
                key={idx}
                className="hs-card-slide"
                role="group"
                aria-roledescription="diapositive"
                aria-label={`${idx + 1} sur ${slides.length} — ${slide.eyebrow}`}
                aria-hidden={!isActive}
              >
                <div className="hs-card-scene">
                  {/* Washi-tape pin */}
                  <div
                    className="hs-pin"
                    aria-hidden="true"
                    style={{
                      background: `linear-gradient(135deg,
                        ${hexRgba(p.accent, 0.55)},
                        ${hexRgba(p.accent, 0.82)}
                      )`,
                    }}
                  />

                  {/* Stack de feuilles */}
                  <div className="hs-stack">
                    {/* Feuille du fond — la plus éloignée */}
                    <div
                      className="hs-ghost hs-ghost--far"
                      aria-hidden="true"
                      style={{ background: p.ghostBg2 }}
                    />
                    {/* Feuille intermédiaire */}
                    <div
                      className="hs-ghost hs-ghost--near"
                      aria-hidden="true"
                      style={{ background: p.ghostBg1 }}
                    />

                    {/* Carte principale */}
                    <div
                      className="hs-card"
                      style={{ backgroundColor: p.cardBg }}
                    >
                      {/* Wrapper interne pour cliper les lignes + contenu */}
                      <div
                        className="hs-card-inner"
                        style={{
                          backgroundImage: notebookLines,
                          backgroundPositionY: "52px",
                        }}
                      >
                        {/* Ligne de marge verticale */}
                        <div
                          className="hs-card-margin"
                          aria-hidden="true"
                          style={{ background: hexRgba(p.accent, 0.18) }}
                        />

                        <div className="hs-card-body">
                          {/* Numéro */}
                          <span
                            className="hs-card-num"
                            style={{ color: p.accent }}
                          >
                            {num}
                          </span>

                          {/* Séparateur */}
                          <div
                            className="hs-card-rule"
                            aria-hidden="true"
                            style={{ background: hexRgba(p.accent, 0.32) }}
                          />

                          {/* Titre */}
                          <h2
                            className="hs-card-title"
                            style={{ color: p.inkDark }}
                          >
                            {slide.eyebrow}
                          </h2>

                          {/* Description */}
                          <p className="hs-card-desc">{slide.desc}</p>

                          {/* Petit tag accent */}
                          <div
                            className="hs-card-tag"
                            style={{
                              background: hexRgba(p.accent, 0.05),
                              color: p.accent,
                              borderColor: hexRgba(p.accent, 0),
                            }}
                          >
                            FISAFI Groupe
                          </div>
                        </div>
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

          <nav className="hs-dots" aria-label="Navigation du carrousel">
            {slides.map((slide, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { goTo(i); pauseAuto(); }}
                aria-label={`${slide.eyebrow} — diapositive ${i + 1} sur ${slides.length}`}
                aria-current={i === current}
                className={`hs-dot${i === current ? " hs-dot--active" : ""}`}
                style={
                  i === current
                    ? { background: PALETTES[i % PALETTES.length].accent }
                    : undefined
                }
              />
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}