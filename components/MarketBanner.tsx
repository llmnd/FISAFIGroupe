"use client";

import React, { useEffect, useState } from "react";

const MARKET_BANNER_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=Outfit:wght@300;400;500&display=swap');

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
    background: rgba(14, 14, 70, 0.92);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(244, 121, 32, 0.3);
    border-radius: 16px;
    padding: 14px 18px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  }

  .mb-card::after {
    content: '';
    position: absolute;
    top: 0;
    left: 15%;
    right: 15%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(244, 121, 32, 0.5), transparent);
  }

  .mb-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
  }

  .mb-badge {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: rgba(244, 121, 32, 0.15);
    border: 1px solid rgba(244, 121, 32, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }

  .mb-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .mb-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 15px;
    font-weight: 600;
    color: #E8E4FF;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .mb-title span {
    color: #F47920;
  }

  .mb-subtitle {
    font-family: 'Outfit', sans-serif;
    font-size: 11.5px;
    font-weight: 300;
    color: rgba(200, 196, 255, 0.45);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
    gap: 5px;
    padding: 7px 16px;
    background: linear-gradient(135deg, #F47920, #D4620F);
    color: #ffffff;
    text-decoration: none;
    border-radius: 100px;
    font-family: 'Outfit', sans-serif;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    white-space: nowrap;
    border: none;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .mb-divider {
    width: 1px;
    height: 20px;
    background: rgba(244, 121, 32, 0.2);
  }

  .mb-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: transparent;
    color: rgba(200, 196, 255, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    cursor: pointer;
    font-size: 12px;
    -webkit-tap-highlight-color: transparent;
  }

  .mb-close:hover {
    color: rgba(200, 196, 255, 0.7);
    border-color: rgba(255, 255, 255, 0.18);
  }

  @media (max-width: 540px) {
    .mb-root { padding: 10px 12px; }
    .mb-card { padding: 11px 13px; border-radius: 13px; }
    .mb-title { font-size: 14px; }
    .mb-subtitle { font-size: 11px; }
  }

  @media (min-width: 900px) {
    .mb-root { padding: 16px 32px; }
    .mb-card { padding: 15px 22px; }
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
              Visiter →
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