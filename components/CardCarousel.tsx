"use client";

import React, { useRef, useState, useEffect } from "react";

interface CarouselProps {
  children: React.ReactNode[];
  variant?: "services" | "news";
}

const ChevronLeft = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const ChevronRight = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

export default function CardCarousel({ children, variant = "services" }: CarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    container?.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    return () => {
      container?.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className={`carousel-wrapper carousel-${variant}`}>
      {/* Navigation buttons */}
      <button
        className={`carousel-nav carousel-nav-left${canScrollLeft ? " visible" : ""}`}
        onClick={() => scroll("left")}
        aria-label="Scroll left"
      >
        <ChevronLeft />
      </button>

      {/* Carousel container */}
      <div className="carousel-container" ref={scrollContainerRef}>
        {children}
      </div>

      {/* Navigation buttons */}
      <button
        className={`carousel-nav carousel-nav-right${canScrollRight ? " visible" : ""}`}
        onClick={() => scroll("right")}
        aria-label="Scroll right"
      >
        <ChevronRight />
      </button>

      {/* Fade gradients */}
      <div className="carousel-fade carousel-fade-left" />
      <div className="carousel-fade carousel-fade-right" />
    </div>
  );
}
