"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const desktopMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
  }, [mobileOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (desktopMenuRef.current && !desktopMenuRef.current.contains(e.target as Node)) {
        setDesktopMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <nav className="h-nav">
        <Link href="/" className="h-logo">
          Fi<span>SAFI</span>&nbsp;Groupe
        </Link>

        <div className="h-right">
          <ul className="h-primary">
            <li><Link href="/">Accueil</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>

          <div className="h-dd-wrap" ref={desktopMenuRef}>
            <button
              className={`h-dd-btn${desktopMenuOpen ? " open" : ""}`}
              aria-label="Plus de pages"
              aria-expanded={desktopMenuOpen}
              onClick={() => setDesktopMenuOpen((v) => !v)}
            >
              <span /><span /><span />
            </button>
            <div className={`h-dropdown${desktopMenuOpen ? " open" : ""}`}>
              <Link href="/services" onClick={() => setDesktopMenuOpen(false)}>Services</Link>
              <Link href="/news" onClick={() => setDesktopMenuOpen(false)}>Actualités</Link>
              <a href="#vision" onClick={() => setDesktopMenuOpen(false)}>Vision</a>
              <Link href="/training" onClick={() => setDesktopMenuOpen(false)}>Formation</Link>
            </div>
          </div>

          <Link href={isLoggedIn ? "/dashboard" : "/login"} className="h-cta">
            {isLoggedIn ? "Dashboard" : "Connexion"}
          </Link>

          <button
            className={`h-mob-btn${mobileOpen ? " open" : ""}`}
            aria-label="Menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <div className={`h-mobile-menu${mobileOpen ? " open" : ""}`}>
        <Link href="/" onClick={closeMobile}>Accueil</Link>
        <Link href="/services" onClick={closeMobile}>Services</Link>
        <Link href="/news" onClick={closeMobile}>Actualités</Link>
        <a href="#vision" onClick={closeMobile}>Vision</a>
        <Link href="/training" onClick={closeMobile}>Formation</Link>
        <Link href="/contact" onClick={closeMobile}>Contact</Link>
        <Link
          href={isLoggedIn ? "/dashboard" : "/login"}
          className="h-mob-cta"
          onClick={closeMobile}
        >
          {isLoggedIn ? "Dashboard" : "Connexion"}
        </Link>
      </div>
    </>
  );
}