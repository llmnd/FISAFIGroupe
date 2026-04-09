import type { AppProps } from 'next/app';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import '../styles/globals.css';
import '../styles/header.css';
import '../styles/floating-logo.css';
import '../styles/carousel.css';
import '../styles/footer-enhanced.css';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import FloatingLogo from '@/components/FloatingLogo';

function ScrollPersistence() {
  const router = useRouter();

  useEffect(() => {
    if (!globalThis.window) return;

    const saveScroll = (path: string) => {
      try {
        sessionStorage.setItem('scroll:' + path, String(globalThis.window.scrollY || 0));
      } catch (error) {
        console.error('Error saving scroll position:', error);
      }
    };

    const restoreScroll = (path: string) => {
      try {
        const v = sessionStorage.getItem('scroll:' + path);
        if (v !== null) {
          const y = Number.parseInt(v, 10) || 0;
          globalThis.window.requestAnimationFrame(() => globalThis.window.scrollTo(0, y));
        }
      } catch (error) {
        console.error('Error restoring scroll position:', error);
      }
    };

    const onStart = (url: string) => {
      // save current scroll for current path
      saveScroll(router.asPath.split('#')[0]);
    };

    const onComplete = (url: string) => {
      // restore scroll for the target path if we have it
      const path = url.split('?')[0].split('#')[0];
      restoreScroll(path);
    };

    router.events.on('routeChangeStart', onStart);
    router.events.on('routeChangeComplete', onComplete);

    // Do not restore scroll on initial load (prevents auto-scrolling on first visit).
    // Scroll restoration still happens on routeChangeComplete when navigating within the app.

    return () => {
      router.events.off('routeChangeStart', onStart);
      router.events.off('routeChangeComplete', onComplete);
    };
  }, [router]);

  return null;
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <ScrollPersistence />
        <Component {...pageProps} />
        <FloatingLogo />
      </ThemeProvider>
    </LanguageProvider>
  );
}