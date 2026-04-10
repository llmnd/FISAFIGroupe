"use client";

import { useEffect } from "react";

/**
 * SmoothScrollProvider — version perf
 *
 * PROBLÈME ORIGINAL :
 *   Les librairies de smooth scroll JS (Lenis, Locomotive, etc.) remplacent
 *   le scroll natif par une boucle RAF qui tourne en permanence.
 *   Sur mobile, ça crée un jank visible car le scroll natif du navigateur
 *   est accéléré matériellement — le JS ne peut pas rivaliser.
 *
 * SOLUTION :
 *   - Mobile (pointer: coarse) → scroll natif pur, RIEN d'autre
 *   - Desktop → scroll-behavior: smooth via CSS uniquement
 *   - Les liens ancres (#section) fonctionnent nativement avec ça
 *
 * Si tu veux absolument Lenis sur desktop uniquement :
 *   → décommente le bloc Lenis ci-dessous et installe : npm i lenis
 */
export default function SmoothScrollProvider() {
  useEffect(() => {
    // PERF: détection mobile — on ne fait RIEN sur touch
    const isCoarse = window.matchMedia("(pointer: coarse)").matches;
    if (isCoarse) return;

    // Desktop : smooth scroll CSS natif (GPU-accelerated, 0 JS overhead)
    document.documentElement.style.scrollBehavior = "smooth";

    /* ── Lenis optionnel sur desktop uniquement ──────────────────
    import Lenis from "lenis";
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchAction: "none", // laisser le touch natif
    });

    let raf: number;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      document.documentElement.style.scrollBehavior = "";
    };
    ─────────────────────────────────────────────────────────── */

    return () => {
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  // Ce composant ne rend rien
  return null;
}