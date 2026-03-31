"use client";

import React, { useEffect, useState } from "react";

export default function FloatingQuickMenu({ threshold = 240 }: { threshold?: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.pageYOffset ?? window.scrollY ?? 0;
      setVisible(y > threshold);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      aria-label="Retour au haut"
      onClick={handleClick}
      style={{
        position: 'fixed',
        right: 18,
        bottom: 18,
        width: 44,
        height: 44,
        borderRadius: 9999,
        border: 'none',
        background: 'rgba(11,92,255,0.94)',
        color: 'white',
        display: 'grid',
        placeItems: 'center',
        boxShadow: '0 6px 18px rgba(11,92,255,0.18)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 200ms ease, transform 200ms ease',
        cursor: 'pointer',
        zIndex: 9998,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
