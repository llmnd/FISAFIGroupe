'use client';

import { useEffect, useRef } from 'react';

export default function SmoothScrollProvider() {
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    const html = document.documentElement;
    
    // Fonction pour s'assurer que scroll-behavior est smooth
    const enforceSmoothScroll = () => {
      html.style.scrollBehavior = 'smooth';
      // Force reflow
      void html.offsetHeight;
    };

    // Application immédiate
    enforceSmoothScroll();

    // Observer les changements d'attributs style pour reappliquer si Next.js le change
    observerRef.current = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const target = mutation.target as HTMLElement;
          if (target.style.scrollBehavior !== 'smooth') {
            enforceSmoothScroll();
          }
        }
      });
    });

    observerRef.current.observe(html, {
      attributes: true,
      attributeFilter: ['style'],
      subtree: false,
    });

    // Vérification périodique toutes les 100ms pour s'assurer
    const interval = setInterval(() => {
      if (html.style.scrollBehavior !== 'smooth') {
        enforceSmoothScroll();
      }
    }, 100);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      clearInterval(interval);
    };
  }, []);

  return null;
}
