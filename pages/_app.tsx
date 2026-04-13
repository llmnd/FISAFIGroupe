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

  return (
    <LanguageProvider>
      <ThemeProvider>
        <Component {...pageProps} />
      </ThemeProvider>
    </LanguageProvider>
  );
}