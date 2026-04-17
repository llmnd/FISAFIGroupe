"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

const DEFAULT_SLIDES = [
  { src: "https://i.pinimg.com/1200x/67/3c/54/673c54c87878338793b7bd30801ec1fc.jpg", alt: "FiSAFi – cybersécurité", type: "image",
    eyebrow: "Cybersécurité Avancée",
    title: "Protégé contre\nles <em>menaces</em>" },
  { src: "https://i.pinimg.com/1200x/2e/30/d8/2e30d8bd3a1f97b8301829256c21a91b.jpg", alt: "FiSAFi – slide 1", type: "image",
    eyebrow: "Infrastructure Résiliente",
    title: "Performance et\n<em>sécurité garanties</em>" },
  { src: "https://i.pinimg.com/1200x/1a/52/56/1a52565e2ab3c33edce6e907dd0482a6.jpg", alt: "FiSAFi – cybersécurité avancée", type: "image",
    eyebrow: "Conseil Technologique",
    title: "Solutions IT de\n<em>classe mondiale</em>" },
  { src: "https://i.pinimg.com/736x/11/3e/07/113e07e1f302bfe5beb3cbc89bb0bfff.jpg", alt: "FiSAFi – slide 3", type: "image",
    eyebrow: "Transformation Digitale",
    title: "Modernisez votre\n<em>infrastructure</em>" },
  { src: "https://i.pinimg.com/1200x/8b/44/d3/8b44d3273328cbd867f3c7307632d63d.jpg", alt: "FiSAFi – services managés", type: "image",
    eyebrow: "Services Managés",
    title: "Support technique\n<em>24/7</em>" },
  { src: "https://i.pinimg.com/1200x/19/e4/bf/19e4bfa6fe888fb8abe79d75fe3f3f9e.jpg", alt: "FiSAFi – slide 5", type: "image",
    eyebrow: "Solutions Personnalisées",
    title: "Vos défis,\n<em>nos solutions</em>" },
];

const SERVICES_SLIDES = [
  { src: "https://i.pinimg.com/736x/80/41/99/8041992ed3076083dc5ad1e7f5c90181.jpg", alt: "Services – réseaux", type: "image",
    eyebrow: "Réseaux", title: "Réseaux &\n<em>Télécommunications</em>" },
  { src: "https://i.pinimg.com/1200x/e8/ce/0f/e8ce0fd1ffe096dee7d7b85b261b626f.jpg", alt: "Services – infrastructure", type: "image",
    eyebrow: "Infrastructure", title: "Infrastructure IT &\n<em>Virtualisation</em>" },
  { src: "https://i.pinimg.com/1200x/67/3c/54/673c54c87878338793b7bd30801ec1fc.jpg", alt: "Services – cybersécurité", type: "image",
    eyebrow: "Sécurité", title: "Cybersécurité &\n<em>Protection</em>" },
  { src: "https://i.pinimg.com/1200x/41/e4/8f/41e48f226597daf5235a91aabd887093.jpg", alt: "Services – conseil", type: "image",
    eyebrow: "Conseil", title: "Conseil &\n<em>Accompagnement</em>" },
];

const TRAINING_SLIDES = [
  { src: "/17.jpeg", alt: "Formation – 1", type: "image",
    eyebrow: "Formation", title: "Sessions\n<em>Présentielles</em>" },
  { src: "https://i.pinimg.com/1200x/0d/30/9b/0d309bbc802545f9ef289357a3179b89.jpg", alt: "Formation – 2", type: "image",
    eyebrow: "E-Learning", title: "Parcours\n<em>en ligne</em>" },
  { src: "https://i.pinimg.com/1200x/e3/b6/bf/e3b6bf124f2adde2af34ca329537e957.jpg", alt: "Formation – 3", type: "image",
    eyebrow: "Hybride", title: "Mode\n<em>Hybride</em>" },
  { src: "https://i.pinimg.com/1200x/89/99/d7/8999d73efcc283ab877e96e23278ae03.jpg", alt: "Formation – 4", type: "image",
    eyebrow: "Certifications", title: "Préparation aux\n<em>certifications</em>" },
];

const INTERVAL = 7000;
const FADE_BG  = 1200;
const FADE_TXT = 480;

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
  const slides =
    variant === "services" ? SERVICES_SLIDES :
    variant === "training" ? TRAINING_SLIDES :
    DEFAULT_SLIDES;

  const [current,    setCurrent]    = useState(0);
  const [prev,       setPrev]       = useState<number | null>(null);
  const [bgFading,   setBgFading]   = useState(false);
  const [textFading, setTextFading] = useState(false);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const accent = "#E8580A";

  const playVideoWithRetry = (videoElement: HTMLVideoElement | null, attempts = 3) => {
    if (!videoElement) return;
    const attemptPlay = (attempt: number) => {
      videoElement.play().catch(() => {
        if (attempt < attempts) {
          setTimeout(() => attemptPlay(attempt + 1), 200 * attempt);
        } else {
          const baseUrl = videoElement.src.split("?")[0];
          videoElement.src = baseUrl + `?t=${Date.now()}`;
          videoElement.load();
          setTimeout(() => videoElement.play().catch(() => {}), 100);
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
    setTimeout(() => { const v = videoRefs.current[next]; if (v) playVideoWithRetry(v); }, 80);
    setTimeout(() => setTextFading(false), FADE_BG * 0.4);
    setTimeout(() => { setPrev(null); setBgFading(false); }, FADE_BG);
  };

  const startInterval = () => {
    timerRef.current = setInterval(() => {
      setCurrent((c) => {
        const next = (c + 1) % slides.length;
        setPrev(c);
        setBgFading(true);
        setTextFading(true);
        setTimeout(() => { const v = videoRefs.current[next]; if (v) playVideoWithRetry(v); }, 80);
        setTimeout(() => setTextFading(false), FADE_BG * 0.4);
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
    const v = videoRefs.current[current];
    if (v && slides[current].type === "video") {
      if (!v.src.includes("t=")) {
        v.src = slides[current].src + `?t=${Date.now()}`;
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

      {/* ══ ZONE IMAGE ══ */}
      <div className="hs-media-wrap">
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
                muted loop playsInline
                crossOrigin="anonymous"
                preload="metadata"
                controlsList="nodownload"
                onError={(e) => {
                  const video = e.currentTarget;
                  video.src = slide.src + `?t=${Date.now()}`;
                  video.load();
                  setTimeout(() => playVideoWithRetry(video), 100);
                }}
              />
            ) : (
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                priority={idx === 0}
                sizes="100vw"
                style={{ objectFit: "contain", objectPosition: "top" }}
              />
            )}
          </div>
        ))}
      </div>

      {/* ══ ZONE TEXTE (sous l'image) ══ */}
      <div className="hs-text-panel">

        <div className="hs-vbar">
          <div className="hs-vbar-fill" key={current} />
        </div>

        <div className={`hs-inner${textFading ? " hs-inner--fading" : ""}`}>
          <div className="hs-eyebrow">
            <span className="hs-eyebrow-line" />
            <span className="hs-eyebrow-text">{slides[current].eyebrow}</span>
          </div>
          <h1
            className="hs-title"
            dangerouslySetInnerHTML={{ __html: slides[current].title.replace(/\n/g, "<br/>") }}
          />
        </div>

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
                onClick={() => goTo(i)}
                aria-label={`Diapositive ${i + 1}`}
                className={`hs-dot${i === current ? " hs-dot--active" : ""}`}
              />
            ))}
          </nav>
        </div>

      </div>

      <style>{`

        .hs-root {
          --accent: ${accent};
          --bg: #0b1520;
          --bg-fade: ${FADE_BG}ms;
          --txt-fade: ${FADE_TXT}ms;
          width: 100%;
          display: flex;
          flex-direction: column;
          background: var(--bg);
          overflow: hidden;
          isolation: isolate;
        }

        /* ── Zone image ── */
        .hs-media-wrap {
          position: relative;
          width: 100%;
          /* hauteur responsive : grande sur desktop, raisonnable sur mobile */
          height: clamp(260px, 52vw, 68vh);
          flex-shrink: 0;
          background: var(--bg);
        }

        .hs-slide {
          position: absolute; inset: 0;
          opacity: 0;
          transform: scale(0.97) translateZ(0);
          transition: opacity var(--bg-fade) cubic-bezier(0.25,0.46,0.45,0.94),
                      transform var(--bg-fade) cubic-bezier(0.25,0.46,0.45,0.94);
          will-change: opacity, transform;
        }
        .hs-slide--active {
          opacity: 1; z-index: 2;
          transform: scale(1) translateZ(0);
        }
        .hs-slide--leaving {
          opacity: 0; z-index: 1;
          transform: scale(1.03) translateZ(0);
        }

        .hs-slide video {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: contain;
          object-position: top;
          display: block;
          pointer-events: none;
        }
        .hs-slide video::-webkit-media-controls { display: none !important; }

        /* ── Zone texte ── */
        .hs-text-panel {
          position: relative;
          width: 100%;
          background: var(--bg);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 2.5rem 2rem 2.5rem;
          gap: 2rem;
        }

        .hs-vbar {
          position: absolute;
          left: 2rem; top: 1.5rem; bottom: 1.5rem;
          width: 1px;
          background: rgba(255,255,255,0.07);
          overflow: hidden;
        }
        @media (max-width: 600px) { .hs-vbar { display: none; } }

        .hs-vbar-fill {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 0%;
          background: var(--accent);
          opacity: 0.8;
          animation: hsVbar ${INTERVAL}ms linear forwards;
        }
        @keyframes hsVbar { from { height: 0%; } to { height: 100%; } }

        /* ── Inner text ── */
        .hs-inner {
          transition: opacity var(--txt-fade) cubic-bezier(0.25,0.46,0.45,0.94),
                      transform var(--txt-fade) cubic-bezier(0.25,0.46,0.45,0.94);
          opacity: 1;
          transform: translateY(0);
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .hs-inner--fading { opacity: 0; transform: translateY(10px); }

        .hs-eyebrow {
          display: flex; align-items: center; justify-content: center;
          gap: 0.85rem; margin-bottom: 0.9rem;
          opacity: 0;
          animation: hsFadeUp var(--txt-fade) cubic-bezier(0.25,0.46,0.45,0.94) 0.02s forwards;
        }
        .hs-eyebrow-line {
          display: block; width: 1.5rem; height: 1px;
          background: var(--accent); flex-shrink: 0;
        }
        .hs-eyebrow-text {
          font-family: 'Jost', sans-serif;
          font-size: 9px; font-weight: 400;
          letter-spacing: 0.38em; text-transform: uppercase;
          color: rgba(255,255,255,0.5);
        }

        .hs-title {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 300;
          font-size: clamp(2.2rem, 5vw, 4rem);
          line-height: 1.1;
          letter-spacing: -0.02em;
          color: #fff;
          margin: 0;
          opacity: 0;
          animation: hsFadeUp var(--txt-fade) cubic-bezier(0.25,0.46,0.45,0.94) 0.08s forwards;
        }
        .hs-title em { font-style: italic; color: var(--accent); font-weight: 300; }

        /* ── Bottom ── */
        .hs-bottom {
          display: flex; flex-direction: column;
          align-items: center; gap: 1.4rem;
        }

        .hs-actions {
          display: flex; flex-direction: column;
          align-items: center; gap: 1.1rem;
          opacity: 0;
          animation: hsFadeUp var(--txt-fade) cubic-bezier(0.25,0.46,0.45,0.94) 0.14s forwards;
        }

        .hs-btn-primary {
          display: inline-flex; align-items: center; gap: 0.8rem;
          font-family: 'Jost', sans-serif;
          font-size: 9px; font-weight: 400;
          letter-spacing: 0.36em; text-transform: uppercase;
          color: rgba(255,255,255,0.55);
          text-decoration: none;
          transition: color 0.35s cubic-bezier(0.25,0.46,0.45,0.94);
        }
        .hs-btn-primary:hover { color: rgba(255,255,255,0.95); }

        .hs-btn-arrow {
          display: inline-block;
          width: 12px; height: 1px;
          background: currentColor; flex-shrink: 0;
          position: relative;
          transition: transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94);
        }
        .hs-btn-arrow::after {
          content: ''; position: absolute;
          right: 0; top: -2px;
          width: 4px; height: 4px;
          border-right: 0.5px solid currentColor;
          border-top: 0.5px solid currentColor;
          transform: rotate(45deg);
        }
        .hs-btn-primary:hover .hs-btn-arrow { transform: translateX(3px); }

        .hs-btn-ghost {
          display: inline-flex; align-items: center; gap: 0.8rem;
          font-family: 'Jost', sans-serif;
          font-size: 9px; font-weight: 300;
          letter-spacing: 0.28em; text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          text-decoration: none;
          transition: color 0.35s cubic-bezier(0.25,0.46,0.45,0.94);
        }
        .hs-btn-ghost:hover { color: rgba(255,255,255,0.9); }

        .hs-dots {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          opacity: 0;
          animation: hsFadeIn var(--txt-fade) cubic-bezier(0.25,0.46,0.45,0.94) 0.18s forwards;
        }
        .hs-dot {
          width: 20px; height: 1px;
          background: rgba(255,255,255,0.18);
          border: none; padding: 0; cursor: pointer;
          transition: background 0.35s cubic-bezier(0.25,0.46,0.45,0.94),
                      width 0.35s cubic-bezier(0.25,0.46,0.45,0.94);
        }
        .hs-dot--active { background: var(--accent); width: 40px; }
        .hs-dot:hover:not(.hs-dot--active) { background: rgba(255,255,255,0.45); }

        @keyframes hsFadeUp {
          from { opacity: 0; transform: translateY(14px); }
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