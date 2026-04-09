import { useEffect, useRef } from 'react';

interface Scroll3DOptions {
  threshold?: number;
  perspectiveValue?: number;
}

export const useScroll3D = (options: Scroll3DOptions = {}) => {
  const { threshold = 0.1, perspectiveValue = 1000 } = options;
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleScroll = () => {
      const rect = element.getBoundingClientRect();
      const elementCenter = rect.top + rect.height / 2;
      const windowCenter = window.innerHeight / 2;
      const distance = elementCenter - windowCenter;
      
      // Rotation en X (basée sur la position verticale)
      const rotateX = (distance / window.innerHeight) * 25;
      
      // Rotation en Z (basée sur la visibilité)
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      const rotateZ = isVisible ? (distance / windowCenter) * 8 : 0;
      
      // Scale basée sur la proximité du centre
      const scale = 1 - Math.abs(distance / window.innerHeight) * 0.15;
      
      // Opacité
      const opacity = isVisible ? Math.max(0.6, 1 - Math.abs(distance / window.innerHeight) * 0.4) : 0;

      element.style.transform = `
        perspective(${perspectiveValue}px)
        rotateX(${rotateX}deg)
        rotateZ(${rotateZ}deg)
        scale(${Math.max(0.7, scale)})
      `;
      element.style.opacity = opacity.toString();
      element.style.transition = 'none';
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Appel initial

    return () => window.removeEventListener('scroll', handleScroll);
  }, [perspectiveValue]);

  return elementRef;
};

// Hook pour les cartes avec un effet de parallax plus subtil
export const useParallaxCard = () => {
  const cardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleScroll = () => {
      const rect = card.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      
      if (!isVisible) return;

      // Parallax basé sur la position
      const yOffset = rect.top / 10;
      const xOffset = (window.innerWidth / 2 - (rect.left + rect.width / 2)) / 50;

      card.style.transform = `
        perspective(1200px)
        translateY(${yOffset}px)
        translateX(${xOffset}px)
        rotateY(${xOffset / 5}deg)
      `;
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return cardRef;
};
