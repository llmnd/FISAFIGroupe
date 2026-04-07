"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

/* ─── Slide data ─── */
const DEFAULT_SLIDES = [
  { src: "https://res.cloudinary.com/dcs9vkwe0/video/upload/q_auto/f_auto/v1775477690/vzcc5hhwqnlvhi8exxn4.mp4", alt: "FiSAFi – cybersécurité", type: "video",
    eyebrow: "Cybersécurité Avancée",
    title: "Protégé contre\nles <em>menaces</em>",
     },
  { src: "https://res.cloudinary.com/dcs9vkwe0/video/upload/q_auto/f_auto/v1775477690/vzcc5hhwqnlvhi8exxn4.mp4", alt: "FiSAFi – slide 1", type: "video",
    eyebrow: "Infrastructure Résiliente",
    title: "Performance et\n<em>sécurité garanties</em>",
     },
  { src: "https://res.cloudinary.com/dcs9vkwe0/video/upload/q_auto/f_auto/v1775477690/vzcc5hhwqnlvhi8exxn4.mp4", alt: "FiSAFi – cybersécurité avancée", type: "video",
    eyebrow: "Conseil Technologique",
    title: "Solutions IT de\n<em>classe mondiale</em>",
    },
  { src: "https://res.cloudinary.com/dcs9vkwe0/video/upload/q_auto/f_auto/v1775477690/vzcc5hhwqnlvhi8exxn4.mp4", alt: "FiSAFi – slide 3", type: "video",
    eyebrow: "Transformation Digitale",
    title: "Modernisez votre\n<em>infrastructure</em>",
    sub: "Accompagnement expert\nvers le numérique" },
  { src: "https://res.cloudinary.com/dcs9vkwe0/video/upload/q_auto/f_auto/v1775477690/vzcc5hhwqnlvhi8exxn4.mp4", alt: "FiSAFi – services managés", type: "video",
    eyebrow: "Services Managés",
    title: "Support technique\n<em>24/7</em>",
    sub: "Expertise IT au service\nde votre croissance" },
  { src: "https://res.cloudinary.com/dcs9vkwe0/video/upload/q_auto/f_auto/v1775477690/vzcc5hhwqnlvhi8exxn4.mp4", alt: "FiSAFi – slide 5", type: "video",
    eyebrow: "Solutions Personnalisées",
    title: "Vos défis,\n<em>nos solutions</em>",
   },
];

const SERVICES_SLIDES = [
  { src: "https://res.cloudinary.com/dcs9vkwe0/video/upload/q_auto/f_auto/v1775500291/hzpqyeflhuofqnit3nch.mp4", alt: "Services – réseaux", type: "video",
    eyebrow: "Réseaux", title: "Réseaux &\n<em>Télécommunications</em>",
    sub: "Conception, déploiement\net maintenance d'infrastructures" },
  { src: "/6.jpeg", alt: "Services – infrastructure", type: "image",
    eyebrow: "Infrastructure", title: "Infrastructure IT &\n<em>Virtualisation</em>",
    sub: "Solutions serveurs,\nstockage et cloud" },
  { src: "/7.jpeg", alt: "Services – cybersécurité", type: "image",
    eyebrow: "Sécurité", title: "Cybersécurité &\n<em>Protection</em>",
    sub: "Audit, défense\net conformité" },
  { src: "/8.jpeg", alt: "Services – conseil", type: "image",
    eyebrow: "Conseil", title: "Conseil &\n<em>Accompagnement</em>",
    sub: "Stratégie, audits\net transformation digitale" },
];

const TRAINING_SLIDES = [
  { src: "/17.jpeg", alt: "Formation – 1", type: "image",
    eyebrow: "Formation", title: "Sessions\n<em>Présentielles</em>",
    sub: "Formations pratiques\nanimées par nos experts" },
  { src: "/18.jpeg", alt: "Formation – 2", type: "image",
    eyebrow: "E-Learning", title: "Parcours\n<em>en ligne</em>",
    sub: "Contenu structuré\net tutorat" },
  { src: "/1.jpeg", alt: "Formation – 3", type: "image",
    eyebrow: "Hybride", title: "Mode\n<em>Hybride</em>",
    sub: "Présentiel + digital\npour une flexibilité optimale" },
  { src: "https://res.cloudinary.com/dcs9vkwe0/video/upload/q_auto/f_auto/v1775500291/hzpqyeflhuofqnit3nch.mp4", alt: "Formation – 4", type: "video",
    eyebrow: "Certifications", title: "Préparation aux\n<em>certifications</em>",
    sub: "Cisco, CompTIA,\nMicrosoft et autres" },
];

const INTERVAL = 7000;
const FADE_BG  = 1200;
const FADE_TXT = 480;

function pad(n: number) { return String(n).padStart(2, "0"); }

export default function HeroSlideshow({
  variant = "home",
}: {
  variant?: "home" | "services" | "training";
}) {
  const slides =
    variant === "services" ? SERVICES_SLIDES :
    variant === "training" ? TRAINING_SLIDES :
    DEFAULT_SLIDES;

  const [current,    setCurrent]    = useState(0);
  const [prev,       setPrev]       = useState<number | null>(null);
  const [bgFading,   setBgFading]   = useState(false);
  const [textFading, setTextFading] = useState(false);
  const [isMobile,   setIsMobile]   = useState(false);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const accent = "#E8580A";

  // Play video with retry mechanism and cache handling
  const playVideoWithRetry = (videoElement: HTMLVideoElement | null, attempts = 3) => {
    if (!videoElement) return;
    
    const attemptPlay = (attempt: number) => {
      videoElement.play().catch((err) => {
        console.warn(`Video play attempt ${attempt} failed:`, err);
        if (attempt < attempts) {
          // Add small delay before retry
          setTimeout(() => attemptPlay(attempt + 1), 200 * attempt);
        } else {
          // On final failure, try reloading the video source
          videoElement.src = videoElement.src + (videoElement.src.includes('?') ? '&' : '?') + `t=${Date.now()}`;
          videoElement.load();
          setTimeout(() => {
            videoElement.play().catch(() => console.error("Final video play failed"));
          }, 100);
        }
      });
    };
    
    videoElement.pause();
    videoElement.currentTime = 0;
    attemptPlay(1);
  };

  const transitionTo = (next: number) => {
    if (next === current || bgFading) return;
    setPrev(current);
    setBgFading(true);
    setTextFading(true);
    setCurrent(next);
    setTimeout(() => {
      const v = videoRefs.current[next];
      if (v) playVideoWithRetry(v);
    }, 50);
    setTimeout(() => setTextFading(false), FADE_BG * 0.35);
    setTimeout(() => { setPrev(null); setBgFading(false); }, FADE_BG);
  };

  const startInterval = () => {
    timerRef.current = setInterval(() => {
      setCurrent((c) => {
        const next = (c + 1) % slides.length;
        setPrev(c);
        setBgFading(true);
        setTextFading(true);
        setTimeout(() => {
          const v = videoRefs.current[next];
          if (v) playVideoWithRetry(v);
        }, 50);
        setTimeout(() => setTextFading(false), FADE_BG * 0.35);
        setTimeout(() => { setPrev(null); setBgFading(false); }, FADE_BG);
        return next;
      });
    }, INTERVAL);
  };

  const goTo = (idx: number) => {
    clearInterval(timerRef.current!);
    transitionTo(idx);
    startInterval();
  };

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const v = videoRefs.current[current];
    if (v) {
      // Ensure video has cache busting query param before playing
      if (!v.src.includes('t=')) {
        v.src = slides[current].src + (slides[current].src.includes('?') ? '&' : '?') + `t=${Date.now()}`;
        v.load();
      }
      playVideoWithRetry(v);
    }
  }, [current, slides]);

  useEffect(() => {
    startInterval();
    return () => clearInterval(timerRef.current!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="hs-root">

      {/* ══ RIGHT — image panel ══ */}
      <div className="hs-media-panel">
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className={
              "hs-slide" +
              (idx === current ? " hs-slide--active"  : "") +
              (idx === prev    ? " hs-slide--leaving" : "")
            }
          >
            {slide.type === "video" ? (
              <video
                ref={(r) => { videoRefs.current[idx] = r; }}
                src={slide.src}
                autoPlay muted loop playsInline
                crossOrigin="anonymous"
                preload="metadata"
                controlsList="nodownload"
                onError={(e) => {
                  const video = e.currentTarget;
                  // Force reload on cache error
                  video.src = slide.src + (slide.src.includes('?') ? '&' : '?') + `t=${Date.now()}`;
                  video.load();
                  setTimeout(() => playVideoWithRetry(video), 100);
                }}
                style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center", display: "block" }}
              />
            ) : (
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                priority={idx === 0}
                sizes="60vw"
                style={{ objectFit: "cover", objectPosition: "center 15%" }}
              />
            )}
            {/* Dégradé gauche sur l'image — fondu vers le panel texte */}
            <div className="hs-media-fade" />
          </div>
        ))}
      </div>

      {/* ══ LEFT — text panel ══ */}
      <div className="hs-text-panel">

        {/* Barre de progression verticale */}
        <div className="hs-vbar">
          <div className="hs-vbar-fill" key={current} />
        </div>

        <div className={`hs-inner${textFading ? " hs-inner--fading" : ""}`}>

          {/* Eyebrow */}
          <div className="hs-eyebrow">
            <span className="hs-eyebrow-line" />
            <span className="hs-eyebrow-text">{slides[current].eyebrow}</span>
          </div>

          {/* Titre */}
          <h1
            className="hs-title"
            dangerouslySetInnerHTML={{ __html: slides[current].title.replace(/\n/g, "<br/>") }}
          />
        </div>

        {/* CTA */}
        <div className="hs-actions">
          <Link href="/services" className="hs-btn-primary">
            <span>Nos services</span>
            <span className="hs-btn-arrow" aria-hidden />
          </Link>
          <Link href="/#contact" className="hs-btn-ghost">
            <span>Nous contacter</span>
          </Link>
        </div>

        {/* Dots navigation */}
        <nav className="hs-dots" aria-label="Navigation">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Diapositive ${i + 1}`}
              className={`hs-dot${i === current ? " hs-dot--active" : ""}`}
            />
          ))}
        </nav>

        {/* Counter */}
        <div className="hs-counter" aria-hidden>
          <span className="hs-counter-cur">{pad(current + 1)}</span>
          <span className="hs-counter-sep">/</span>
          <span className="hs-counter-tot">{pad(slides.length)}</span>
        </div>
      </div>

      {/* Progress bar bottom */}
      <div className="hs-progress" key={current} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Jost:wght@200;300;400;500&display=swap');

        /* ─── Root ─── */
        .hs-root {
          --accent: ${accent};
          --bg:     #0b1520;
          --bg-fade: ${FADE_BG}ms;
          --txt-fade: ${FADE_TXT}ms;

          position: relative;
          width: 100%;
          min-height: 100svh;
          display: flex;
          flex-direction: row;
          overflow: hidden;
          background: var(--bg);
          isolation: isolate;
        }

        /* ══ MEDIA PANEL (droite) ══ */
        .hs-media-panel {
          position: absolute;
          top: 0; right: 0;
          width: 55%;
          height: 100%;
          z-index: 0;
        }

        @media (max-width: 900px) {
          .hs-media-panel {
            width: 100%;
            opacity: 1;
          }
        }

        .hs-slide {
          position: absolute; inset: 0;
          opacity: 0;
          transition: opacity var(--bg-fade) cubic-bezier(0.4, 0, 0.2, 1);
          will-change: opacity;
        }
        .hs-slide--active  { opacity: 1; z-index: 2; }
        .hs-slide--leaving { opacity: 0; z-index: 1; }

        /* Fondu gauche de l'image vers fond texte */
        .hs-media-fade {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to right,
            var(--bg) 0%,
            rgba(11, 21, 32, 0.7) 20%,
            rgba(11, 21, 32, 0.15) 50%,
            rgba(11, 21, 32, 0) 85%
          );
          z-index: 3;
          pointer-events: none;
        }

        @media (max-width: 900px) {
          .hs-media-fade {
            background: linear-gradient(
              135deg,
              rgba(11, 21, 32, 0.9) 0%,
              rgba(11, 21, 32, 0.6) 40%,
              rgba(11, 21, 32, 0.2) 80%
            );
          }
        }

        /* ══ TEXT PANEL (gauche) ══ */
        .hs-text-panel {
          position: relative;
          z-index: 10;
          width: 45%;
          min-height: 100svh;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 7rem 3.5rem 5rem 5rem;
          flex-shrink: 0;
        }

        @media (max-width: 1100px) {
          .hs-text-panel { padding: 7rem 2.5rem 5rem 3rem; width: 50%; }
        }

        @media (max-width: 900px) {
          .hs-text-panel {
            position: absolute;
            inset: 0;
            width: 100%;
            padding: 6rem 1.75rem 5rem;
            align-items: flex-start;
            justify-content: center;
            background: linear-gradient(to bottom, rgba(11,21,32,0.3) 0%, rgba(11,21,32,0.5) 50%, rgba(11,21,32,0.8) 100%);
          }
        }

        /* ─── Barre verticale de progression ─── */
        .hs-vbar {
          position: absolute;
          left: 2.5rem;
          top: 20%;
          bottom: 20%;
          width: 1px;
          background: rgba(255,255,255,0.08);
          overflow: hidden;
        }

        @media (max-width: 900px) {
          .hs-vbar { display: none; }
        }

        .hs-vbar-fill {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 0%;
          background: var(--accent);
          opacity: 0.8;
          animation: hsVbar ${INTERVAL}ms linear forwards;
        }
        @keyframes hsVbar {
          from { height: 0%; }
          to   { height: 100%; }
        }

        /* ─── Text fade ─── */
        .hs-inner {
          transition: opacity var(--txt-fade) ease, transform var(--txt-fade) ease;
          opacity: 1;
          transform: translateY(0);
        }
        .hs-inner--fading {
          opacity: 0;
          transform: translateY(12px);
        }

        /* ─── Eyebrow ─── */
        .hs-eyebrow {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          margin-bottom: 1.75rem;
          opacity: 0;
          animation: hsFadeUp 0.8s 0.2s forwards;
        }
        .hs-eyebrow-line {
          display: block;
          width: 2rem;
          height: 1px;
          background: var(--accent);
          flex-shrink: 0;
        }
        .hs-eyebrow-text {
          font-family: 'Jost', sans-serif;
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.38em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.55);
        }

        /* ─── Title ─── */
        .hs-title {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 300;
          font-size: clamp(3rem, 5.5vw, 5.5rem);
          line-height: 1.04;
          letter-spacing: -0.02em;
          color: #fff;
          margin: 0 0 1.75rem 0;
          opacity: 0;
          animation: hsFadeUp 0.9s 0.35s forwards;
        }
        .hs-title em {
          font-style: italic;
          color: var(--accent);
          font-weight: 300;
        }

        /* ─── Sub ─── */
        .hs-sub {
          font-family: 'Jost', sans-serif;
          font-weight: 300;
          font-size: 13px;
          line-height: 1.9;
          letter-spacing: 0.04em;
          color: rgba(255,255,255,0.42);
          margin: 0 0 2.75rem 0;
          opacity: 0;
          animation: hsFadeUp 0.9s 0.5s forwards;
        }

        /* ─── Actions ─── */
        .hs-actions {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          flex-wrap: wrap;
          margin-top: auto;
          opacity: 0;
          animation: hsFadeUp 0.9s 0.65s forwards;
        }

        .hs-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 1.25rem;
          font-family: 'Jost', sans-serif;
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.36em;
          text-transform: uppercase;
          color: #0b1520;
          background: #fff;
          text-decoration: none;
          padding: 1.1rem 2.4rem;
          position: relative;
          overflow: hidden;
          transition: color 0.35s;
          flex-shrink: 0;
        }
        .hs-btn-primary::before {
          content: '';
          position: absolute; inset: 0;
          background: var(--accent);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.38s cubic-bezier(0.4,0,0.2,1);
          z-index: 0;
        }
        .hs-btn-primary:hover::before { transform: scaleX(1); }
        .hs-btn-primary:hover { color: #fff; }
        .hs-btn-primary span { position: relative; z-index: 1; }

        .hs-btn-arrow {
          position: relative;
          z-index: 1;
          display: inline-block;
          width: 16px;
          height: 1px;
          background: currentColor;
          flex-shrink: 0;
          transition: transform 0.25s;
        }
        .hs-btn-arrow::after {
          content: '';
          position: absolute;
          right: 0; top: -3px;
          width: 6px; height: 6px;
          border-right: 1px solid currentColor;
          border-top: 1px solid currentColor;
          transform: rotate(45deg);
        }
        .hs-btn-primary:hover .hs-btn-arrow { transform: translateX(4px); }

        .hs-btn-ghost {
          font-family: 'Jost', sans-serif;
          font-size: 10px;
          font-weight: 300;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          text-decoration: none;
          transition: color 0.25s;
          border-bottom: 1px solid rgba(255,255,255,0.12);
          padding-bottom: 2px;
        }
        .hs-btn-ghost:hover { color: rgba(255,255,255,0.8); }

        /* ─── Dots ─── */
        .hs-dots {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 3.5rem;
          opacity: 0;
          animation: hsFadeIn 0.8s 1s forwards;
        }
        .hs-dot {
          width: 20px;
          height: 1px;
          background: rgba(255,255,255,0.2);
          border: none;
          padding: 0;
          cursor: pointer;
          transition: background 0.3s, width 0.3s;
        }
        .hs-dot--active {
          background: var(--accent);
          width: 40px;
        }
        .hs-dot:hover:not(.hs-dot--active) {
          background: rgba(255,255,255,0.45);
        }

        /* ─── Counter ─── */
        .hs-counter {
          position: absolute;
          bottom: 2.5rem;
          left: 5rem;
          display: flex;
          align-items: baseline;
          gap: 0.4rem;
          opacity: 0;
          animation: hsFadeIn 0.8s 1.2s forwards;
        }

        @media (max-width: 900px) {
          .hs-counter { left: 1.75rem; }
        }

        .hs-counter-cur {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-weight: 300;
          color: #fff;
          letter-spacing: 0.04em;
        }
        .hs-counter-sep {
          font-size: 11px;
          color: rgba(255,255,255,0.2);
          margin: 0 2px;
        }
        .hs-counter-tot {
          font-family: 'Jost', sans-serif;
          font-size: 10px;
          font-weight: 200;
          color: rgba(255,255,255,0.3);
          letter-spacing: 0.1em;
        }

        /* ─── Progress bar ─── */
        .hs-progress {
          position: absolute;
          bottom: 0; left: 0;
          height: 1.5px;
          background: var(--accent);
          opacity: 0.6;
          z-index: 30;
          animation: hsProgress ${INTERVAL}ms linear forwards;
        }
        @keyframes hsProgress {
          from { width: 0%; }
          to   { width: 100%; }
        }

        /* ─── Keyframes ─── */
        @keyframes hsFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hsFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* ─── Video ─── */
        video { display: block; pointer-events: none; }
        video::-webkit-media-controls { display: none !important; }

        /* ─── Mobile ─── */
        @media (max-width: 600px) {
          .hs-title { font-size: clamp(2.4rem, 10vw, 3.5rem); }
          .hs-text-panel { padding: 6rem 1.5rem 5rem; }
          .hs-counter { left: 1.5rem; }
          .hs-actions { gap: 1rem; }
        }
      `}</style>
    </section>
  );
}