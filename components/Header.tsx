"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

/* ─── Icons ─── */
const IconFacebook = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);
const IconLinkedin = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4V9h4v1.5A6 6 0 0 1 16 8z"/>
    <rect x="2" y="9" width="4" height="12"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);
const IconInstagram = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);
const IconTwitter = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
  </svg>
);
const IconYoutube = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.4a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none"/>
  </svg>
);
const IconSearch = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconChevron = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconGlobe = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

type NavChild = { label: string; href: string };
type NavItem  = { label: string; href?: string; children?: NavChild[] };
type Lang     = "FR" | "EN";

const NAV_ITEMS: NavItem[] = [
  { label: "Accueil", href: "/" },
  {
    label: "Nos pôles d'activités",
    children: [{ label: "Services", href: "/services" }],
  },
  {
    label: "Ressources",
    children: [
      { label: "Actualités", href: "/news" },
      { label: "Formation",  href: "/training" },
      { label: "Sessions",   href: "/sessions" },
    ],
  },
  { label: "Contact", href: "/contact" },
];

/*
 * Heights — single source of truth shared by JS and CSS custom properties.
 * CSS variables in :root must match these values.
 */
const H_L1        = 110; // logo row
const H_L2        =  44; // nav / socials row
const H_L3        =  44; // burger row (mobile only)
const H_MOBILE    = H_L1 + H_L2 + H_L3; // 198
const H_DESKTOP   = H_L1 + H_L2;        // 154
const H_COLLAPSED = H_L3;               //  44

/*
 * Lerp factor — controls how fast the header catches up to the scroll target.
 * 0.12 = very smooth / slightly floaty
 * 0.18 = snappier but still silky
 */
const LERP_FACTOR   = 0.14;
const SNAP_EPSILON  = 0.08; // px threshold below which we snap to exact value

export default function Header() {
  const [mobileOpen,     setMobileOpen]     = useState(false);
  const [openDropdown,   setOpenDropdown]   = useState<string | null>(null);
  const [isLoggedIn,     setIsLoggedIn]     = useState(false);
  const [searchOpen,     setSearchOpen]     = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [lang,           setLang]           = useState<Lang>("FR");
  const [langOpen,       setLangOpen]       = useState(false);
  const [mobSearchOpen,  setMobSearchOpen]  = useState(false);
  const [topbarHidden,   setTopbarHidden]   = useState(false);

  const navRef         = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const langRef        = useRef<HTMLDivElement>(null);
  const mobSearchRef   = useRef<HTMLInputElement>(null);

  useEffect(() => { setIsLoggedIn(!!localStorage.getItem("token")); }, []);

  /* Lock body scroll when mobile drawer is open */
  useEffect(() => { document.body.style.overflow = mobileOpen ? "hidden" : ""; }, [mobileOpen]);

  /*
   * ─────────────────────────────────────────────────────────────────────────
   * SMOOTH SCROLL — lerp-based rAF loop
   * ─────────────────────────────────────────────────────────────────────────
   *
   * How it works:
   *   • `target`  = the raw clamped scroll value we WANT to reach (0–H_L1)
   *   • `current` = the animated value we are currently AT (chases target)
   *   • Each rAF frame: current += (target - current) * LERP_FACTOR
   *   • When |target - current| < SNAP_EPSILON we snap and stop the loop.
   *   • On the next scroll event we restart the loop.
   *
   * Why this eliminates jitter:
   *   • No direct binding of scroll position → CSS variable (which skips frames)
   *   • All DOM writes happen inside a single rAF callback per frame
   *   • The spacer <div> absorbs header height instead of body padding-top
   *     (body padding changes trigger a full layout; div height is cheaper)
   *   • GPU compositing: layers use translate3d, isolate, will-change
   * ─────────────────────────────────────────────────────────────────────────
   */
  useEffect(() => {
    let rafId        = 0;
    let current      = 0;
    let target       = 0;
    let prevHidden   = false;
    let prevShellH   = -1;

    // Cache isMobile so we don't recompute every frame
    let isMobile = window.innerWidth <= 900;

    // Write all CSS variables in one batch
    const applyCSS = (offset: number) => {
      const fullH  = isMobile ? H_MOBILE    : H_DESKTOP;
      const minH   = isMobile ? H_COLLAPSED : H_L2;
      const shellH = Math.max(fullH - offset, minH);

      // Only touch the DOM when something actually changed
      if (shellH !== prevShellH) {
        prevShellH = shellH;

        const rs = document.documentElement.style;
        rs.setProperty("--fh-scroll-offset", `-${offset}px`);
        rs.setProperty("--fh-shell-h",        `${shellH}px`);
        rs.setProperty("--fh-drawer-top",      `${shellH}px`);
      }

      // Sync React state only when crossing the threshold
      const hidden = offset >= H_L1 - SNAP_EPSILON;
      if (hidden !== prevHidden) {
        prevHidden = hidden;
        setTopbarHidden(hidden);
      }
    };

    // The rAF loop — runs only while unsettled
    const frame = () => {
      rafId = 0;

      current += (target - current) * LERP_FACTOR;
      if (Math.abs(target - current) < SNAP_EPSILON) current = target;

      applyCSS(current);

      if (current !== target) {
        rafId = requestAnimationFrame(frame);
      }
    };

    const scheduleFrame = () => {
      if (!rafId) rafId = requestAnimationFrame(frame);
    };

    const onScroll = () => {
      target = Math.min(window.scrollY, H_L1);
      scheduleFrame();
    };

    const onResize = () => {
      isMobile  = window.innerWidth <= 900;
      prevShellH = -1; // force CSS update on next frame
      target    = Math.min(window.scrollY, H_L1);
      scheduleFrame();
    };

    // Initialise synchronously (no scroll yet)
    target  = Math.min(window.scrollY, H_L1);
    current = target;
    applyCSS(current);

    window.addEventListener("scroll", onScroll,  { passive: true });
    window.addEventListener("resize", onResize,   { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  /* Close dropdowns on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
        setSearchOpen(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Listen for external open request */
  useEffect(() => {
    const handler = () => {
      setMobileOpen(true);
      window.requestAnimationFrame(() => window.scrollTo({ top: 0 }));
    };
    window.addEventListener("open-mobile-drawer", handler as EventListener);
    return () => window.removeEventListener("open-mobile-drawer", handler as EventListener);
  }, []);

  /* Focus search inputs when opened */
  useEffect(() => { if (searchOpen)    setTimeout(() => searchInputRef.current?.focus(), 50); }, [searchOpen]);
  useEffect(() => { if (mobSearchOpen) setTimeout(() => mobSearchRef.current?.focus(),   50); }, [mobSearchOpen]);

  const closeMobile = () => { setMobileOpen(false); setMobileExpanded(null); };
  const selectLang  = (l: Lang) => { setLang(l); setLangOpen(false); };

  return (
    <>


      <header
        className={`fh${topbarHidden ? " topbar-hidden" : ""}`}
        ref={navRef}
        suppressHydrationWarning
      >
        {/* ══ LAYER 1 — Logo ══ */}
        <div className="fh-l1" suppressHydrationWarning>
          <Link href="/" className="fh-logo">
            <Image
              src="/logo.jpeg"
              alt="FiSAFi Groupe"
              width={160} height={72}
              className="fh-logo-img"
              priority
            />
          </Link>

          {/* Desktop only: socials + lang */}
          <div className="fh-l1-right">
            <nav className="fh-socials" aria-label="Réseaux sociaux">
              <a href="https://www.facebook.com/share/179K7oUPAA/" target="_blank" rel="noopener noreferrer" className="fh-soc fh-soc--fb" aria-label="Facebook"><IconFacebook /></a>
              <a href="https://www.linkedin.com/company/fisafi-groupe-suarl/" target="_blank" rel="noopener noreferrer" className="fh-soc fh-soc--li" aria-label="LinkedIn"><IconLinkedin /></a>
              <a href="#" className="fh-soc fh-soc--ig" aria-label="Instagram"><IconInstagram /></a>
            </nav>
            <div className="fh-lang-wrap" ref={langRef}>
              <button
                className="fh-lang-btn"
                aria-label="Changer de langue"
                aria-expanded={langOpen}
                onClick={() => setLangOpen(v => !v)}
              >
                <IconGlobe /> {lang} <IconChevron />
              </button>
              <div className={`fh-lang-dd${langOpen ? " open" : ""}`} role="listbox">
                {(["FR", "EN"] as Lang[]).map(l => (
                  <button
                    key={l}
                    className={`fh-lang-opt${lang === l ? " active" : ""}`}
                    role="option"
                    aria-selected={lang === l}
                    onClick={() => selectLang(l)}
                  >
                    {l === "FR" ? "🇫🇷 Français" : "🇬🇧 English"}
                    {lang === l && <span className="fh-lang-check"><IconCheck /></span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══ LAYER 2 — Mobile: socials + lang  |  Desktop: nav + actions ══ */}
        <div className="fh-l2">

          {/* Mobile left: socials */}
          <div className="fh-l2-mob">
            <nav className="fh-socials" aria-label="Réseaux sociaux">
              <a href="https://www.facebook.com/share/179K7oUPAA/" target="_blank" rel="noopener noreferrer" className="fh-soc fh-soc--fb" aria-label="Facebook"><IconFacebook /></a>
              <a href="https://www.linkedin.com/company/fisafi-groupe-suarl/" target="_blank" rel="noopener noreferrer" className="fh-soc fh-soc--li" aria-label="LinkedIn"><IconLinkedin /></a>
              <a href="#" className="fh-soc fh-soc--ig" aria-label="Instagram"><IconInstagram /></a>
            </nav>
          </div>

          {/* Mobile right: lang */}
          <div className="fh-l2-mob" style={{ marginLeft: "auto" }}>
            <div className="fh-lang-wrap">
              <button
                className="fh-lang-btn"
                aria-label="Langue"
                aria-expanded={langOpen}
                onClick={() => setLangOpen(v => !v)}
              >
                <IconGlobe /> {lang} <IconChevron />
              </button>
              <div className={`fh-lang-dd${langOpen ? " open" : ""}`} role="listbox">
                {(["FR", "EN"] as Lang[]).map(l => (
                  <button
                    key={l}
                    className={`fh-lang-opt${lang === l ? " active" : ""}`}
                    role="option"
                    aria-selected={lang === l}
                    onClick={() => selectLang(l)}
                  >
                    {l === "FR" ? "🇫🇷 Français" : "🇬🇧 English"}
                    {lang === l && <span className="fh-lang-check"><IconCheck /></span>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop: nav links */}
          <nav className="fh-nav" aria-label="Navigation principale">
            {NAV_ITEMS.map(item =>
              item.children ? (
                <div
                  className="fh-ni"
                  key={item.label}
                  onMouseEnter={() => setOpenDropdown(item.label)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    className="fh-nb"
                    aria-expanded={openDropdown === item.label}
                    onClick={() => setOpenDropdown(v => v === item.label ? null : item.label)}
                  >
                    {item.label} <IconChevron />
                  </button>
                  <div className={`fh-dd${openDropdown === item.label ? " open" : ""}`}>
                    {item.children.map(c => (
                      <Link key={c.href} href={c.href} onClick={() => setOpenDropdown(null)}>
                        {c.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="fh-ni" key={item.label}>
                  <Link href={item.href!} className="fh-nl">{item.label}</Link>
                </div>
              )
            )}
          </nav>

          {/* Desktop: connexion + search */}
          <div className="fh-l2-right-dsk">
            <Link
              href={isLoggedIn ? "/dashboard" : "/login"}
              className="fh-nl"
              style={{ color: isLoggedIn ? "var(--fh-accent2)" : undefined }}
            >
              <IconUser /> {isLoggedIn ? "Dashboard" : "Connexion"}
            </Link>
            <div className={`fh-sw${searchOpen ? " open" : ""}`} role="search">
              <button className="fh-sb" aria-label="Rechercher" onClick={() => setSearchOpen(v => !v)}>
                <IconSearch />
              </button>
              <input
                ref={searchInputRef}
                className="fh-si"
                placeholder="Rechercher…"
                onKeyDown={e => {
                  if (e.key === "Escape") setSearchOpen(false);
                  if (e.key === "Enter") {
                    const q = (e.target as HTMLInputElement).value.trim();
                    if (q) window.location.href = `/search?q=${encodeURIComponent(q)}`;
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* ══ LAYER 3 — Burger + Search (mobile only) ══ */}
        <div className="fh-l3">
          <button
            className={`fh-burger${mobileOpen ? " open" : ""}`}
            aria-label="Menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(v => !v)}
          >
            <span /><span /><span />
          </button>

          <div className={`fh-mob-search${mobSearchOpen ? " open" : ""}`}>
            <input
              ref={mobSearchRef}
              className="fh-mob-search-input"
              placeholder="Rechercher…"
              onKeyDown={e => {
                if (e.key === "Escape") setMobSearchOpen(false);
                if (e.key === "Enter") {
                  const q = (e.target as HTMLInputElement).value.trim();
                  if (q) window.location.href = `/search?q=${encodeURIComponent(q)}`;
                }
              }}
            />
            <button className="fh-msb" aria-label="Rechercher" onClick={() => setMobSearchOpen(v => !v)}>
              <IconSearch />
            </button>
          </div>
        </div>
      </header>

      {/* ══ Mobile drawer ══ */}
      <div
        className={`fh-drawer${mobileOpen ? " open" : ""}`}
        role="navigation"
        aria-label="Menu mobile"
      >
        <div>
          {NAV_ITEMS.map(item =>
            item.children ? (
              <div className="fh-dm" key={item.label}>
                <button
                  className={`fh-dmt${mobileExpanded === item.label ? " expanded" : ""}`}
                  onClick={() => setMobileExpanded(v => v === item.label ? null : item.label)}
                >
                  {item.label} <IconChevron />
                </button>
                <div className={`fh-dsub${mobileExpanded === item.label ? " open" : ""}`}>
                  {item.children.map(c => (
                    <Link key={c.href} href={c.href} onClick={closeMobile}>{c.label}</Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="fh-dm" key={item.label}>
                <Link href={item.href!} className="fh-dml" onClick={closeMobile}>
                  {item.label}
                </Link>
              </div>
            )
          )}
        </div>

        <div className="fh-dfooter">
          <Link
            href={isLoggedIn ? "/dashboard" : "/login"}
            className="fh-dcta"
            onClick={closeMobile}
          >
            <IconUser /> {isLoggedIn ? "Dashboard" : "Connexion"}
          </Link>
          <nav className="fh-dsocials" aria-label="Réseaux sociaux">
            <a href="https://www.facebook.com/share/179K7oUPAA/" target="_blank" rel="noopener noreferrer" className="fh-soc fh-soc--fb" aria-label="Facebook"><IconFacebook /></a>
            <a href="https://www.linkedin.com/company/fisafi-groupe-suarl/" target="_blank" rel="noopener noreferrer" className="fh-soc fh-soc--li" aria-label="LinkedIn"><IconLinkedin /></a>
            <a href="#" className="fh-soc fh-soc--tw" aria-label="Twitter"><IconTwitter /></a>
            <a href="#" className="fh-soc fh-soc--ig" aria-label="Instagram"><IconInstagram /></a>
            <a href="#" className="fh-soc fh-soc--yt" aria-label="YouTube"><IconYoutube /></a>
          </nav>
        </div>
      </div>
    </>
  );
}