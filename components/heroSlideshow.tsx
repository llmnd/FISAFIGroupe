"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const SLIDES = [
  { src: "/1.jpeg", alt: "FiSAFi Groupe – slide 1" },
  { src: "/2.jpeg", alt: "FiSAFi Groupe – slide 2" },
  { src: "/3.jpeg", alt: "FiSAFi Groupe – slide 3" },
  { src: "/4.jpeg", alt: "FiSAFi Groupe – slide 4" },
  { src: "/5.jpeg", alt: "FiSAFi Groupe – slide 5" },
  { src: "/6.jpeg", alt: "FiSAFi Groupe – slide 6" },
];

const SLIDE_TEXT = [
  {
    eyebrow: "Ingénierie & Conseil Technologique",
    title: "Solutions IT de <em>classe mondiale</em>",
    sub: "Réseaux, cybersécurité et conseil stratégique",
  },
  {
    eyebrow: "Infrastructure Résiliente",
    title: "Performance et <em>sécurité garanties</em>",
    sub: "Architecture cloud scalable et optimisée",
  },
  {
    eyebrow: "Cybersécurité Avancée",
    title: "Votre <em>sécurité prioritaire</em>",
    sub: "Protection complète contre les menaces",
  },
  {
    eyebrow: "Transformation Digitale",
    title: "Modernisez votre <em>infrastructure</em>",
    sub: "Accompagnement expert vers le numérique",
  },
  {
    eyebrow: "Services Managés",
    title: "Support technique <em>24/7</em>",
    sub: "Expertise IT au service de votre croissance",
  },
  {
    eyebrow: "Solutions Personnalisées",
    title: "Vos défis, <em>nos solutions</em>",
    sub: "Consultants certifiés à votre écoute",
  },
];

const INTERVAL = 5000;      // ms between slides
const FADE_DURATION = 1400; // ms — must match CSS


export default function HeroSlideshow() {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev]       = useState<number | null>(null);
  const [fading, setFading]   = useState(false);
  const [textFading, setTextFading] = useState(false);
  const [nextText, setNextText] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setPrev(current);
      setFading(true);
      setTextFading(true);
      
      // Start text fade after a short delay
      const textTimer = setTimeout(() => {
        setNextText((current + 1) % SLIDES.length);
        setTextFading(false);
      }, FADE_DURATION * 0.4);
      
      setCurrent((c) => (c + 1) % SLIDES.length);
      setTimeout(() => {
        setPrev(null);
        setFading(false);
      }, FADE_DURATION);
      
      return () => clearTimeout(textTimer);
    }, INTERVAL);
    return () => clearInterval(id);
  }, [current]);

  // Keep the top-right cluster visible after the header scroll finishes
  useEffect(() => {
    const header = document.querySelector('.fh') as HTMLElement | null;
    if (!header) return;

    const headerHeight = header.offsetHeight || 0;
    // expose header height to CSS so the cluster can sit just below it
    document.documentElement.style.setProperty('--fh-height', `${headerHeight}px`);

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setStuck(window.scrollY >= headerHeight);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    // initial state
    setStuck(window.scrollY >= headerHeight);

    return () => {
      window.removeEventListener('scroll', onScroll);
      document.documentElement.style.removeProperty('--fh-height');
    };
  }, []);

  const goTo = (idx: number) => {
    if (idx === current || fading) return;
    setPrev(current);
    setFading(true);
    setTextFading(true);
    setCurrent(idx);
    
    // Start text fade after a short delay
    setTimeout(() => {
      setNextText(idx);
      setTextFading(false);
    }, FADE_DURATION * 0.4);
    
    setTimeout(() => { setPrev(null); setFading(false); }, FADE_DURATION);
  };

  /*
   * Header heights:
   *   Mobile  — L1(80) + L2(44) + L3(44) = 168px
   *   Desktop — L1(80) + L2(52)           = 132px
   */
  const MOB_HDR = 168;
  const DSK_HDR = 132;

  return (
    <section className="hs-root">
      {/* ── Background slides ── */}
      <div className="hs-bg-stack">
        {SLIDES.map((slide, idx) => (
          <div
            key={slide.src}
            className={`hs-slide ${
              idx === current
                ? "hs-slide--active"
                : idx === prev
                ? "hs-slide--leaving"
                : ""
            }`}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={idx === 0}
              sizes="10vw"
              style={{ objectFit: "cover", objectPosition: "center 5%" }}
            />
          </div>
        ))}

        <div className="hs-overlay-base" />
        <div className="hs-overlay-gradient" />
        <div className="hs-overlay-vignette" />
      </div>

      {/* ── Content ── */}
      <div className="hs-content">
        <div className={`hs-text-block${textFading ? " hs-text-fading" : ""}`}>
          <div className="hs-eyebrow">
            <span className="hs-eyebrow-line" />
            {SLIDE_TEXT[nextText].eyebrow}
          </div>

          <h1 className="hs-title" dangerouslySetInnerHTML={{ __html: SLIDE_TEXT[nextText].title }} />

          <p className="hs-sub">
            {SLIDE_TEXT[nextText].sub}
          </p>
        </div>

        <div className="hs-actions">
          <Link href="/services" className="hs-btn-primary">
            Nos services
          </Link>
          <Link href="#contact" className="hs-btn-ghost">
            Nous contacter <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="hs-dots" role="tablist" aria-label="Diapositives">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              role="tab"
              aria-selected={idx === current}
              aria-label={`Diapositive ${idx + 1}`}
              className={`hs-dot ${idx === current ? "hs-dot--active" : ""}`}
              onClick={() => goTo(idx)}
            />
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          TOP-RIGHT CLUSTER:
            1. Badge  "Dakar · Sénégal"  (top)
            2. Search button              (below badge)
         ══════════════════════════════════════════════ */}
      <div className={`hs-top-right${stuck ? ' hs-top-right--stuck' : ''}`}>
        {/* Badge */}
        <div className="hs-badge">
          <div className="hs-badge-label">Basé à</div>
          <div className="hs-badge-value">Dakar · Sénégal</div>
        </div>

        {/* Search — sits directly below the badge */}
        <div className={`hs-search-wrap${searchOpen ? " open" : ""}`}>
          <input
            className="hs-search-input"
            placeholder="Rechercher…"
            onKeyDown={e => {
              if (e.key === "Escape") setSearchOpen(false);
              if (e.key === "Enter") {
                const q = (e.target as HTMLInputElement).value.trim();
                if (q) window.location.href = `/search?q=${encodeURIComponent(q)}`;
              }
            }}
          />
        </div>
      </div>

      {/* Slide counter */}
      <div className="hs-counter" aria-hidden>
        <span className="hs-counter-current">
          {String(current + 1).padStart(2, "0")}
        </span>
        <span className="hs-counter-sep" />
        <span className="hs-counter-total">
          {String(SLIDES.length).padStart(2, "0")}
        </span>
      </div>

      {/* Progress bar */}
      <div className="hs-progress-bar" key={current} />

      <style>{`
        /* ════════════════════════════════
           HERO SLIDESHOW
        ════════════════════════════════ */

        .hs-root {
          position: relative;
          min-height: 100svh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          overflow: hidden;
        }

        /* ── Slide stack ── */
        /* Extend and shift background to crop top sky and cover any gap below */
        .hs-bg-stack { position: absolute; top: -10%; bottom: -4%; left: 0; right: 0; z-index: 0; }
        .hs-slide {
          position: absolute; inset: 0;
          opacity: 0;
          transition: opacity ${FADE_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1);
          will-change: opacity;
        }
        .hs-slide--active  { opacity: 1; z-index: 2; }
        .hs-slide--leaving { opacity: 0; z-index: 1; }

        /* ── Overlays ── */
        .hs-overlay-base {
          position: absolute; inset: 0; z-index: 3;
          background: rgba(6, 15, 36, 0.52);
        }
        .hs-overlay-gradient {
          position: absolute; inset: 0; z-index: 4;
          background: linear-gradient(
            180deg,
            rgba(6,15,36,0.15)  0%,
            rgba(6,15,36,0.0)  30%,
            rgba(6,15,36,0.45) 70%,
            rgba(6,15,36,0.78) 100%
          );
        }
        .hs-overlay-vignette {
          position: absolute; inset: 0; z-index: 5;
          background: radial-gradient(
            ellipse 110% 110% at 50% 50%,
            transparent 35%,
            rgba(4,10,28,0.5) 100%
          );
        }

        /* ── Content ── */
        .hs-content {
          position: relative; z-index: 10;
          padding: 3rem 1.75rem 5rem;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          min-height: 100svh;
        }
        @media (min-width: 600px) {
          .hs-content { padding: 3rem 3.5rem 5rem; }
        }
        @media (min-width: 900px) {
          .hs-content {
            padding: 4rem 4rem 6rem;
            min-height: 100svh;
          }
          /* stronger upward shift on desktop and extend lower edge to hide gaps */
          .hs-bg-stack { top: -18%; bottom: -6%; }
        }

        /* Eyebrow */
        .hs-eyebrow {
           font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
          font-size: 11px; font-weight: 600; letter-spacing: 0.36em; text-transform: uppercase;
          color: rgba(245, 166, 35, 0.95);
          display: flex; align-items: center; gap: 0.85rem;
          margin-bottom: 1.2rem;
          opacity: 0; animation: hsFadeUp 0.9s 0.3s forwards;
        }
        .hs-eyebrow-line {
          display: inline-block; width: 2rem; height: 1.5px;
          background: rgba(245,166,35,0.75);
          flex-shrink: 0; border-radius: 1px;
        }

        /* Title */
        .hs-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2.8rem, 8vw, 5rem);
          font-weight: 500; line-height: 1.04; letter-spacing: -0.01em;
          color: #ffffff; margin-bottom: 1.25rem;
          opacity: 0; animation: hsFadeUp 0.9s 0.5s forwards;
          text-shadow: 0 2px 8px rgba(0,0,0,0.45), 0 6px 18px rgba(0,0,0,0.5);
        }
        .hs-title em { font-style: italic; color: rgba(255,255,255,0.78); font-weight: 400; }

        /* Subtitle */
        .hs-sub {
           font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
          font-size: clamp(14px, 2.2vw, 18px);
          font-weight: 400; line-height: 1.7; letter-spacing: 0.02em;
          color: rgba(255,255,255,0.92); max-width: 44ch; margin-bottom: 2rem;
          opacity: 0; animation: hsFadeUp 0.9s 0.7s forwards;
        }

        /* Actions */
        .hs-actions {
          display: flex; gap: 1.25rem; flex-wrap: wrap; align-items: center;
          margin-bottom: 2.5rem;
          opacity: 0; animation: hsFadeUp 0.9s 0.9s forwards;
        }
        .hs-btn-primary {
            font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
          font-size: 12px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase;
          text-decoration: none; background: #fff; color: #0b1829;
          padding: 1rem 2.6rem; min-height: 52px;
          display: inline-flex; align-items: center;
          border: none; cursor: pointer;
          transition: background 0.18s, color 0.18s, transform 0.12s;
          box-shadow: 0 6px 20px rgba(0,0,0,0.18);
        }
        .hs-btn-primary:hover { background: #e55a00; color: #fff; transform: translateY(-2px); }
        .hs-btn-ghost {
           font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
          font-size: 11px; font-weight: 400; letter-spacing: 0.18em; text-transform: uppercase;
          text-decoration: none; color: rgba(255,255,255,0.80);
          display: inline-flex; align-items: center; gap: 0.45rem;
          min-height: 48px; background: none; border: none; cursor: pointer;
          transition: color 0.2s; text-shadow: 0 1px 6px rgba(0,0,0,0.4);
        }
        .hs-btn-ghost:hover { color: #fff; }

        /* Dots */
        .hs-dots {
          display: flex; gap: 0.5rem; align-items: center;
          opacity: 0; animation: hsFadeIn 1s 1.1s forwards;
        }
        .hs-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: rgba(255,255,255,0.35); border: none; cursor: pointer; padding: 0;
          transition: background 0.3s, transform 0.3s, width 0.3s;
        }
        .hs-dot--active { background: #f5a623; width: 22px; border-radius: 3px; }

        /* ══════════════════════════════════════════
           TOP-RIGHT CLUSTER
           — Badge on top, search button below it
        ══════════════════════════════════════════ */
        .hs-top-right {
          position: absolute;
          /* place badge below header to avoid being masked */
          top: 6rem;
          right: 1rem;
          z-index: 1300; /* above header when compact */
          display: flex;
          flex-direction: column;  /* vertical stack */
          align-items: flex-end;   /* right-align children */
          gap: 0.4rem;
          opacity: 0;
          animation: hsFadeIn 1.2s 1.2s forwards;
        }
        .hs-top-right--stuck { position: fixed; top: var(--fh-height, 0px); right: 1rem; z-index: 1400; animation: none; }
        @media (min-width: 900px) { .hs-top-right--stuck { right: 2.5rem; } }
        @media (min-width: 900px) {
          .hs-top-right {
            top: 1rem;
            right: 2.5rem;
          }
        }

        /* Badge */
        .hs-badge {
          padding: 0.35rem 0.9rem;
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: none;
          border-radius: 0;
        }
        .hs-badge-label {
          font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
          font-size: 8px; letter-spacing: 0.18em; text-transform: uppercase;
          color: rgba(255,255,255,0.44); margin-bottom: 2px;
        }
        .hs-badge-value {
          font-family: 'Cormorant Garamond', serif;
          font-size: 11px; font-style: italic;
          color: rgba(255,255,255,0.9);
        }

        /* Search */
        .hs-search-wrap {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0;
          background: transparent;
          border-radius: 999px;
          height: 36px;
          overflow: hidden;
          transition: background 160ms ease;
        }
        .hs-search-wrap.open {
          background: rgba(20, 20, 30, 0.72);
          backdrop-filter: blur(8px);
          padding: 0 6px;
        }
        .hs-search-input {
          width: 0; opacity: 0;
          background: transparent; border: none; outline: none;
          font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; font-size: 13px;
          color: #fff; padding: 0;
          transition: width 220ms ease, opacity 180ms ease;
        }
        .hs-search-input::placeholder { color: rgba(255,255,255,0.5); }
        .hs-search-wrap.open .hs-search-input {
          width: 130px; opacity: 1; padding: 0 6px 0 0;
        }
        .hs-search-btn {
          width: 36px; height: 36px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: #1a1a1a; border-radius: 50%;
          color: #fff; border: none; cursor: pointer;
          transition: background 0.18s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .hs-search-btn:hover { background: #f5a623; }

        /* Slide counter */
        .hs-counter {
          position: absolute; bottom: 2rem; right: 1.75rem; z-index: 10;
          display: flex; align-items: center; gap: 0.5rem;
          opacity: 0; animation: hsFadeIn 1s 1.2s forwards;
        }
        @media (min-width: 900px) { .hs-counter { right: 4rem; } }
        .hs-counter-current {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem; font-weight: 300; color: #fff; line-height: 1;
        }
        .hs-counter-sep {
          width: 1.5rem; height: 0.5px; background: rgba(255,255,255,0.35); display: block;
        }
        .hs-counter-total {
            font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
          font-size: 10px; color: rgba(255,255,255,0.45); letter-spacing: 0.1em;
        }

        /* Progress bar */
        .hs-progress-bar {
          position: absolute; bottom: 0; left: 0;
          height: 2px;
          background: linear-gradient(90deg, #e55a00, #f5a623);
          z-index: 11;
          animation: hsProgress ${INTERVAL}ms linear forwards;
          transform-origin: left;
        }
        @keyframes hsProgress {
          from { width: 0%; }
          to   { width: 100%; }
        }

        /* Text block transitions — minimaliste fade */
        .hs-text-block {
          opacity: 1;
          transition: opacity 600ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .hs-text-block.hs-text-fading {
          opacity: 0;
        }

        /* Keyframes */
        @keyframes hsFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hsFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </section>
  );
}