"use client";

import Image from "next/image";
import { useState } from "react";

const services = [
  {
    num: "01",
    name: "Réseaux & Télécommunications",
    fullDesc: "Nos experts conçoivent, déploient et modernisent des infrastructures robustes adaptées à vos besoins. Performance, sécurité et scalabilité à chaque étape.",
    img: "https://i.pinimg.com/originals/ff/04/31/ff0431d11ff6b73e937280252f58f371.gif",
    tags: ["Infrastructure", "Networking"],
    wide: false,
  },
  {
    num: "02",
    name: "Informatique & Infrastructures IT",
    fullDesc: "Audit de vos systèmes, identification des optimisations et déploiement de solutions IT performantes. Maintenance proactive et support continu garantis.",
    img: "https://i.pinimg.com/1200x/ba/98/28/ba9828f1dedbac62fde7444b2aab978a.jpg",
    tags: ["IT", "Infrastructure"],
    wide: false,
  },
  {
    num: "03",
    name: "Sécurité & Cybersécurité",
    fullDesc: "Protection complète de vos données et infrastructures. Audits, tests de pénétration et solutions de cyberdéfense adaptées aux menaces actuelles.",
    img: "https://i.pinimg.com/1200x/67/3c/54/673c54c87878338793b7bd30801ec1fc.jpg",
    tags: ["Sécurité", "Protection"],
    wide: false,
  },
  {
    num: "04",
    name: "Conseil & Accompagnement Stratégique",
    fullDesc: "Transformation digitale, études stratégiques, formations personnalisées et conseil expert pour anticiper les mutations numériques.",
    img: "https://i.pinimg.com/originals/bb/0c/c7/bb0cc783196fa9b2119864ff90eb5702.gif",
    tags: ["Conseil", "Stratégie"],
    wide: false,
  },
  {
    num: "05",
    name: "Fibre Optique & Ingénierie Réseau",
    fullDesc: "Études de déploiement, formations techniques et conseil expert pour garantir performance, débit et pérennité de votre infrastructure fibre.",
    img: "https://i.pinimg.com/1200x/23/e1/36/23e136d0c010468805abcc11b6adf877.jpg",
    tags: ["Fibre", "Réseau"],
    wide: true,
  },
  {
    num: "06",
    name: "Déploiement Réseau Fibre Optique",
    fullDesc: "Déploiement fibre aérien ou souterrain avec suivi rigoureux des travaux, contrôle qualité permanent et coordination complète des équipes terrain.",
    img: "https://i.pinimg.com/1200x/15/50/e0/1550e00f9f4ff4edf4ec89c2b826abd5.jpg",
    tags: ["Déploiement", "Suivi Chantier"],
    wide: true,
  },
];

const ArrowIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 17L17 7" /><path d="M7 7h10v10" />
  </svg>
);

export default function ServicesGrid() {
  const [selected, setSelected] = useState<typeof services[0] | null>(null);
  const [imageLoaded, setImageLoaded] = useState<{ [key: string]: boolean }>({});

  const handleImageLoaded = (key: string) => {
    setImageLoaded(prev => ({ ...prev, [key]: true }));
  };

  return (
    <>
      <style>{`
        .sg-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }
        .sg-card {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          cursor: pointer;
          background: #fafaf9;
          border: 0.5px solid rgba(0,0,0,.06);
          transition: transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s cubic-bezier(.22,1,.36,1);
        }
        .sg-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0,0,0,.09);
        }
        .sg-card-img-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 4/3;
          overflow: hidden;
          background: #f0ede8;
        }
        .sg-card-wide .sg-card-img-wrap {
          aspect-ratio: 16/7;
        }

        /* Skeleton Loader */
        .sg-skeleton {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            #e8e8e8 0%,
            #f0f0f0 50%,
            #e8e8e8 100%
          );
          background-size: 200% 100%;
          opacity: 1;
          transition: opacity 0.4s ease;
          z-index: 1;
        }

        .sg-skeleton.hidden {
          opacity: 0;
          pointer-events: none;
        }

        .sg-skeleton-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255,255,255,0.4) 50%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: sgShimmer 2s infinite;
        }

        @keyframes sgShimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }

        .sg-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .sg-card-img.loaded {
          opacity: 1;
        }

        .sg-card:hover .sg-card-img {
          transform: scale(1.04) !important;
        }
        .sg-arrow {
          position: absolute;
          bottom: 1rem;
          right: 1rem;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #fff;
          border: 0.5px solid rgba(0,0,0,.1);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transform: scale(.8);
          transition: opacity .25s, transform .3s cubic-bezier(.34,1.56,.64,1);
        }
        .sg-card:hover .sg-arrow {
          opacity: 1;
          transform: scale(1);
        }
        .sg-card-wide { grid-column: span 2; }

        @media (max-width: 640px) {
          .sg-grid { grid-template-columns: 1fr; }
          .sg-card-wide { grid-column: span 1; }
          .sg-card-wide .sg-card-img-wrap { aspect-ratio: 4/3; }
        }
        @media (min-width: 641px) and (max-width: 900px) {
          .sg-grid { grid-template-columns: repeat(2, 1fr); }
          .sg-card-wide { grid-column: span 2; }
        }

        .sg-modal-backdrop {
          position: fixed; inset: 0;
          background: rgba(4,4,8,.82);
          z-index: 1000;
          display: flex; align-items: center; justify-content: center;
          padding: 1.5rem;
          animation: sgFadeIn .3s ease both;
        }
        .sg-modal {
          background: #fff;
          border-radius: 28px;
          padding: 2.5rem;
          max-width: 560px; width: 100%;
          max-height: 80vh; overflow-y: auto;
          position: relative;
          animation: sgRise .4s cubic-bezier(.34,1.56,.64,1) both;
        }
        .sg-modal-close {
          position: absolute; top: 1.4rem; right: 1.4rem;
          width: 36px; height: 36px; border-radius: 50%;
          background: rgba(0,0,0,.05); border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 16px; color: #666;
          transition: background .2s, transform .3s;
        }
        .sg-modal-close:hover { background: #111; color: #fff; transform: rotate(90deg); }
        @keyframes sgFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes sgRise {
          from { opacity: 0; transform: scale(.94) translateY(16px) }
          to   { opacity: 1; transform: scale(1)  translateY(0) }
        }
      `}</style>

      <section id="services" style={{ padding: "4rem 1.25rem", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <p style={{ fontSize: ".68rem", letterSpacing: ".18em", textTransform: "uppercase", color: "#999", fontWeight: 500, marginBottom: ".4rem", fontFamily: "'Outfit', sans-serif" }}>
            Nos offres
          </p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 300, lineHeight: 1.1, letterSpacing: "-.03em", color: "#111" }}>
            Solutions<br />complètes
          </h2>
        </div>

        {/* Grid */}
        <div className="sg-grid">
          {/* Row 1: wide card first, then 1 normal */}
          {[services[4], services[0], services[1], services[2], services[3], services[5]].map((s) => (
            <div
              key={s.num}
              className={`sg-card${s.wide ? " sg-card-wide" : ""}`}
              onClick={() => setSelected(s)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(s); } }}
            >
              <div className="sg-card-img-wrap">
                {/* Skeleton Loader */}
                <div className={`sg-skeleton ${imageLoaded[s.num] ? "hidden" : ""}`}>
                  <div className="sg-skeleton-shimmer" />
                </div>

                {/* Actual Image */}
                <Image
                  src={s.img}
                  alt={s.name}
                  width={s.wide ? 800 : 400}
                  height={300}
                  className={`sg-card-img ${imageLoaded[s.num] ? "loaded" : ""}`}
                  sizes="(max-width:640px) 100vw, (max-width:900px) 50vw, 33vw"
                  onLoadingComplete={() => handleImageLoaded(s.num)}
                  priority={false}
                />
              </div>
              <div style={{ padding: ".9rem 1.1rem 1.15rem", fontFamily: "'Outfit', sans-serif" }}>
                <div style={{ fontSize: ".62rem", letterSpacing: ".15em", textTransform: "uppercase", color: "#aaa", fontWeight: 500, marginBottom: ".4rem", display: "flex", alignItems: "center", gap: ".4rem" }}>
                  <span style={{ width: 18, height: .5, background: "currentColor", opacity: .5, display: "inline-block" }} />
                  {s.num}
                </div>
                <div style={{ fontSize: ".95rem", fontWeight: 500, lineHeight: 1.3, color: "#1a1a1a", letterSpacing: "-.01em", marginBottom: ".5rem" }}>
                  {s.name}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: ".35rem" }}>
                  {s.tags.map((t) => (
                    <span key={t} style={{ fontSize: ".58rem", letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 500, padding: ".2rem .6rem", borderRadius: 40, background: "rgba(0,0,0,.04)", color: "#777", border: ".5px solid rgba(0,0,0,.07)" }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="sg-arrow" aria-hidden><ArrowIcon /></div>
            </div>
          ))}
        </div>
      </section>

      {/* Modal */}
      {selected && (
        <div className="sg-modal-backdrop" onClick={() => setSelected(null)}>
          <div className="sg-modal" onClick={(e) => e.stopPropagation()}>
            <button className="sg-modal-close" onClick={() => setSelected(null)} aria-label="Fermer">✕</button>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: ".65rem", letterSpacing: ".2em", textTransform: "uppercase", color: "#c06030", fontWeight: 500, marginBottom: ".8rem" }}>
              {selected.num}
            </p>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.2rem", fontWeight: 300, letterSpacing: "-.025em", color: "#111", marginBottom: "1.2rem", lineHeight: 1.2 }}>
              {selected.name}
            </h2>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: ".95rem", fontWeight: 390, color: "#555", lineHeight: 1.8 }}>
              {selected.fullDesc}
            </p>
          </div>
        </div>
      )}
    </>
  );
}