"use client";

import { useEffect } from "react";
import {
  initScrollHandler,
  observeVisibility,
} from "@/scripts/scroll-optimizations";

export default function ScrollManager() {
  useEffect(() => {
    // Throttled scroll handler: expose scroll position for lightweight consumers
    const cleanupScroll = initScrollHandler(() => {
      try {
        const y = Math.round(window.scrollY || 0);
        document.documentElement.dataset.scroll = String(y);
      } catch (e) {
        // silent
      }
    });

    // Observe any element marked with `data-observe` and toggle `is-visible`
    const targets = document.querySelectorAll("[data-observe]");
    const observer = observeVisibility(targets, (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) el.classList.add("is-visible");
        else el.classList.remove("is-visible");
      });
    });

    return () => {
      try {
        cleanupScroll();
      } catch (e) {}
      try {
        observer.disconnect();
      } catch (e) {}
    };
  }, []);

  return null;
}
