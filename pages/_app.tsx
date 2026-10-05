import type { AppProps } from 'next/app';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter, type NextRouter } from 'next/router';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import AdminNavigationSkeleton from '@/components/AdminNavigationSkeleton';
import { ensureAuthSession } from '@/lib/clientAuthSession';
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

/* ══════════════════════════════════════════════════════════════
   CONSTANTES
   ══════════════════════════════════════════════════════════════ */
const PROTECTED_ROUTES = ['/dashboard', '/admin-dashboard', '/market/commande'] as const;
const EMPLOYEE_PREFIX = '/espace-employe';

const BODY_CLASS_MAP: Record<string, string[]> = {
  '/dashboard': ['portal-has-user-dashboard'],
  '/admin-dashboard': ['admin-dashboard-active'],
};

/* ══════════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════════ */
function isBlinkEngine(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /Chrome|Chromium|Edg\//.test(ua) && !/OPR\//.test(ua);
}

function getBodyClassesForPath(pathname: string): string[] {
  for (const [route, classes] of Object.entries(BODY_CLASS_MAP)) {
    if (pathname === route || pathname.startsWith(`${route}/`)) return classes;
  }
  return [];
}

function shouldRedirectOnSessionExpired(pathname: string): boolean {
  if ((PROTECTED_ROUTES as readonly string[]).includes(pathname)) return true;
  return pathname.startsWith(EMPLOYEE_PREFIX);
}

/* ══════════════════════════════════════════════════════════════
   HOOKS
   ══════════════════════════════════════════════════════════════ */

/** Applique / retire les classes sur <body> selon la route courante. */
function useBodyClasses(pathname: string) {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const desired = getBodyClassesForPath(pathname);
    const allPossible = Object.values(BODY_CLASS_MAP).flat();

    allPossible.forEach((cls) => {
      if (desired.includes(cls)) {
        document.body.classList.add(cls);
      } else {
        document.body.classList.remove(cls);
      }
    });

    // Forcer padding-top: 0 quand une classe fullscreen est active
    if (desired.length > 0) {
      document.body.style.paddingTop = '0';
      document.body.style.marginTop = '0';
    } else {
      document.body.style.removeProperty('padding-top');
      document.body.style.removeProperty('margin-top');
    }

    return () => {
      allPossible.forEach((cls) => document.body.classList.remove(cls));
      document.body.style.removeProperty('padding-top');
      document.body.style.removeProperty('margin-top');
    };
  }, [pathname]);
}

/** Affiche le skeleton admin si la navigation vers /admin-dashboard est lente. */
function useAdminNavigationLoading(
  router: NextRouter,
  setLoading: (value: boolean) => void,
) {
  useEffect(() => {
    let showTimer: number | undefined;

    const clearPendingTimer = () => {
      if (showTimer !== undefined) {
        window.clearTimeout(showTimer);
        showTimer = undefined;
      }
    };

    const handleStart = (url: string) => {
      clearPendingTimer();
      setLoading(false);
      const cleanUrl = url.split(/[?#]/, 1)[0];
      if (cleanUrl !== '/admin-dashboard') return;
      showTimer = window.setTimeout(() => setLoading(true), 120);
    };

    const handleEnd = () => {
      clearPendingTimer();
      setLoading(false);
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleEnd);
    router.events.on('routeChangeError', handleEnd);

    return () => {
      clearPendingTimer();
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleEnd);
      router.events.off('routeChangeError', handleEnd);
    };
  }, [router.events, setLoading]);
}

/** Vérifie périodiquement la session côté serveur. */
function useSessionHeartbeat(router: NextRouter) {
  const pathnameRef = useRef(router.pathname);
  pathnameRef.current = router.pathname;

  useEffect(() => {
    const checkSession = async () => {
      try {
        if (!(await ensureAuthSession())) return;

        // Migre le token legacy une seule fois
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

        const currentPath = pathnameRef.current;
        if (currentPath === '/login' || !localStorage.getItem('user')) return;

        const response = await fetch('/api/auth/me');
        if (![401, 403, 404].includes(response.status)) return;

        localStorage.removeItem('user');
        await fetch('/api/auth/logout', { method: 'POST' });
        window.dispatchEvent(new Event('fisafi:session-expired'));

        if (shouldRedirectOnSessionExpired(currentPath)) {
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
}

/** Corrige la hauteur de viewport (barre d'adresse mobile qui bouge). */
function useViewportHeightFix() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setVh = () => {
      const h =
        window.visualViewport && window.visualViewport.height
          ? window.visualViewport.height
          : window.innerHeight;
      document.documentElement.style.setProperty('--vh', `${h * 0.01}px`);
    };

    setVh();

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
    window.visualViewport?.addEventListener?.('resize', onResize);

    const onVisibility = () => setVh();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      window.visualViewport?.removeEventListener?.('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);
}

/** Anime les éléments au scroll (services, cards, etc.). */
function useScrollAnimations() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -40px 0px' },
    );

    const observeElements = () => {
      document
        .querySelectorAll('[data-observe], .services-grid, .services-grid-new')
        .forEach((el) => {
          if (!el.classList.contains('is-visible')) observer.observe(el);
        });
    };

    observeElements();

    const mutationObserver = new MutationObserver(observeElements);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);
}

/* ══════════════════════════════════════════════════════════════
   APP
   ══════════════════════════════════════════════════════════════ */
export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [adminNavigationLoading, setAdminNavigationLoading] = useState(false);

  useBodyClasses(router.pathname);
  useAdminNavigationLoading(router, setAdminNavigationLoading);
  useSessionHeartbeat(router);
  useViewportHeightFix();
  useScrollAnimations();

  useEffect(() => {
    if (isBlinkEngine()) {
      document.documentElement.classList.add('blink-no-smooth');
    }
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