import type { AppProps } from 'next/app';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import AdminNavigationSkeleton from '@/components/AdminNavigationSkeleton';
import '../styles/globals.css';
import '../styles/competences.css';
import '../styles/header.css';
import '../styles/employee-portal.css';
import '../styles/floating-logo.css';
import '../styles/carousel.css';
import '../styles/footer-enhanced.css';
import '../styles/modules/mobile-performance.css';
import '../styles/modules/partners.css';
import '../styles/business.css';
import '../styles/market-store.css';
import '../styles/market-store-scene.css';
import '../styles/market-checkout.css';
import '../styles/market-delivery-screen.css';
import 'leaflet/dist/leaflet.css';
import '../styles/admin-dashboard.css';
import '../styles/user-dashboard.css';

function isBlinkEngine(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  // Edge (Chromium) and Chrome use Blink. Opera also uses Blink but behaves similarly.
  return /Chrome|Chromium|Edg\//.test(ua) && !/OPR\//.test(ua);
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [adminNavigationLoading, setAdminNavigationLoading] = useState(false);

  useEffect(() => {
    let showTimer: number | undefined;
    const clearPendingTimer = () => {
      if (showTimer !== undefined) {
        window.clearTimeout(showTimer);
        showTimer = undefined;
      }
    };
    const handleRouteStart = (url: string) => {
      clearPendingTimer();
      setAdminNavigationLoading(false);
      if (url.split(/[?#]/, 1)[0] !== '/admin-dashboard') return;
      showTimer = window.setTimeout(() => setAdminNavigationLoading(true), 120);
    };
    const handleRouteEnd = () => {
      clearPendingTimer();
      setAdminNavigationLoading(false);
    };

    router.events.on('routeChangeStart', handleRouteStart);
    router.events.on('routeChangeComplete', handleRouteEnd);
    router.events.on('routeChangeError', handleRouteEnd);
    return () => {
      clearPendingTimer();
      router.events.off('routeChangeStart', handleRouteStart);
      router.events.off('routeChangeComplete', handleRouteEnd);
      router.events.off('routeChangeError', handleRouteEnd);
    };
  }, [router.events]);

  useEffect(() => {
    try {
      if (isBlinkEngine()) {
        document.documentElement.classList.add('blink-no-smooth');
      }
    } catch (e) {
      // defensive - do nothing if DOM not available
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const legacyToken = localStorage.getItem('token');
        if (legacyToken) {
          const migrationResponse = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { Authorization: `Bearer ${legacyToken}` },
          });
          if (migrationResponse.ok || migrationResponse.status === 409) {
            localStorage.removeItem('token');
          } else if ([401, 403, 404].includes(migrationResponse.status)) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          } else {
            return;
          }
        }
        if (router.pathname === '/login' || !localStorage.getItem('user')) return;

        const response = await fetch('/api/auth/me');
        if (![401, 403, 404].includes(response.status)) return;

        localStorage.removeItem('user');
        await fetch('/api/auth/logout', { method: 'POST' });
        window.dispatchEvent(new Event('fisafi:session-expired'));
        if (
          ['/dashboard', '/admin-dashboard', '/market/commande'].includes(router.pathname) ||
          router.pathname.startsWith('/espace-employe')
        ) {
          void router.replace('/login?session=expired');
        }
      } catch (error) {
        console.error('[Auth] Session status check failed:', error);
      }
    };

    void checkSession();
    const interval = window.setInterval(() => void checkSession(), 60_000);
    return () => window.clearInterval(interval);
  }, [router]);

  // ─── GLOBAL SCROLL ANIMATIONS (Optimized avec MutationObserver) ──────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { 
        threshold: 0.05,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    // Observer les éléments existants ET futurs avec MutationObserver
    const observeElements = () => {
      document.querySelectorAll('[data-observe], .services-grid, .services-grid-new').forEach((el) => {
        if (!el.classList.contains('is-visible')) {
          observer.observe(el);
        }
      });
    };

    // Première observation
    observeElements();

    // MutationObserver pour capturer les nouveaux éléments
    const mutationObserver = new MutationObserver(() => {
      observeElements();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
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
        {adminNavigationLoading && <AdminNavigationSkeleton />}
      </ThemeProvider>
    </LanguageProvider>
  );
}