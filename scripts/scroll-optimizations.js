// Helpers légers pour optimiser les handlers liés au scroll / touch
// - listeners passifs
// - throttling via requestAnimationFrame
// - wrapper IntersectionObserver

/**
 * Attache un listener avec option passive=true quand possible
 * @param {EventTarget} target
 * @param {string} event
 * @param {Function} handler
 * @param {Object} [opts]
 */
export function addPassiveEventListener(target, event, handler, opts = {}) {
  try {
    target.addEventListener(event, handler, Object.assign({ passive: true }, opts));
  } catch (e) {
    // fallback to boolean options for older browsers
    target.addEventListener(event, handler, true);
  }
}

/**
 * Crée un handler throttlé par requestAnimationFrame
 * Utiliser pour des callbacks de scroll peu coûteux
 * @param {Function} fn
 * @returns {Function}
 */
export function rafThrottle(fn) {
  let rafId = null;
  let lastArgs = null;
  
  return function throttled(...args) {
    lastArgs = args;
    
    // Annuler le RAF précédent si pas encore exécuté
    if (rafId !== null) {
      return;
    }
    
    // Planifier l'exécution au prochain frame
    rafId = requestAnimationFrame(() => {
      fn.apply(this, lastArgs);
      rafId = null;
    });
  };
}

/**
 * Initialise un handler de scroll optimisé (passif + rAF)
 * @param {Function} handler - reçoit l'event de scroll
 * @returns {Function} cleanup
 */
export function initScrollHandler(handler) {
  const wrapped = rafThrottle(handler);
  addPassiveEventListener(window, 'scroll', wrapped);
  
  return () => {
    window.removeEventListener('scroll', wrapped);
  };
}

/**
 * Wrapper simple pour IntersectionObserver avec options par défaut
 * @param {Element[]|NodeList|Element} targets
 * @param {Function} cb - (entries, observer) => void
 * @param {Object} [options]
 * @returns {IntersectionObserver}
 */
export function observeVisibility(targets, cb, options = { root: null, rootMargin: '0px', threshold: 0.1 }) {
  const obs = new IntersectionObserver(cb, options);
  const list = (targets instanceof Element) ? [targets] : Array.from(targets || []);
  list.forEach(t => obs.observe(t));
  return obs;
}

// Exemple d'usage:
// import { initScrollHandler, observeVisibility } from '../scripts/scroll-optimizations'
// const stop = initScrollHandler((e) => { /* lecture optimisée */ })
// const obs = observeVisibility(document.querySelectorAll('.lazy'), (entries)=>{...})
