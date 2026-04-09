"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";

interface StatCounterProps {
  number: string;
  label: string;
  color: string;
}

export default function StatCounter({ number, label, color }: StatCounterProps) {
  const [displayValue, setDisplayValue] = useState(number);
  const [hasAnimated, setHasAnimated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  const animateCounter = useCallback(() => {
    if (hasAnimated) return;
    
    // Extract numeric part from the string (e.g., "10+" -> 10, "24/7" -> 24, "5+" -> 5)
    const numericPart = parseInt(number.replace(/\D/g, "").substring(0, 2));
    const suffix = number.replace(/^[0-9]+/, ""); // Get non-numeric part like "+", "/7", etc.

    const duration = 1800; // ms
    const steps = 30; // Reduced from 60 for less re-renders
    const increment = numericPart / steps;
    let current = 0;
    let step = 0;
    let startTime: number | null = null;

    const animateFrame = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      step = Math.floor(progress * steps);
      current = numericPart * progress;

      if (progress >= 1) {
        setDisplayValue(number);
        setHasAnimated(true);
      } else {
        const displayNum = Math.floor(current);
        setDisplayValue(displayNum > 0 ? displayNum + suffix : suffix);
        animationRef.current = requestAnimationFrame(animateFrame);
      }
    };

    animationRef.current = requestAnimationFrame(animateFrame);
  }, [number, hasAnimated]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          animateCounter();
        }
      },
      { threshold: 0.5 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [hasAnimated, animateCounter]);

  return (
    <div ref={containerRef}>
      <div className="stat-number" style={{ color }}>{displayValue}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
