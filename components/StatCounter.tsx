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

  const animateCounter = useCallback(() => {
    if (hasAnimated) return;
    
    // Extract numeric part from the string (e.g., "10+" -> 10, "24/7" -> 24, "5+" -> 5)
    const numericPart = parseInt(number.replace(/\D/g, "").substring(0, 2));
    const suffix = number.replace(/^[0-9]+/, ""); // Get non-numeric part like "+", "/7", etc.

    const duration = 1800; // ms
    const steps = 60;
    const increment = numericPart / steps;
    let current = 0;
    let step = 0;

    const counter = setInterval(() => {
      step++;
      current += increment;

      if (step >= steps) {
        setDisplayValue(number);
        setHasAnimated(true);
        clearInterval(counter);
      } else {
        const displayNum = Math.floor(current);
        setDisplayValue(displayNum > 0 ? displayNum + suffix : suffix);
      }
    }, duration / steps);
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
    };
  }, [hasAnimated, animateCounter]);

  return (
    <div ref={containerRef}>
      <div className="stat-number" style={{ color }}>{displayValue}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
