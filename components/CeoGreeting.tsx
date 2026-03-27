"use client";

import React from "react";

// ── CEO Greeting Component ──────────────────────────────────────────
const CEO_STYLES = `
  .ceo-greeting {
    display: inline-flex;
    align-items: center;
    gap: 0.85rem;
    margin-bottom: 2.2rem;
    cursor: pointer;
  }
  .ceo-avatar-hero {
    width: 48px; height: 48px;
    border-radius: 50%;
    overflow: hidden;
    border: 1.5px solid rgba(255,255,255,0.25);
    flex-shrink: 0;
    transition: border-color 0.2s, transform 0.2s;
  }
  .ceo-greeting:hover .ceo-avatar-hero {
    border-color: rgba(255,255,255,0.6);
    transform: scale(1.05);
  }
  .ceo-greeting:hover .ceo-bonjour { opacity: 1; }
  .ceo-bonjour {
    font-family: "Cormorant Garamond", serif;
    font-style: italic;
    font-size: 1.6rem;
    font-weight: 300;
    color: rgba(255,255,255,0.85);
    opacity: 0.75;
    transition: opacity 0.2s;
    line-height: 1;
  }
  .ceo-hint {
    font-family: "Outfit", sans-serif;
    font-size: 0.62rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.35);
    margin-top: 0.2rem;
  }
  .ceo-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(5,15,40,0.7);
    backdrop-filter: blur(6px);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }
  .ceo-modal-overlay.open {
    opacity: 1;
    pointer-events: all;
  }
  .ceo-modal {
    background: #f8fafc;
    max-width: 460px;
    width: 100%;
    padding: 2.4rem;
    position: relative;
    transform: translateY(20px) scale(0.97);
    transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1);
  }
  .ceo-modal-overlay.open .ceo-modal {
    transform: translateY(0) scale(1);
  }
  .ceo-modal::before {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, #1e40af, #3b82f6);
  }
  .ceo-modal-close {
    position: fixed;
    top: 1.2rem; right: 1.4rem;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 50%;
    width: 36px; height: 36px;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.85rem;
    color: #64748b;
    cursor: pointer;
    line-height: 1;
    z-index: 1000000;
    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    transition: color 0.15s, background 0.15s;
  }
  .ceo-modal-close:hover { color: #1e40af; background: #f1f5f9; }
  .ceo-modal-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.4rem;
  }
  .ceo-modal-avatar {
    width: 52px; height: 52px;
    border-radius: 50%;
    overflow: hidden;
    border: 2px solid #e2e8f0;
    flex-shrink: 0;
  }
  .ceo-modal-name {
    font-family: "Outfit", sans-serif;
    font-size: 0.85rem;
    font-weight: 500;
    color: #0f172a;
  }
  .ceo-modal-role {
    font-size: 0.72rem;
    color: #64748b;
    margin-top: 0.15rem;
    letter-spacing: 0.03em;
  }
  .ceo-modal-body {
    font-family: "Cormorant Garamond", serif;
    font-size: 1.15rem;
    font-weight: 300;
    color: #1e293b;
    line-height: 1.75;
    border-left: 2px solid #1e40af;
    padding-left: 1rem;
  }
  .ceo-modal-sig {
    margin-top: 1.4rem;
    font-family: "Outfit", sans-serif;
    font-size: 0.72rem;
    color: #94a3b8;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
`;

export default function CeoGreeting() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const tag = document.createElement("style");
    tag.id = "ceo-styles";
    tag.textContent = CEO_STYLES;
    if (!document.getElementById("ceo-styles")) {
      document.head.appendChild(tag);
    }
    return () => {
      const el = document.getElementById("ceo-styles");
      if (el) el.remove();
    };
  }, []);

  return (
    <>
      {/* Trigger */}
      <div className="ceo-greeting" onClick={() => setOpen(true)} role="button" aria-label="Message du gérant">
        <div className="ceo-avatar-hero">
          <img
            src="/ceo-avatar.png"
            alt="Abdel-Salam Abdel-Aziz Haggar"
            width={48} height={48}
            style={{ objectFit: "cover", width: "100%", height: "100%", display: "block" }}
          />
        </div>
        <div>
          <div className="ceo-bonjour">Bonjour</div>
          <div className="ceo-hint">Message du gérant</div>
        </div>
      </div>

      {/* Modal */}
      <div
        className={`ceo-modal-overlay${open ? " open" : ""}`}
        onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
      >
        <div className="ceo-modal">
          <button className="ceo-modal-close" onClick={() => setOpen(false)} aria-label="Fermer">✕</button>
          <div className="ceo-modal-header">
            <div className="ceo-modal-avatar">
              <img
                src="/ceo-avatar.png"
                alt="Abdel-Salam Abdel-Aziz Haggar"
                width={52} height={52}
                style={{ objectFit: "cover", width: "100%", height: "100%", display: "block" }}
              />
            </div>
            <div>
              <div className="ceo-modal-name">Abdel-Salam Abdel-Aziz Haggar</div>
              <div className="ceo-modal-role">Gérant Associé — Expert Réseaux & Télécoms</div>
            </div>
          </div>
          <p className="ceo-modal-body">
            Bienvenue sur la plateforme FISAFI Groupe. Notre engagement est simple : vous offrir une expertise technique de haut niveau, ancrée dans les réalités africaines. Chaque projet que nous accompagnons est une opportunité de construire ensemble un avenir numérique plus solide, plus sécurisé et plus ambitieux pour notre continent.
          </p>
          <div className="ceo-modal-sig">— Le Gérant Associé, FISAFI Groupe</div>
        </div>
      </div>
    </>
  );
}
