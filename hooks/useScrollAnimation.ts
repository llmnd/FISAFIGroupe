/**
 * Hook pour gérer les animations au scroll
 * Utilise IntersectionObserver pour déclencher des animations sur les éléments visibles
 */
import { useEffect } from 'react';

interface ScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
}

/**
 * Hook pour observer les éléments et ajouter une classe quand ils deviennent visibles
 * @param selector - Sélecteur CSS des éléments à observer
 * @param className - Classe à ajouter quand l'élément est visible
 * @param options - Options pour IntersectionObserver
 */
export function useScrollAnimation(
  selector: string,
  className: string = 'is-visible',
  options: ScrollAnimationOptions = {}
) {
  useEffect(() => {
    const {
      threshold = 0.08,
      rootMargin = '0px 0px -60px 0px'
    } = options;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Ajouter la classe pour déclencher l'animation
            entry.target.classList.add(className);
            // Désabonner après la première observation
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin }
    );

    // Observer tous les éléments correspondant au sélecteur
    document.querySelectorAll(selector).forEach((element) => {
      observer.observe(element);
    });

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, [selector, className]);
}

/**
 * Hook pour observer les éléments avec l'attribut data-observe
 * Ajoute la classe 'is-visible' quand ils deviennent visibles
 */
export function useDataObserveAnimation() {
  useScrollAnimation('[data-observe]', 'is-visible', {
    threshold: 0.08,
    rootMargin: '0px 0px -60px 0px'
  });
}
