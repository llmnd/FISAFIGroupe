"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

/* ─── Slide data ─── */
const DEFAULT_SLIDES = [
  { src: "https://res.cloudinary.com/dcs9vkwe0/video/upload/q_auto/f_auto/v1775477690/vzcc5hhwqnlvhi8exxn4.mp4",  alt: "FiSAFi – cybersécurité",   type: "video",
    eyebrow: "Cybersécurité Avancée",
    title:   "Protégé contre les <em>menaces</em>",
    sub:     "Solutions de sécurité de pointe immédiatement opérationnelles" },
  { src: "/7.jpeg",     alt: "FiSAFi – slide 1",         type: "image",
    eyebrow: "Infrastructure Résiliente",
    title:   "Performance et <em>sécurité garanties</em>",
    sub:     "Architecture cloud scalable et optimisée" },
  { src: "https://res.cloudinary.com/dcs9vkwe0/video/upload/q_auto/f_auto/v1775500291/hzpqyeflhuofqnit3nch.mp4",    alt: "FiSAFi – cybersécurité avancée", type: "video",
    eyebrow: "Conseil Technologique",
    title:   "Solutions IT de <em>classe mondiale</em>",
    sub:     "Réseaux, cybersécurité et conseil stratégique" },
  { src: "/2.jpeg",     alt: "FiSAFi – slide 3",         type: "image",
    eyebrow: "Transformation Digitale",
    title:   "Modernisez votre <em>infrastructure</em>",
    sub:     "Accompagnement expert vers le numérique" },
  { src: "https://res.cloudinary.com/dcs9vkwe0/video/upload/q_auto/f_auto/v1775477690/vzcc5hhwqnlvhi8exxn4.mp4",     alt: "FiSAFi – services managés", type: "video",
    eyebrow: "Services Managés",
    title:   "Support technique <em>24/7</em>",
    sub:     "Expertise IT au service de votre croissance" },
  { src: "/13.jpeg",    alt: "FiSAFi – slide 5",         type: "image",
    eyebrow: "Solutions Personnalisées",
    title:   "Vos défis, <em>nos solutions</em>",
    sub:     "Consultants certifiés à votre écoute" },
];

const SERVICES_SLIDES = [
  { src: "https://res.cloudinary.com/dcs9vkwe0/video/upload/q_auto/f_auto/v1775500291/hzpqyeflhuofqnit3nch.mp4", alt: "Services – réseaux",        type: "video",
    eyebrow: "Réseaux",        title: "Réseaux & <em>Télécommunications</em>",
    sub: "Conception, déploiement et maintenance d'infrastructures" },
  { src: "/6.jpeg", alt: "Services – infrastructure", type: "image",
    eyebrow: "Infrastructure", title: "Infrastructure IT & <em>Virtualisation</em>",
    sub: "Solutions serveurs, stockage et cloud" },
  { src: "/7.jpeg", alt: "Services – cybersécurité",  type: "image",
    eyebrow: "Sécurité",       title: "Cybersécurité & <em>Protection</em>",
    sub: "Audit, défense et conformité" },
  { src: "/8.jpeg", alt: "Services – conseil",        type: "image",
    eyebrow: "Conseil",        title: "Conseil & <em>Accompagnement</em>",
    sub: "Stratégie, audits et transformation digitale" },
];

const TRAINING_SLIDES = [
  { src: "/17.jpeg", alt: "Formation – 1", type: "image",
    eyebrow: "Formation",       title: "Sessions <em>Présentielles</em>",
    sub: "Formations pratiques animées par nos experts" },
  { src: "/18.jpeg", alt: "Formation – 2", type: "image",
    eyebrow: "E-Learning",      title: "Parcours <em>en ligne</em>",
    sub: "Contenu structuré et tutorat" },
  { src: "/1.jpeg",  alt: "Formation – 3", type: "image",
    eyebrow: "Hybride",         title: "Mode <em>Hybride</em>",
    sub: "Présentiel + digital pour une flexibilité optimale" },
  { src: "https://res.cloudinary.com/dcs9vkwe0/video/upload/q_auto/f_auto/v1775500291/hzpqyeflhuofqnit3nch.mp4", alt: "Formation – 4", type: "image",
    eyebrow: "Certifications",  title: "Préparation aux <em>certifications</em>",
    sub: "Cisco, CompTIA, Microsoft et autres" },
];

/* ─── Constants ─── */
const INTERVAL = 7000;
const FADE_BG  = 1400;
const FADE_TXT = 560;

function pad(n: number) { return String(n).padStart(2, "0"); }

/* ─── Component ─── */
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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const accent =
    variant === "services" ? "#1E90FF" :
    variant === "training" ? "#10b981" :
    "#A8996A";

  const transitionTo = (next: number) => {
    if (next === current || bgFading) return;
    setPrev(current);
    setBgFading(true);
    setTextFading(true);
    setCurrent(next);
    setTimeout(() => {
      if (videoRefs.current[next]) {
        const video = videoRefs.current[next];
        video.pause();
        video.currentTime = 0;
        video.play().catch(() => {});
      }
    }, 50);
    setTimeout(() => setTextFading(false), FADE_BG * 0.4);
    setTimeout(() => { setPrev(null); setBgFading(false); }, FADE_BG);
  };

  const goTo = (idx: number) => {
    clearInterval(timerRef.current!);
    transitionTo(idx);
    startInterval();
  };

  const startInterval = () => {
    timerRef.current = setInterval(() => {
      setCurrent((c) => {
        const next = (c + 1) % slides.length;
        setPrev(c);
        setBgFading(true);
        setTextFading(true);
        setTimeout(() => {
          if (videoRefs.current[next]) {
            const video = videoRefs.current[next];
            video.pause();
            video.currentTime = 0;
            video.play().catch(() => {});
          }
        }, 50);
        setTimeout(() => setTextFading(false), FADE_BG * 0.4);
        setTimeout(() => { setPrev(null); setBgFading(false); }, FADE_BG);
        return next;
      });
    }, INTERVAL);
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (videoRefs.current[current]) {
      const video = videoRefs.current[current];
      video.pause();
      video.currentTime = 0;
      video.play().catch(() => {});
    }
  }, [current]);

  useEffect(() => {
    startInterval();
    return () => clearInterval(timerRef.current!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="hs-root">

      {/* ══ Background slide stack ══ */}
      <div className="hs-bg-stack">
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
                ref={(ref) => { videoRefs.current[idx] = ref; }}
                src={slide.src}
                autoPlay
                muted
                loop
                playsInline
                preload={isMobile ? "none" : "auto"}
                onPause={(e) => {
                  const video = e.target as HTMLVideoElement;
                  video.play().catch(() => {});
                }}
                onEnded={(e) => {
                  const video = e.target as HTMLVideoElement;
                  video.currentTime = 0;
                  video.play().catch(() => {});
                }}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: isMobile ? "contain" : "cover",
                  objectPosition: "center",
                  backgroundColor: "#000"
                }}
              />
            ) : (
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                priority={idx === 0}
                sizes="100vw"
                style={{ objectFit: "cover", objectPosition: "center 5%" }}
              />
            )}
          </div>
        ))}

        {/* Overlays - AMÉLIORÉS pour meilleure lisibilité */}
        <div className="hs-ov-base" />
        <div className="hs-ov-gradient" />
        <div className="hs-ov-vignette" />
        
        {/* NOUVEAU: Overlay supplémentaire pour contraste texte */}
        <div className="hs-ov-contrast" />
      </div>

      {/* Top accent rule */}
      <div className="hs-rule-top" />

      {/* ══ Left nav dots ══ */}
      <nav className="hs-dots" aria-label="Navigation diapositives">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Diapositive ${i + 1}`}
            className={`hs-dot${i === current ? " hs-dot--active" : ""}`}
          />
        ))}
      </nav>

      {/* ══ Content ══ */}
      <div className="hs-content">
        <div className={`hs-inner${textFading ? " hs-inner--fading" : ""}`}>

          <p className="hs-eyebrow">
            <span className="hs-plate">{slides[current].eyebrow}</span>
          </p>

          <h1 className="hs-title">
            <span 
              className="hs-title-plate" 
              dangerouslySetInnerHTML={{ __html: slides[current].title }} 
            />
          </h1>

          <div className="hs-title-rule" />

          <p className="hs-sub">
            <span className="hs-sub-plate">{slides[current].sub}</span>
          </p>
        </div>

        <Link href="/services" className="hs-btn">
          <span className="hs-btn-label">Nos services</span>
          <span className="hs-btn-arrow" aria-hidden />
        </Link>
      </div>

      {/* ══ Slide counter ══ */}
      <div className="hs-counter" aria-hidden>
        <span className="hs-counter-cur">{pad(current + 1)}</span>
        <span className="hs-counter-line" />
        <span className="hs-counter-tot">{pad(slides.length)}</span>
      </div>

      {/* ══ Progress bar ══ */}
      <div className="hs-progress" key={current} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Jost:wght@200;300;400&display=swap');

        /* ─── Tokens ─── */
        .hs-root {
          --accent:   ${accent};
          --bg-fade:  ${FADE_BG}ms;
          --txt-fade: ${FADE_TXT}ms;
        }

        /* ─── Root ─── */
        .hs-root {
          position: relative;
          width: 100%;
          min-height: 100svh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          isolation: isolate;
          background: #0b1829;
        }

        /* ══ Background stack ══ */
        .hs-bg-stack {
          position: absolute;
          top: -10%; bottom: -4%; left: 0; right: 0;
          z-index: 0;
        }
        @media (min-width: 900px) {
          .hs-bg-stack { top: -18%; bottom: -6%; }
        }
        @media (max-width: 600px) {
          .hs-bg-stack { top: -5%; bottom: -2%; }
        }

        .hs-slide {
          position: absolute; inset: 0;
          opacity: 0;
          transition: opacity var(--bg-fade) cubic-bezier(0.4, 0, 0.2, 1);
          will-change: opacity;
        }
        .hs-slide--active  { opacity: 1; z-index: 2; }
        .hs-slide--leaving { opacity: 0; z-index: 1; }

        /* ─── Overlays - AMÉLIORÉS ─── */
        .hs-ov-base {
          position: absolute; inset: 0; z-index: 3;
          background: rgba(6, 15, 36, 0.55);
        }
        .hs-ov-gradient {
          position: absolute; inset: 0; z-index: 4;
          background: linear-gradient(
            180deg,
            rgba(6,15,36,0.15)  0%,
            rgba(6,15,36,0.08)  25%,
            rgba(6,15,36,0.55)  65%,
            rgba(6,15,36,0.88) 100%
          );
        }
        .hs-ov-vignette {
          position: absolute; inset: 0; z-index: 5;
          background: radial-gradient(
            ellipse 110% 110% at 50% 50%,
            transparent 30%,
            rgba(4,10,28,0.55) 100%
          );
        }
        /* NOUVEAU: Overlay de contraste pour texte */
        .hs-ov-contrast {
          position: absolute; inset: 0; z-index: 6;
          background: radial-gradient(
            ellipse 80% 100% at 50% 40%,
            transparent 45%,
            rgba(0,0,0,0.25) 100%
          );
          pointer-events: none;
        }

        /* ─── Top rule ─── */
        .hs-rule-top {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          opacity: 0.5;
          z-index: 10;
        }

        /* ══ Nav dots ══ */
        .hs-dots {
          position: absolute;
          left: 1.75rem; top: 50%;
          transform: translateY(-50%);
          display: flex; flex-direction: column; gap: 10px;
          z-index: 20;
          opacity: 0;
          animation: hsFadeIn 0.8s 1.6s forwards;
        }
        .hs-dot {
          width: 4px; height: 4px;
          border-radius: 50%;
          background: #fff;
          opacity: 0.28;
          border: none; padding: 0; cursor: pointer;
          transition: opacity 0.3s, transform 0.3s, background 0.3s;
        }
        .hs-dot--active { background: var(--accent); opacity: 1; transform: scale(1.6); }
        .hs-dot:hover:not(.hs-dot--active) { opacity: 0.55; }

        /* ══ Content ══ */
        .hs-content {
          position: relative; z-index: 15;
          text-align: center;
          display: flex; flex-direction: column; align-items: center;
          padding: 6rem 2rem 5rem;
          max-width: 720px; width: 100%;
        }

        /* Text fade wrapper */
        .hs-inner {
          width: 100%;
          transition: opacity var(--txt-fade) ease, transform var(--txt-fade) ease;
          opacity: 1; transform: translateY(0);
        }
        .hs-inner--fading { opacity: 0; transform: translateY(10px); }

        /* Eyebrow - AMÉLIORÉ */
        .hs-eyebrow {
          font-family: 'Jost', sans-serif;
          font-weight: 500;
          font-size: 10px;
          letter-spacing: 0.48em;
          text-transform: uppercase;
          margin-bottom: 1.8rem;
          text-shadow: 0 2px 12px rgba(0,0,0,0.6);
          opacity: 0;
          animation: hsFadeUp 0.8s 0.3s forwards;
        }

        /* Plates de fond pour lisibilité - AMÉLIORÉES */
        .hs-plate {
          display: inline-block;
          padding: 0.35rem 1rem;
          background: rgba(6, 15, 36, 0.65);
          backdrop-filter: blur(4px);
          color: #fff;
          font-weight: 500;
          letter-spacing: 0.48em;
          text-transform: uppercase;
          border-left: 2px solid var(--accent);
        }

        .hs-title-plate {
          display: inline-block;
          padding: 0.1em 0.3em;
          background: linear-gradient(135deg, rgba(6,15,36,0.7) 0%, rgba(6,15,36,0.55) 100%);
          backdrop-filter: blur(3px);
          line-height: 1.08;
        }
        .hs-title-plate em { 
          background: transparent; 
          color: var(--accent); 
          font-style: italic;
          font-weight: 400;
        }

        .hs-sub-plate {
          display: inline-block;
          padding: 0.2em 0.5em;
          background: rgba(6, 15, 36, 0.55);
          backdrop-filter: blur(3px);
        }

        /* Title - AMÉLIORÉ */
        .hs-title {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 300;
          font-size: clamp(2.8rem, 7vw, 5.2rem);
          line-height: 1.06;
          letter-spacing: -0.01em;
          color: #ffffff;
          margin-bottom: 1.2rem;
          text-shadow: 0 2px 12px rgba(0,0,0,0.7), 0 6px 28px rgba(0,0,0,0.5);
          opacity: 0;
          animation: hsFadeUp 0.9s 0.5s forwards;
        }
        .hs-title em { 
          font-style: italic; 
          color: var(--accent); 
          font-weight: 300;
          text-shadow: 0 0 8px rgba(0,0,0,0.5);
        }

        /* Thin rule */
        .hs-title-rule {
          width: 32px;
          height: 2px;
          background: var(--accent);
          margin: 0 auto 1.5rem;
          opacity: 0;
          animation: hsFadeIn 0.8s 0.65s forwards;
        }

        /* Subtitle - AMÉLIORÉ */
        .hs-sub {
          font-family: 'Jost', sans-serif;
          font-weight: 300;
          font-size: 14px;
          letter-spacing: 0.07em;
          line-height: 1.9;
          color: rgba(255,255,255,0.98);
          text-shadow: 0 1px 12px rgba(0,0,0,0.6);
          margin-bottom: 3rem;
          opacity: 0;
          animation: hsFadeUp 0.9s 0.7s forwards;
        }

        /* ── CTA button ── */
        .hs-btn {
          display: inline-flex; align-items: center; gap: 1.4rem;
          font-family: 'Jost', sans-serif;
          font-weight: 300; font-size: 11px;
          letter-spacing: 0.42em; text-transform: uppercase;
          color: #0b1829; text-decoration: none;
          border: none;
          padding: 1.4rem 3.2rem;
          background: #ffffff; cursor: pointer;
          position: relative; overflow: hidden;
          transition: background 0.35s, color 0.35s;
          opacity: 0; animation: hsFadeUp 0.9s 0.9s forwards;
          box-shadow: 0 4px 28px rgba(0,0,0,0.22);
        }
        .hs-btn::before {
          content: ''; position: absolute; inset: 0;
          background: var(--accent);
          transform: scaleX(0); transform-origin: left;
          transition: transform 0.38s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 0;
        }
        .hs-btn:hover::before { transform: scaleX(1); }
        .hs-btn:hover { color: #fff; }
        .hs-btn-label { position: relative; z-index: 1; }
        .hs-btn-arrow {
          position: relative; z-index: 1;
          display: inline-block; width: 18px; height: 1px;
          background: currentColor; flex-shrink: 0;
          transition: transform 0.2s;
        }
        .hs-btn-arrow::after {
          content: ''; position: absolute;
          right: 0; top: -3px; width: 7px; height: 7px;
          border-right: 1px solid currentColor;
          border-top: 1px solid currentColor;
          transform: rotate(45deg);
        }
        .hs-btn:hover .hs-btn-arrow { transform: translateX(4px); }

        /* ══ Slide counter ══ */
        .hs-counter {
          position: absolute; right: 1.75rem; bottom: 2rem;
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          z-index: 20; opacity: 0;
          animation: hsFadeIn 0.8s 1.8s forwards;
        }
        .hs-counter-cur {
          font-family: 'Jost', sans-serif;
          font-weight: 200; font-size: 11px; letter-spacing: 0.2em; color: #fff;
        }
        .hs-counter-line { width: 1px; height: 28px; background: var(--accent); opacity: 0.6; }
        .hs-counter-tot {
          font-family: 'Jost', sans-serif;
          font-weight: 200; font-size: 11px; letter-spacing: 0.2em;
          color: rgba(255,255,255,0.4);
        }

        /* ══ Progress bar ══ */
        .hs-progress {
          position: absolute; bottom: 0; left: 0;
          height: 2px;
          background: var(--accent);
          opacity: 0.7;
          z-index: 20;
          animation: hsProgress ${INTERVAL}ms linear forwards;
        }
        @keyframes hsProgress {
          from { width: 0%; }
          to   { width: 100%; }
        }

        /* ──── Video Styling ──── */
        video {
          display: block;
          pointer-events: none;
        }
        video::-webkit-media-controls {
          display: none !important;
        }
        video::-webkit-media-controls-panel {
          display: none !important;
        }
        video::-webkit-media-controls-play-button {
          display: none !important;
        }
        video::cue {
          background: transparent;
        }

        /* ─── Keyframes ─── */
        @keyframes hsFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hsFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* ─── Responsive ─── */
        @media (max-width: 600px) {
          .hs-dots    { display: none; }
          .hs-counter { right: 1rem; }
          .hs-content { padding: 5rem 1.5rem 4rem; }
          .hs-plate { letter-spacing: 0.3em; font-size: 9px; padding: 0.25rem 0.8rem; }
          .hs-sub { font-size: 12px; }
        }
        
        @media (min-width: 601px) and (max-width: 900px) {
          .hs-content { max-width: 580px; }
        }
      `}</style>
    </section>
  );
}