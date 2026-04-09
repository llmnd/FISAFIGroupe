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

    const handleScroll = () => {
      const rect = container.getBoundingClientRect();
      const scrollProgress = 1 - (rect.top / window.innerHeight);
      
      // Limiter entre 0 et 1
      const progress = Math.max(0, Math.min(1, scrollProgress));
      
      const yTransform = progress * strength * 100;
      const scale = 1 + progress * 0.1;
      
      container.style.transform = `perspective(1200px) translateY(${yTransform}px) scaleY(${scale})`;
      container.style.opacity = Math.max(0.3, 1 - Math.abs(progress - 0.5) * 0.4).toString();
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
        willChange: 'transform, opacity',
        transition: 'none',
      }}
    >
      {children}
    </div>
  );
};

export default ScrollParallax;
