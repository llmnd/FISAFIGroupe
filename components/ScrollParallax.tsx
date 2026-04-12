"use client";

import React, { useEffect, useRef } from "react";
import { initScrollHandler } from "@/scripts/scroll-optimizations";

interface ScrollParallaxProps {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}

/**
 * ScrollParallax — version perf
 *
 * AVANT (problème) :
 *   - getBoundingClientRect() dans le scroll listener = layout reflow forcé à chaque frame
 *   - window.addEventListener('scroll') sans debounce = appels excessifs
 *
 * APRÈS (solution) :
 *   - IntersectionObserver pour savoir si l'élément est visible (0 reflow)
 *   - On ne calcule le parallax QUE quand l'élément est dans le viewport
 *   - On stocke rect.top UNE SEULE FOIS à l'entrée dans le viewport
 *   - Désactivé complètement sur mobile (pointer: coarse) — le parallax JS
 *     est invisible sur mobile ET cause du jank
 */
export const ScrollParallax: React.FC<ScrollParallaxProps> = ({
  children,
  strength = 0.5,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisibleRef  = useRef(false);
  const rafRef        = useRef<number | null>(null);
  const baseTopRef    = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // PERF: désactiver sur mobile (touch) — parallax JS = lag garanti
    const isCoarse = window.matchMedia("(pointer: coarse)").matches;
    if (isCoarse) return;

    // PERF: observer pour activer/désactiver le scroll listener dynamiquement
    const io = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          // On snapshote rect.top UNE FOIS à l'entrée — pas à chaque scroll
          baseTopRef.current = entry.boundingClientRect.top + window.scrollY;
        } else {
          // Hors viewport → reset transform sans RAF
          container.style.transform = "translateY(0px)";
        }
      },
      { rootMargin: "100px 0px 100px 0px" }
    );

    io.observe(container);

    const onScroll = () => {
      if (!isVisibleRef.current) return;

      // Annuler le RAF précédent si pas encore exécuté
      if (rafRef.current !== null) return;

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        if (!isVisibleRef.current) return;

        // PERF: pas de getBoundingClientRect() — on utilise scrollY + baseTop
        const scrolled = window.scrollY - baseTopRef.current;
        const yTransform = scrolled * strength * 0.15; // amplitude réduite

        container.style.transform = `translateY(${yTransform}px)`;
      });
    };

    const cleanup = initScrollHandler(onScroll);

    return () => {
      try {
        cleanup();
      } catch (e) {}
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      io.disconnect();
    };
  }, [strength]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ willChange: "transform" }}
    >
      {children}
    </div>
  );
};

export default ScrollParallax;