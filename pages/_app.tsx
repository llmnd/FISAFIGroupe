import type { AppProps } from 'next/app';
import { ThemeProvider } from '@/context/ThemeContext';
import '../styles/globals.css';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

function ScrollPersistence() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const saveScroll = (path: string) => {
      try {
        sessionStorage.setItem('scroll:' + path, String(window.scrollY || 0));
      } catch (e) {}
    };

    const restoreScroll = (path: string) => {
      try {
        const v = sessionStorage.getItem('scroll:' + path);
        if (v !== null) {
          const y = parseInt(v) || 0;
          window.requestAnimationFrame(() => window.scrollTo(0, y));
        }
      } catch (e) {}
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

    // restore on initial load
    restoreScroll(router.asPath.split('#')[0]);

    return () => {
      router.events.off('routeChangeStart', onStart);
      router.events.off('routeChangeComplete', onComplete);
    };
  }, [router]);

  return null;
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <ScrollPersistence />
      <Component {...pageProps} />
    </ThemeProvider>
  );
}