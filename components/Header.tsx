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

export default function Header() {
  const [mobileOpen,     setMobileOpen]     = useState(false);
  const [openDropdown,   setOpenDropdown]   = useState<string | null>(null);
  const [isLoggedIn,     setIsLoggedIn]     = useState(false);
  const [searchOpen,     setSearchOpen]     = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [lang,           setLang]           = useState<Lang>("FR");
  const [langOpen,       setLangOpen]       = useState(false);
  const [mobSearchOpen,  setMobSearchOpen]  = useState(false);
  const [showTopbar,     setShowTopbar]     = useState(true);

  const navRef         = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const langRef        = useRef<HTMLDivElement>(null);
  const mobSearchRef   = useRef<HTMLInputElement>(null);
  const lastScrollY    = useRef(0);

  useEffect(() => { setIsLoggedIn(!!localStorage.getItem("token")); }, []);

  /* Lock body scroll when mobile drawer is open */
  useEffect(() => { document.body.style.overflow = mobileOpen ? "hidden" : ""; }, [mobileOpen]);

  /* Hide top bar on scroll down, show on scroll up — huge dead zone prevents jitter */
  useEffect(() => {
    let ticking = false;
    let lastState = true;
    
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const isScrollingDown = scrollY > lastScrollY.current;
          lastScrollY.current = scrollY;
          
          let newState = lastState;
          // Extremely conservative: only hide if scrolled WAY down
          if (isScrollingDown && scrollY > 400 && lastState) {
            newState = false;
          } 
          // Only show if scrolled back to absolute top (or very close)
          else if (!isScrollingDown && scrollY < 20 && !lastState) {
            newState = true;
          }
          
          if (newState !== lastState) {
            setShowTopbar(newState);
            lastState = newState;
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
      <style>{`
        /* ── Reset & tokens ─────────────────────────── */
        .fh *, .fh-drawer * { box-sizing: border-box; }
        :root {
          --fh-bg:      #ffffff;
          --fh-border:  #e8e8e8;
          --fh-text:    #1a1a2e;
          --fh-muted:   #6b7280;
          --fh-accent:  #0055a4;
          --fh-accent2: #f5a623;
          --fh-soc-size:36px;
          --fh-radius:  8px;
          --fh-trans:   200ms ease;
        }

        /* ── Header shell — sticky, hides topbar on scroll ── */
        .fh {
          position: sticky;
          top: 0;
          z-index: 1000;
          background: var(--fh-bg);
          border-bottom: 1px solid var(--fh-border);
          box-shadow: 0 1px 6px rgba(0,0,0,.06);
          width: 100%;
        }

        /* ── Layer 1 — Logo + desktop socials/lang ── */
        .fh-l1 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          height: 110px;
          border-bottom: 1px solid var(--fh-border);
          overflow: hidden;
          transition: max-height 350ms cubic-bezier(.4, 0, .2, 1), opacity 350ms ease-out, border 350ms ease-out;
          opacity: 1;
          max-height: 100px;
          will-change: max-height, opacity;
        }
        @media (min-width: 901px) {
          .fh-l1 { padding: 0 40px; }
        }
        
        /* When topbar is hidden */
        .fh.topbar-hidden .fh-l1 {
          max-height: 0;
          opacity: 0;
          border: none;
          padding-top: 0;
          padding-bottom: 0;
          pointer-events: none;
        }

        .fh-logo { display: flex; align-items: center; gap: 12px; text-decoration: none; flex-shrink: 0; }
        .fh-logo-img { width: auto; height: 120px; object-fit: contain; display: block; }

        .fh-l1-right {
          display: none;
          align-items: center;
          gap: 20px;
        }
        @media (min-width: 901px) {
          .fh-l1-right { display: flex; }
        }

        /* ── Layer 2 — nav row ── */
        .fh-l2 {
          display: flex;
          align-items: center;
          padding: 0 24px;
          height: 44px;
          border-bottom: 1px solid var(--fh-border);
          gap: 16px;
          transition: height 300ms ease-out, padding 300ms ease-out;
        }
        @media (min-width: 901px) {
          .fh-l2 { padding: 0 40px; }
        }

        /* Mobile-only socials/lang inside L2 */
        .fh-l2-mob {
          display: flex;
          align-items: center;
        }
        @media (min-width: 901px) {
          .fh-l2-mob { display: none !important; }
        }

        /* Desktop nav */
        .fh-nav {
          display: none;
          align-items: center;
          gap: 4px;
          flex: 1;
        }
        @media (min-width: 901px) {
          .fh-nav { display: flex; }
        }

        .fh-ni  { position: relative; }
        .fh-nl, .fh-nb {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 12px;
          font-size: 13.5px; font-weight: 500; letter-spacing: .01em;
          color: var(--fh-text);
          text-decoration: none;
          border: none; background: none; cursor: pointer;
          border-radius: var(--fh-radius);
          transition: color var(--fh-trans), background var(--fh-trans);
          white-space: nowrap;
        }
        .fh-nl:hover, .fh-nb:hover {
          color: var(--fh-accent);
          background: rgba(0,85,164,.06);
        }
        .fh-nb svg { transition: transform var(--fh-trans); }
        .fh-nb[aria-expanded="true"] svg { transform: rotate(180deg); }

        /* Dropdown */
        .fh-dd {
          position: absolute; top: calc(100% + 8px); left: 0;
          background: var(--fh-bg); border: 1px solid var(--fh-border);
          border-radius: var(--fh-radius); min-width: 180px;
          box-shadow: 0 8px 24px rgba(0,0,0,.10);
          padding: 6px;
          opacity: 0; visibility: hidden; transform: translateY(-6px);
          transition: opacity var(--fh-trans), transform var(--fh-trans), visibility 0s linear var(--fh-trans);
          z-index: 200;
        }
        .fh-dd.open {
          opacity: 1; visibility: visible; transform: translateY(0);
          transition: opacity var(--fh-trans), transform var(--fh-trans), visibility 0s;
        }
        .fh-dd a {
          display: block; padding: 8px 12px;
          font-size: 13px; font-weight: 500; color: var(--fh-text);
          text-decoration: none; border-radius: 6px;
          transition: background var(--fh-trans), color var(--fh-trans);
        }
        .fh-dd a:hover { background: rgba(0,85,164,.06); color: var(--fh-accent); }

        /* Desktop right actions */
        .fh-l2-right-dsk {
          display: none;
          align-items: center;
          gap: 8px;
          margin-left: auto;
        }
        @media (min-width: 901px) {
          .fh-l2-right-dsk { display: flex; }
        }
        .fh-l2-right-dsk .fh-nl {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13.5px; font-weight: 600;
          color: var(--fh-accent);
        }
        .fh-l2-right-dsk .fh-nl:hover { color: var(--fh-accent2); background: transparent; }

        /* Search widget */
        .fh-sw { display: flex; align-items: center; position: relative; }
        .fh-sb {
          display: flex; align-items: center; justify-content: center;
          width: 34px; height: 34px; border: none; background: none; cursor: pointer;
          color: var(--fh-muted); border-radius: var(--fh-radius);
          transition: color var(--fh-trans), background var(--fh-trans);
        }
        .fh-sb:hover { color: var(--fh-accent); background: rgba(0,85,164,.06); }
        .fh-si {
          width: 0; opacity: 0; overflow: hidden;
          border: none; outline: none; background: transparent;
          font-size: 13px; color: var(--fh-text);
          transition: width 250ms ease, opacity 250ms ease, padding 250ms ease;
          padding: 0;
        }
        .fh-sw.open .fh-si {
          width: 180px; opacity: 1; padding: 0 10px;
          border-bottom: 1.5px solid var(--fh-accent);
        }

        /* ── Layer 3 — Mobile: burger + search ── */
        .fh-l3 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          height: 44px;
        }
        @media (min-width: 901px) {
          .fh-l3 { display: none; }
        }

        /* Burger */
        .fh-burger {
          display: flex; flex-direction: column; justify-content: center; gap: 5px;
          width: 38px; height: 38px; padding: 6px;
          border: none; background: none; cursor: pointer;
          border-radius: var(--fh-radius);
          transition: background var(--fh-trans);
        }
        .fh-burger:hover { background: rgba(0,85,164,.06); }
        .fh-burger span {
          display: block; height: 2px; width: 100%; background: var(--fh-text);
          border-radius: 2px;
          transition: transform 280ms ease, opacity 200ms ease, width 200ms ease;
          transform-origin: center;
        }
        .fh-burger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .fh-burger.open span:nth-child(2) { opacity: 0; width: 0; }
        .fh-burger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

        /* Mobile search */
        .fh-mob-search { display: flex; align-items: center; }
        .fh-mob-search-input {
          width: 0; opacity: 0; overflow: hidden;
          border: none; outline: none; background: transparent;
          font-size: 13px; color: var(--fh-text);
          transition: width 250ms ease, opacity 250ms ease, padding 250ms ease;
          padding: 0;
        }
        .fh-mob-search.open .fh-mob-search-input {
          width: 140px; opacity: 1; padding: 0 8px;
          border-bottom: 1.5px solid var(--fh-accent);
        }
        .fh-msb {
          display: flex; align-items: center; justify-content: center;
          width: 38px; height: 38px; border: none; background: none; cursor: pointer;
          color: var(--fh-muted); border-radius: var(--fh-radius);
          transition: color var(--fh-trans), background var(--fh-trans);
        }
        .fh-msb:hover { color: var(--fh-accent); background: rgba(0,85,164,.06); }

        /* ── Socials ── */
        .fh-socials { display: flex; align-items: center; gap: 4px; }
        .fh-soc {
          display: flex; align-items: center; justify-content: center;
          width: var(--fh-soc-size); height: var(--fh-soc-size);
          border-radius: 50%; border: 1.5px solid transparent;
          color: var(--fh-muted);
          text-decoration: none;
          transition: color var(--fh-trans), border-color var(--fh-trans), background var(--fh-trans), transform var(--fh-trans);
        }
        .fh-soc:hover { transform: translateY(-2px); }
        .fh-soc--fb:hover { color: #1877f2; border-color: #1877f2; background: rgba(24,119,242,.06); }
        .fh-soc--li:hover { color: #0a66c2; border-color: #0a66c2; background: rgba(10,102,194,.06); }
        .fh-soc--ig:hover { color: #e1306c; border-color: #e1306c; background: rgba(225,48,108,.06); }
        .fh-soc--tw:hover { color: #1da1f2; border-color: #1da1f2; background: rgba(29,161,242,.06); }
        .fh-soc--yt:hover { color: #ff0000; border-color: #ff0000; background: rgba(255,0,0,.06); }

        /* ── Language selector ── */
        .fh-lang-wrap { position: relative; }
        .fh-lang-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 5px 10px;
          font-size: 12.5px; font-weight: 600; letter-spacing: .04em;
          color: var(--fh-muted);
          border: 1.5px solid var(--fh-border); border-radius: 20px;
          background: none; cursor: pointer;
          transition: color var(--fh-trans), border-color var(--fh-trans), background var(--fh-trans);
        }
        .fh-lang-btn svg { transition: transform var(--fh-trans); }
        .fh-lang-btn:hover,
        .fh-lang-btn[aria-expanded="true"] {
          color: var(--fh-accent); border-color: var(--fh-accent);
          background: rgba(0,85,164,.04);
        }
        .fh-lang-btn[aria-expanded="true"] svg { transform: rotate(180deg); }
        .fh-lang-dd {
          position: absolute; right: 0; top: calc(100% + 8px);
          background: var(--fh-bg); border: 1px solid var(--fh-border);
          border-radius: var(--fh-radius); min-width: 130px;
          box-shadow: 0 8px 24px rgba(0,0,0,.10);
          padding: 6px;
          opacity: 0; visibility: hidden; transform: translateY(-6px);
          transition: opacity var(--fh-trans), transform var(--fh-trans), visibility 0s linear var(--fh-trans);
          z-index: 300;
        }
        .fh-lang-dd.open {
          opacity: 1; visibility: visible; transform: translateY(0);
          transition: opacity var(--fh-trans), transform var(--fh-trans), visibility 0s;
        }
        .fh-lang-opt {
          display: flex; align-items: center; justify-content: space-between;
          width: 100%; padding: 8px 12px;
          font-size: 13px; font-weight: 500; color: var(--fh-text);
          border: none; background: none; cursor: pointer; text-align: left;
          border-radius: 6px;
          transition: background var(--fh-trans), color var(--fh-trans);
        }
        .fh-lang-opt:hover { background: rgba(0,85,164,.06); color: var(--fh-accent); }
        .fh-lang-opt.active { color: var(--fh-accent); font-weight: 600; }
        .fh-lang-check { color: var(--fh-accent); display: flex; }

        /* ── Mobile drawer ── */
        /*
         * The drawer is position:fixed and opens downward from the header.
         * Mobile header: L1(80) + L2(44) + L3(44) = 168px
         */
        .fh-drawer {
          position: fixed;
          top: 168px;
          left: 0; right: 0;
          max-height: 0;
          background: var(--fh-bg);
          z-index: 999;
          transition: max-height 350ms cubic-bezier(.4,0,.2,1), box-shadow 350ms cubic-bezier(.4,0,.2,1);
          overflow-y: auto;
          overflow-x: hidden;
          display: flex; flex-direction: column;
          box-shadow: 0 4px 12px rgba(0,0,0,0);
        }
        .fh-drawer.open { 
          max-height: calc(100vh - 168px);
          box-shadow: 0 4px 12px rgba(0,0,0,.08);
        }

        /* Nav items in drawer */
        .fh-dm { border-bottom: 1px solid var(--fh-border); }
        .fh-dml, .fh-dmt {
          display: flex; align-items: center; justify-content: space-between;
          width: 100%; padding: 16px 24px;
          font-size: 15px; font-weight: 500; color: var(--fh-text);
          text-decoration: none; border: none; background: none; cursor: pointer;
          text-align: left;
          transition: color var(--fh-trans), background var(--fh-trans);
        }
        .fh-dml:hover, .fh-dmt:hover { color: var(--fh-accent); background: rgba(0,85,164,.04); }
        .fh-dmt svg { transition: transform var(--fh-trans); flex-shrink: 0; }
        .fh-dmt.expanded svg { transform: rotate(180deg); }

        .fh-dsub {
          max-height: 0; overflow: hidden;
          transition: max-height 280ms cubic-bezier(.4,0,.2,1);
          background: rgba(0,85,164,.03);
        }
        .fh-dsub.open { max-height: 300px; }
        .fh-dsub a {
          display: block; padding: 12px 36px;
          font-size: 14px; color: var(--fh-muted); text-decoration: none;
          transition: color var(--fh-trans);
        }
        .fh-dsub a:hover { color: var(--fh-accent); }

        /* Drawer footer */
        .fh-dfooter {
          margin-top: auto;
          padding: 20px 24px 28px;
          border-top: 1px solid var(--fh-border);
          display: flex; flex-direction: column; gap: 16px;
        }
        .fh-dcta {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 13px 24px;
          font-size: 14px; font-weight: 600;
          color: #fff; background: var(--fh-accent);
          border-radius: 10px; text-decoration: none;
          transition: background var(--fh-trans), transform var(--fh-trans);
        }
        .fh-dcta:hover { background: #003f80; transform: translateY(-1px); }
        .fh-dsocials { display: flex; align-items: center; gap: 8px; }
      `}</style>

      <header className={`fh${showTopbar ? "" : " topbar-hidden"}`} ref={navRef} suppressHydrationWarning>

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
              <button className="fh-lang-btn" aria-label="Changer de langue" aria-expanded={langOpen} onClick={() => setLangOpen(v => !v)}>
                <IconGlobe /> {lang} <IconChevron />
              </button>
              <div className={`fh-lang-dd${langOpen ? " open" : ""}`} role="listbox">
                {(["FR", "EN"] as Lang[]).map(l => (
                  <button key={l} className={`fh-lang-opt${lang === l ? " active" : ""}`} role="option" aria-selected={lang === l} onClick={() => selectLang(l)}>
                    {l === "FR" ? "🇫🇷 Français" : "🇬🇧 English"}
                    {lang === l && <span className="fh-lang-check"><IconCheck /></span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══ LAYER 2 — Mobile: socials + lang | Desktop: nav + actions ══ */}
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
              <button className="fh-lang-btn" aria-label="Langue" aria-expanded={langOpen} onClick={() => setLangOpen(v => !v)}>
                <IconGlobe /> {lang} <IconChevron />
              </button>
              <div className={`fh-lang-dd${langOpen ? " open" : ""}`} role="listbox">
                {(["FR", "EN"] as Lang[]).map(l => (
                  <button key={l} className={`fh-lang-opt${lang === l ? " active" : ""}`} role="option" aria-selected={lang === l} onClick={() => selectLang(l)}>
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
                <div className="fh-ni" key={item.label}
                  onMouseEnter={() => setOpenDropdown(item.label)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button className="fh-nb" aria-expanded={openDropdown === item.label}
                    onClick={() => setOpenDropdown(v => v === item.label ? null : item.label)}>
                    {item.label} <IconChevron />
                  </button>
                  <div className={`fh-dd${openDropdown === item.label ? " open" : ""}`}>
                    {item.children.map(c => (
                      <Link key={c.href} href={c.href} onClick={() => setOpenDropdown(null)}>{c.label}</Link>
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
            <Link href={isLoggedIn ? "/dashboard" : "/login"} className="fh-nl"
              style={{ color: isLoggedIn ? "var(--fh-accent2)" : undefined }}>
              <IconUser /> {isLoggedIn ? "Dashboard" : "Connexion"}
            </Link>
            <div className={`fh-sw${searchOpen ? " open" : ""}`} role="search">
              <button className="fh-sb" aria-label="Rechercher" onClick={() => setSearchOpen(v => !v)}>
                <IconSearch />
              </button>
              <input ref={searchInputRef} className="fh-si" placeholder="Rechercher…"
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
            aria-label="Menu" aria-expanded={mobileOpen}
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
      <div className={`fh-drawer${mobileOpen ? " open" : ""}`} role="navigation" aria-label="Menu mobile">
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
                <Link href={item.href!} className="fh-dml" onClick={closeMobile}>{item.label}</Link>
              </div>
            )
          )}
        </div>

        <div className="fh-dfooter">
          <Link href={isLoggedIn ? "/dashboard" : "/login"} className="fh-dcta" onClick={closeMobile}>
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