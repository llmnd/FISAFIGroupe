"use client";

import React, { useEffect, useState } from "react";

const MARKET_BANNER_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,400&family=Outfit:wght@300;400;500&display=swap');

  .mb-root {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 999;
    padding: 12px 20px;
    padding-bottom: calc(12px + env(safe-area-inset-bottom));
    display: flex;
    justify-content: center;
  }

  .mb-card {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    width: 100%;
    max-width: 780px;
    background: rgba(10, 10, 36, 0.96);
    backdrop-filter: blur(32px);
    -webkit-backdrop-filter: blur(32px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 18px;
    padding: 15px 18px;
    box-shadow:
      0 0 0 1px rgba(244, 121, 32, 0.12) inset,
      0 8px 40px rgba(0, 0, 0, 0.6),
      0 1px 0 rgba(255, 255, 255, 0.05) inset;
    overflow: hidden;
  }

  .mb-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 20%;
    right: 20%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(244, 121, 32, 0.6), transparent);
    opacity: 0.7;
  }

  .mb-card::after {
    content: '';
    position: absolute;
    bottom: -40px;
    left: 50%;
    transform: translateX(-50%);
    width: 60%;
    height: 80px;
    background: radial-gradient(ellipse, rgba(244,121,32,0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  .mb-left {
    display: flex;
    align-items: center;
    gap: 13px;
    flex: 1;
    min-width: 0;
  }

  .mb-badge {
    flex-shrink: 0;
    width: 38px;
    height: 38px;
    border-radius: 11px;
    background: linear-gradient(145deg, rgba(244,121,32,0.18), rgba(244,121,32,0.06));
    border: 1px solid rgba(244, 121, 32, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
    box-shadow: 0 2px 8px rgba(244,121,32,0.12);
  }

  .mb-text {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  .mb-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 15.5px;
    font-weight: 600;
    color: #F0EEFF;
    line-height: 1.2;
    letter-spacing: 0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .mb-title span {
    color: #F47920;
    font-style: italic;
    font-weight: 400;
  }

  .mb-subtitle {
    font-family: 'Outfit', sans-serif;
    font-size: 11.5px;
    font-weight: 300;
    color: rgba(180, 175, 220, 0.4);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: 0.02em;
  }

  .mb-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  .mb-cta {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 16px;
    background: rgba(255, 255, 255, 0.06);
    color: rgba(240, 238, 255, 0.85);
    text-decoration: none;
    border-radius: 100px;
    font-family: 'Outfit', sans-serif;
    font-size: 12px;
    font-weight: 400;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    white-space: nowrap;
    border: 1px solid rgba(255, 255, 255, 0.1);
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s, color 0.2s;
    -webkit-tap-highlight-color: transparent;
  }

  .mb-cta:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.18);
    color: #fff;
  }

  .mb-divider {
    width: 1px;
    height: 22px;
    background: rgba(255, 255, 255, 0.07);
  }

  .mb-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: rgba(255, 255, 255, 0.1);
    color: rgba(240, 238, 255, 0.75);
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 50%;
    cursor: pointer;
    font-size: 13px;
    line-height: 1;
    transition: background 0.2s, color 0.2s, border-color 0.2s, transform 0.15s;
    -webkit-tap-highlight-color: transparent;
  }

  .mb-close:hover {
    background: rgba(255, 255, 255, 0.18);
    color: #fff;
    border-color: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
  }

  @media (max-width: 540px) {
    .mb-root { padding: 10px 12px; }
    .mb-card { padding: 11px 13px; border-radius: 14px; }
    .mb-title { font-size: 14.5px; }
    .mb-subtitle { font-size: 11px; }
  }

  @media (min-width: 900px) {
    .mb-root { padding: 16px 32px; }
    .mb-card { padding: 16px 22px; }
    .mb-title { font-size: 16px; }
  }
`;

interface MarketBannerProps {
  dismissKey?: string;
}

export default function MarketBanner({
  dismissKey = "market-banner-dismissed",
}: MarketBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDismissed = sessionStorage.getItem(dismissKey);
      setIsVisible(!isDismissed);
    }
  }, [dismissKey]);

  const handleClose = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(dismissKey, "true");
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <>
      <style>{MARKET_BANNER_STYLES}</style>
      <div className="mb-root">
        <div className="mb-card">
          <div className="mb-left">
            <div className="mb-badge">🍫</div>
            <div className="mb-text">
              <div className="mb-title">
                FiSAFi <span>Market</span>
              </div>
              <div className="mb-subtitle">
                Découvrez notre plateforme marketplace
              </div>
            </div>
          </div>
          <div className="mb-right">
            <a
              href="https://ndaay.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="mb-cta"
            >
              Visiter <span style={{ opacity: 0.55, fontSize: "11px" }}>→</span>
            </a>
            <div className="mb-divider" />
            <button
              className="mb-close"
              onClick={handleClose}
              aria-label="Fermer la bannière"
              type="button"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </>
  );
}