'use client';

import { useEffect } from 'react';

export function ZoomOptimizer() {
  useEffect(() => {
    // Bloquer le pinch-to-zoom (pinch sur tactile)
    function handleTouchMove(e: TouchEvent) {
      // Si 2 doigts touchent l'écran = tentative de pinch-to-zoom
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }

    // Bloquer le zoom avec Ctrl+Wheel ou Cmd+Wheel
    function handleWheel(e: WheelEvent) {
      // Sur Mac: e.metaKey (Cmd), sur Windows: e.ctrlKey (Ctrl)
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    }

    // Blocker le double-tap zoom (spécifique à Safari)
    let lastTouchEnd = 0;
    function handleTouchEnd(e: TouchEvent) {
      const now = Date.now();
      // Si 2 taps en moins de 300ms = double-tap zoom (Safari)
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }

    // Ajouter les listeners avec passive: false pour permettre preventDefault
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Cleanup
    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return null;
}
