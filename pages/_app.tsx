import type { AppProps } from 'next/app';
import React, { useEffect } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import '../styles/globals.css';
import '../styles/header.css';
import '../styles/floating-logo.css';
import '../styles/carousel.css';
import '../styles/footer-enhanced.css';
import '../styles/modules/mobile-performance.css';

function isBlinkEngine(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  // Edge (Chromium) and Chrome use Blink. Opera also uses Blink but behaves similarly.
  return /Chrome|Chromium|Edg\//.test(ua) && !/OPR\//.test(ua);
}

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    try {
      if (isBlinkEngine()) {
        document.documentElement.classList.add('blink-no-smooth');
      }
    } catch (e) {
      // defensive - do nothing if DOM not available
    }
  }, []);

  // Fix for mobile/Chrome/Edge UI chrome (address bar) causing viewport height jumps.
  // Sets a dynamic `--vh` CSS variable based on the real inner height (uses visualViewport when available).
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const setVh = () => {
      const h = (window.visualViewport && window.visualViewport.height) ? window.visualViewport.height : window.innerHeight;
      const vh = h * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // initial
    setVh();

    // throttle via rAF
    let rafId: number | null = null;
    const onResize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setVh();
        rafId = null;
      });
    };

    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize, { passive: true });
    if (window.visualViewport && window.visualViewport.addEventListener) {
      window.visualViewport.addEventListener('resize', onResize);
    }

    // also update when page becomes visible again
    const onVisibility = () => setVh();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      if (window.visualViewport && window.visualViewport.removeEventListener) {
        window.visualViewport.removeEventListener('resize', onResize);
      }
      document.removeEventListener('visibilitychange', onVisibility);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <LanguageProvider>
      <ThemeProvider>
        <Component {...pageProps} />
      </ThemeProvider>
    </LanguageProvider>
  );
}