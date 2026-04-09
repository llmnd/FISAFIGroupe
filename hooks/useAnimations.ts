import { useEffect, useRef } from 'react';

// Simple scroll manager: a single window scroll listener + rAF batcher
const scrollSubscribers = new Set<(scrollY: number) => void>();
let scrollRafId: number | null = null;
let lastKnownScrollY = 0;

function onWindowScroll() {
  lastKnownScrollY = window.scrollY || 0;
  if (scrollRafId === null) {
    scrollRafId = requestAnimationFrame(() => {
      scrollRafId = null;
      const sy = lastKnownScrollY;
      scrollSubscribers.forEach((cb) => cb(sy));
    });
  }
}

function subscribeToScroll(cb: (scrollY: number) => void) {
  if (typeof window === 'undefined') return () => {};
  if (scrollSubscribers.size === 0) {
    lastKnownScrollY = window.scrollY || 0;
    window.addEventListener('scroll', onWindowScroll, { passive: true });
  }
  scrollSubscribers.add(cb);
  // call once to initialize
  cb(lastKnownScrollY);

  return () => {
    scrollSubscribers.delete(cb);
    if (scrollSubscribers.size === 0) {
      window.removeEventListener('scroll', onWindowScroll);
      if (scrollRafId) {
        cancelAnimationFrame(scrollRafId);
        scrollRafId = null;
      }
    }
  };
}

/**
 * Hook pour créer des animations au scroll
 * Utilise IntersectionObserver pour déclencher les animations quand l'élément devient visible
 * 
 * @param animationClass - La classe CSS d'animation à ajouter (ex: 'fade-in-up', 'fade-in-scale')
 * @param threshold - Le seuil d'intersection (0-1), par défaut 0.1
 * @param options - Options additionnelles d'IntersectionObserver
 * @returns ref à attacher à l'élément à animer
 */
export function useScrollAnimation(
  animationClass: string = 'fade-in-up',
  threshold: number = 0.1,
  options: Partial<IntersectionObserverInit> = {}
) {
  const ref = useRef<HTMLElement>(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Optimize for mobile: use larger rootMargin to reduce observer callbacks
    const isMobile = window.innerWidth < 768;
    const rootMarginValue = isMobile ? '0px 0px -100px 0px' : '0px 0px -50px 0px';

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Only animate once - don't remove the visible class
          if (entry.isIntersecting && !hasAnimatedRef.current) {
            hasAnimatedRef.current = true;
            entry.target.classList.add('visible', animationClass);
          }
        });
      },
      {
        threshold: threshold,
        rootMargin: rootMarginValue,
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [animationClass, threshold, options]);

  return ref;
}

/**
 * Hook pour créer des animations staggered (décalées)
 * Parfait pour animer plusieurs éléments avec un délai entre chacun
 * 
 * @param animationClass - La classe CSS d'animation
 * @param itemCount - Nombre d'éléments à animer
 * @param staggerDelay - Délai entre chaque élément (en unités de stagger)
 * @returns fonction pour obtenir la classe CSS pour l'index donné
 */
export function useStaggerAnimation(
  animationClass: string = 'fade-in-up',
  itemCount: number = 0,
  staggerDelay: number = 100
) {
  const containerRef = useRef<HTMLElement>(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Optimize for mobile: use larger rootMargin to reduce observer callbacks
    const isMobile = window.innerWidth < 768;
    const rootMarginValue = isMobile ? '0px 0px -100px 0px' : '0px 0px -50px 0px';

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Only animate once - animations play and stay visible
          if (entry.isIntersecting && !hasAnimatedRef.current) {
            hasAnimatedRef.current = true;
            const children = Array.from(entry.target.children);
            children.forEach((child, index) => {
              const childElement = child as HTMLElement;
              const staggerClass = `stagger-${Math.min(index + 1, 5)}`;
              childElement.classList.add('visible', animationClass, staggerClass);
            });
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: rootMarginValue,
      }
    );

    if (container) {
      observer.observe(container);
    }

    return () => {
      observer.disconnect();
    };
  }, [animationClass, itemCount]);

  return containerRef;
}

/**
 * Hook pour la parallaxe légère
 * @param strength - Force de la parallaxe (0-1), par défaut 0.3
 * @returns ref à attacher à l'élément
 */
export function useParallax(strength: number = 0.3) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const cb = (scrollY: number) => {
      const rect = element.getBoundingClientRect();
      const elementTop = rect.top + scrollY;
      const offset = (elementTop - window.innerHeight) * strength;
      element.style.setProperty('--scroll-y', `${offset}px`);
    };

    const unsub = subscribeToScroll(cb);
    return unsub;
  }, [strength]);

  return ref;
}

/**
 * Hook pour les animations de comptage de nombres
 * @param finalValue - La valeur finale à afficher
 * @param duration - Durée de l'animation en ms
 * @returns la valeur animée
 */
export function useCountAnimation(finalValue: number, duration: number = 2000) {
  const ref = useRef<HTMLElement>(null);
  const resultRef = useRef<number>(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && resultRef.current === 0) {
            let current = 0;
            const increment = finalValue / (duration / 16);
            
            const interval = setInterval(() => {
              current += increment;
              if (current >= finalValue) {
                current = finalValue;
                clearInterval(interval);
              }
              element.textContent = Math.floor(current).toString();
              resultRef.current = current;
            }, 16);

            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [finalValue, duration]);

  return ref;
}

/**
 * Hook pour détecter le hover sur les éléments clicables
 * et changer le curseur personnalisé
 */
export function useCursorHover() {
  useEffect(() => {
    const clickables = document.querySelectorAll(
      'a, button, [role="button"], input[type="submit"], input[type="button"]'
    );

    const handleMouseEnter = () => {
      document.documentElement.dataset.cursorActive = 'true';
    };

    const handleMouseLeave = () => {
      delete document.documentElement.dataset.cursorActive;
    };

    clickables.forEach((el) => {
      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
    });

    return () => {
      clickables.forEach((el) => {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, []);
}
