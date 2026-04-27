/**
 * Détecte le zoom du navigateur et ajoute la classe 'zoomed' à <html>
 * Permet de gérer les animations différemment pendant le zoom
 */

function detectZoom() {
  // Déterminer le niveau de zoom actuel
  const devicePixelRatio = window.devicePixelRatio || 1;
  const screenWidth = window.screen.width;
  const innerWidth = window.innerWidth;
  
  // Calculer le zoom: si (innerWidth * ratio) < screenWidth, il y a du zoom
  const zoom = screenWidth / (innerWidth * devicePixelRatio);
  
  return zoom !== 1;
}

function updateZoomState() {
  const html = document.documentElement;
  const isZoomed = detectZoom();
  
  if (isZoomed) {
    html.classList.add('zoomed');
  } else {
    html.classList.remove('zoomed');
  }
}

// Écouter les changements de zoom
if (typeof window !== 'undefined') {
  // Détection initiale
  updateZoomState();
  
  // Re-vérifier au resize (zoom change souvent avec resize)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateZoomState, 100);
  }, { passive: true });
  
  // Vérifier aussi lors de l'orientation change
  window.addEventListener('orientationchange', updateZoomState, { passive: true });
}

export { detectZoom, updateZoomState };
