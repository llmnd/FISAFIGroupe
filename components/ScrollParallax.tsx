import React, { useEffect, useRef } from 'react';

interface ScrollParallaxProps {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}

export const ScrollParallax: React.FC<ScrollParallaxProps> = ({
  children,
  strength = 0.5,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let ticking = false;
    let lastScrollY = 0;

    const handleScroll = () => {
      lastScrollY = window.scrollY;
      if (!ticking) {
        requestAnimationFrame(() => {
          const rect = container.getBoundingClientRect();
          const scrollProgress = 1 - (rect.top / window.innerHeight);
          
          // Limiter entre 0 et 1
          const progress = Math.max(0, Math.min(1, scrollProgress));
          
          // Parallax léger et simple
          const yTransform = progress * strength * 50;
          
          container.style.transform = `translateY(${yTransform}px)`;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => window.removeEventListener('scroll', handleScroll);
  }, [strength]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        transformStyle: 'preserve-3d',
        transition: 'none',
      }}
    >
      {children}
    </div>
  );
};

export default ScrollParallax;
