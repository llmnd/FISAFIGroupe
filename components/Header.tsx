"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

/* ─── SVG Icons ─────────────────────────────────────────── */
const IconStar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);

const IconBell = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const IconShare = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/>
    <circle cx="6" cy="12" r="3"/>
    <circle cx="18" cy="19" r="3"/>
    <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>
  </svg>
);

const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconFacebook = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const IconLinkedin = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/>
  </svg>
);

const IconInstagram = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.117.63c-.794.297-1.473.702-2.082 1.31-.608.609-1.013 1.288-1.31 2.082C.428 4.905.226 5.775.166 7.053.015 8.333 0 8.74 0 12c0 3.26.015 3.667.072 4.947.06 1.277.261 2.148.558 2.936.297.794.702 1.473 1.31 2.082.609.608 1.288 1.013 2.082 1.31.788.297 1.658.499 2.936.559C8.333 23.985 8.74 24 12 24s3.667-.015 4.947-.072c1.28-.06 2.148-.262 2.936-.559.794-.297 1.473-.702 2.082-1.31.608-.609 1.013-1.288 1.31-2.082.297-.788.5-1.658.559-2.936C23.985 15.667 24 15.26 24 12s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.559-2.936-.297-.793-.702-1.473-1.31-2.082-.609-.608-1.288-1.013-2.082-1.31C19.148.262 18.28.06 17 0 15.667.015 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.56.217.96.477 1.382.896.419.42.679.82.896 1.381.17.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85 0 3.204-.013 3.585-.07 4.85-.053 1.17-.244 1.805-.413 2.227-.217.56-.477.96-.896 1.382-.42.419-.822.679-1.382.896-.422.17-1.057.36-2.227.413-1.265.057-1.645.07-4.85.07-3.204 0-3.584-.013-4.849-.07-1.17-.053-1.805-.244-2.227-.413-.56-.217-.96-.477-1.382-.896-.419-.42-.679-.822-.896-1.382-.17-.422-.36-1.057-.413-2.227-.057-1.265-.07-1.646-.07-4.85 0-3.204.013-3.584.07-4.849.053-1.17.244-1.805.413-2.227.217-.56.477-.96.896-1.382.42-.419.822-.679 1.382-.896.422-.17 1.057-.36 2.227-.413C8.416 2.173 8.796 2.16 12 2.16z"/>
    <path d="M12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

/* ─── Nav Items ──────────────────────────────────────────── */
type NavItem = { label: string; href: string };

const NAV_ITEMS: NavItem[] = [
  { label: "Accueil",    href: "/" },
  { label: "Services",   href: "/services" },
  { label: "Formation",  href: "/training" },
  { label: "Actualités", href: "/news" },
  { label: "Sessions",   href: "/sessions" },
  { label: "Contact",    href: "/contact" },
];

const SOCIALS = [
  { href: "https://www.facebook.com/share/179K7oUPAA/",               Icon: IconFacebook,  label: "Facebook",  className: "" },
  { href: "https://www.linkedin.com/company/fisafi-groupe-suarl/",     Icon: IconLinkedin,  label: "LinkedIn",  className: "" },
  { href: "https://www.instagram.com/",                                Icon: IconInstagram, label: "Instagram", className: "instagram" },
];

/* ─── Component ──────────────────────────────────────────── */
export default function Header() {
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [showSocials,  setShowSocials]  = useState(false);
  const [showSearch,   setShowSearch]   = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [scrolled,     setScrolled]     = useState(false);
  const [scrollPct,    setScrollPct]    = useState(0);
  const [isLoggedIn,   setIsLoggedIn]   = useState(false);
  const [activeLink,   setActiveLink]   = useState("/");
  const [socialPopupStyle, setSocialPopupStyle] = useState<React.CSSProperties>({});

  const headerRef  = useRef<HTMLElement>(null);
  const socialsRef = useRef<HTMLDivElement>(null);
  const searchRef  = useRef<HTMLInputElement>(null);
  const shareButtonRef = useRef<HTMLButtonElement>(null);
  const socialPopupRef = useRef<HTMLDivElement>(null);

  /* Auth check */
  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
  }, []);

  /* Body scroll lock when drawer open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
  }, [mobileOpen]);

  /* Scroll → progress bar + header shrink + update social bar position */
  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const isScrolled = scrollTop > 10;
      setScrolled(isScrolled);
      setScrollPct(docH > 0 ? (scrollTop / docH) * 100 : 0);
      
      // Update --header-h and --drawer-top CSS variables for elements to follow
      const newHeight = isScrolled ? "54px" : "62px";
      document.documentElement.style.setProperty("--header-h", newHeight);
      document.documentElement.style.setProperty("--drawer-top", newHeight);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Click outside to close popups */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        socialPopupRef.current &&
        !socialPopupRef.current.contains(e.target as Node) &&
        shareButtonRef.current &&
        !shareButtonRef.current.contains(e.target as Node)
      ) {
        setShowSocials(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Focus search input when overlay opens */
  useEffect(() => {
    if (showSearch) setTimeout(() => searchRef.current?.focus(), 80);
  }, [showSearch]);

  /* Keyboard shortcuts */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(v => !v);
      }
      if (e.key === "Escape") {
        setShowSearch(false);
        setShowSocials(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  /* Compute popup position dynamically */
  const handleToggleSocials = useCallback(() => {
    setShowSocials(v => {
      const next = !v;
      if (next && shareButtonRef.current) {
        const btn = shareButtonRef.current.getBoundingClientRect();
        const POPUP_WIDTH = 240; // 3 × 72px + 2 × 8px gap + 2 × 14px padding
        const MARGIN = 12;       // screen margin
        const viewportW = window.innerWidth;

        // Vertical position: just below the button
        const top = btn.bottom + MARGIN;

        // Horizontal position: try to align with button's left edge,
        // but clamp to stay in viewport
        let left = btn.left;
        if (left + POPUP_WIDTH > viewportW - MARGIN) {
          // Overflows right → anchor to right of button
          left = btn.right - POPUP_WIDTH;
        }
        left = Math.max(MARGIN, left); // never off-screen left

        setSocialPopupStyle({ top, left, right: "auto", position: "fixed" });
      }
      return next;
    });
  }, []);

  /* Shared socials grid */
  const SocialsGrid = () => (
    <div className="social-grid">
      {SOCIALS.map(({ href, Icon, label, className }, i) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`social-item ${className}`}
          style={{ "--i": i } as React.CSSProperties}
        >
          <Icon />
          <span>{label}</span>
        </a>
      ))}
    </div>
  );

  return (
    <>
      {/* ── Header ── */}
      <header
        ref={headerRef}
        className={`header${scrolled ? " scrolled" : ""}`}
        suppressHydrationWarning
      >
        {/* Logo */}
        <Link href="/" className="header-logo" onClick={(e) => { e.preventDefault(); setShowInfoModal(true); }}>
          <Image
            src="/logo.jpeg"
            alt="FiSAFi Groupe"
            width={50}
            height={50}
            priority
            className="header-logo-image"
          />
        </Link>

        {/* Desktop Nav */}
        <nav aria-label="Navigation principale">
          <ul className="header-nav">
            {NAV_ITEMS.map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`header-nav-link${activeLink === href ? " active" : ""}`}
                  onClick={() => setActiveLink(href)}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Action zone */}
        <div className="header-actions">
          {/* Search */}
          <button
            className="header-icon-btn"
            onClick={() => setShowSearch(true)}
            aria-label="Rechercher"
            title="Rechercher (⌘K)"
          >
            <IconSearch />
          </button>

          {/* Plus */}
          <button
            className="header-plus-btn"
            aria-label="Nouveau"
            title="Nouveau"
          >
            <IconPlus />
          </button>

          <div className="header-divider" />

          <div className="header-divider" />

          {/* Avatar / Login */}
          {isLoggedIn ? (
            <Link href="/dashboard" className="header-avatar-btn" aria-label="Mon compte">
              <div className="header-avatar-inner">FS</div>
              <span className="header-avatar-badge" aria-hidden="true" />
            </Link>
          ) : (
            <Link href="/login" className="header-login-btn" aria-label="Connexion">
              <IconUser />
            </Link>
          )}
        </div>

        {/* Mobile Burger */}
        <button
          className={`header-burger${mobileOpen ? " open" : ""}`}
          onClick={() => setMobileOpen(v => !v)}
          aria-label="Menu"
          aria-expanded={mobileOpen}
        >
          <span className="burger-line" />
          <span className="burger-line" />
          <span className="burger-line" />
        </button>

        {/* Progress Bar */}
        <div className="header-progress" aria-hidden="true">
          <div
            className="header-progress-fill"
            style={{ width: `${scrollPct}%` }}
          />
        </div>
      </header>

      {/* ── Social & Flags Bar ── */}
      <div 
        className="header-social-flags-bar"
        style={{ opacity: Math.max(0, 1 - scrollPct / 30) }}
      >
        <div className="bar-content">
          <div className="bar-socials">
            <button
              ref={shareButtonRef}
              className="header-icon-btn"
              onClick={handleToggleSocials}
              aria-label="Réseaux sociaux"
              title="Réseaux sociaux"
              aria-expanded={showSocials}
              aria-haspopup="true"
            >
              <IconShare />
            </button>
            <div
              ref={socialPopupRef}
              className={`header-social-popup${showSocials ? " open" : ""}`}
              style={socialPopupStyle}
              role="menu"
            >
              <SocialsGrid />
            </div>
          </div>

          <div className="bar-flags">
            <span className="flag">🇸🇳</span>
            <div className="flags-divider"></div>
            <span className="flag">🇹🇩</span>
          </div>
        </div>
      </div>

      {/* ── Mobile Drawer ── */}
      <nav
        className={`header-drawer${mobileOpen ? " open" : ""}`}
        aria-label="Menu mobile"
      >
        <div className="header-drawer-inner">
          <ul className="header-drawer-nav">
            {NAV_ITEMS.map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`header-drawer-link${activeLink === href ? " active" : ""}`}
                  onClick={() => { setActiveLink(href); closeMobile(); }}
                >
                  {label}
                  <span className="drawer-chevron">›</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="header-drawer-footer">
            <Link
              href={isLoggedIn ? "/dashboard" : "/login"}
              className="header-drawer-cta"
              onClick={closeMobile}
            >
              <IconUser />
              {isLoggedIn ? "Dashboard" : "Connexion"}
            </Link>

            <div className="header-drawer-socials">
              {SOCIALS.map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="header-drawer-social"
                  aria-label={label}
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Search Overlay ── */}
      {showSearch && (
        <div
          className="header-search-overlay open"
          onClick={(e) => { if (e.target === e.currentTarget) setShowSearch(false); }}
          role="dialog"
          aria-label="Recherche"
          style={{ position: 'fixed', inset: 0, zIndex: 1600, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        >
          <div className="header-search-box">
            <IconSearch />
            <input
              ref={searchRef}
              className="header-search-input"
              type="text"
              placeholder="Rechercher…"
              aria-label="Recherche"
            />
            <span className="header-search-kbd">Échap</span>
          </div>
        </div>
      )}

      {/* ── Info Modal ── */}
      {showInfoModal && (
        <div
          className="header-info-overlay"
          onClick={() => setShowInfoModal(false)}
          role="dialog"
          aria-label="À propos de FiSAFi Groupe"
          style={{ position: 'fixed', inset: 0, zIndex: 1600, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        >
          <div className="header-info-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="header-info-close"
              onClick={() => setShowInfoModal(false)}
              aria-label="Fermer"
            >
              ✕
            </button>

            <div className="header-info-content">
              <div className="header-info-logo">
                <Image
                  src="/logo.jpeg"
                  alt="FiSAFi Groupe"
                  width={80}
                  height={80}
                  priority
                  style={{ borderRadius: "50%", objectFit: "cover" }}
                />
              </div>

              <h2 className="header-info-title">FiSAFi Groupe</h2>
              <p className="header-info-tagline">L'expertise qui fait la différence</p>

              <div className="header-info-divider" />

              <div className="header-info-items">
                <div className="header-info-item">
                  <span className="header-info-label">Localisation</span>
                  <span className="header-info-value">Liberté 6 Extension, Dakar Sénégal</span>
                </div>

                <div className="header-info-item">
                  <span className="header-info-label">Téléphone</span>
                  <a href="tel:+221788965939" className="header-info-value header-info-link">
                    +221 78 896 59 39
                  </a>
                </div>

                <div className="header-info-item">
                  <span className="header-info-label">Email</span>
                  <a href="mailto:contact@fisafigroupe.com" className="header-info-value header-info-link">
                    contact@fisafigroupe.com
                  </a>
                </div>

                <div className="header-info-item">
                  <span className="header-info-label">Spécialités</span>
                  <span className="header-info-value">Réseaux • IT • Cybersécurité • Conseil</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}