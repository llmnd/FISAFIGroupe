'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * Composant de curseur personnalisé
 * Affiche un curseur élégant avec un point et un anneau
 * L'anneau change de couleur lors du survol d'éléments clicables
 */
export default function CustomCursor() {
  const [isActive, setIsActive] = useState(false);
  const [isHidden, setIsHidden] = useState(true);

  const dotRef = useRef<HTMLDivElement | null>(null);
  const outlineRef = useRef<HTMLDivElement | null>(null);
  const targetX = useRef(0);
  const targetY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      targetX.current = e.clientX;
      targetY.current = e.clientY;
      if (isHidden) setIsHidden(false);
      if (!rafId.current) startLoop();
    };

    const handleMouseLeave = () => {
      setIsHidden(true);
    };

    const handleMouseEnter = () => {
      setIsHidden(false);
    };

    // Détecter si on survole un élément clicable
    const handleMouseOver = (e: Event) => {
      const target = e.target as HTMLElement;
      const isClickable =
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.getAttribute('role') === 'button' ||
        target.getAttribute('role') === 'link' ||
        target.classList.contains('clickable') ||
        target.closest('a') ||
        target.closest('button');

      setIsActive(!!isClickable);
    };

    const handleMouseOut = () => {
      setIsActive(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    function startLoop() {
      const lerp = (a: number, b: number, n = 0.15) => (1 - n) * a + n * b;

      const step = () => {
        currentX.current = lerp(currentX.current, targetX.current, 0.2);
        currentY.current = lerp(currentY.current, targetY.current, 0.2);

        const dx = currentX.current;
        const dy = currentY.current;

        const dot = dotRef.current;
        const outline = outlineRef.current;

        if (dot) {
          const w = dot.offsetWidth / 2;
          const h = dot.offsetHeight / 2;
          dot.style.transform = `translate3d(${dx - w}px, ${dy - h}px, 0)`;
        }

        if (outline) {
          const w = outline.offsetWidth / 2;
          const h = outline.offsetHeight / 2;
          outline.style.transform = `translate3d(${dx - w}px, ${dy - h}px, 0)`;
        }

        rafId.current = requestAnimationFrame(step);
      };

      if (!rafId.current) rafId.current = requestAnimationFrame(step);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = null;
    };
  }, [isHidden]);

  if (isHidden) {
    return null;
  }

  return (
    <>
      {/* Curseur dot */}
      <div
        ref={dotRef}
        className="cursor-dot"
        style={{
          opacity: isHidden ? 0 : 0.7,
          transition: 'opacity 0.25s ease',
          willChange: 'transform, opacity',
          position: 'fixed',
          pointerEvents: 'none',
          top: 0,
          left: 0,
          transform: 'translate3d(-9999px,-9999px,0)'
        }}
      />

      {/* Curseur outline */}
      <div
        ref={outlineRef}
        className={`cursor-outline ${isActive ? 'active' : ''}`}
        style={{
          opacity: isHidden ? 0 : 0.5,
          transition: isActive ? 'transform 0.18s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.18s ease' : 'opacity 0.28s ease, transform 0.28s ease',
          willChange: 'transform, opacity',
          position: 'fixed',
          pointerEvents: 'none',
          top: 0,
          left: 0,
          transform: 'translate3d(-9999px,-9999px,0)'
        }}
      />
    </>
  );
}
