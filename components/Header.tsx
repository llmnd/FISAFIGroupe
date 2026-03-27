"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  // Lock scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      {/* NAV */}
      <nav>
        <Link href="/" className="logo">Fi<span>SAFI</span> Groupe</Link>
        <div className="nav-right">
          <ul className="nav-links">
            <li><Link href="/services">Services</Link></li>
            <li><a href="#competences">Expertises</a></li>
            <li><a href="#vision">Vision</a></li>
            <li><Link href="/training">Formation</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
          {/* nav-cta (login/dashboard) removed — accessible via hamburger menu */}
          <button
            className={`hamburger${menuOpen ? " open" : ""}`}
            aria-label="Menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu — "Accueil" added first, login/dashboard kept here */}
      <div className={`mobile-menu${menuOpen ? " open" : ""}`}>
        <Link href="/" onClick={closeMenu}>Accueil</Link>
        <Link href="/services" onClick={closeMenu}>Services</Link>
        <Link href="/news" onClick={closeMenu}>Actualités</Link>
        <a href="#vision" onClick={closeMenu}>Notre vision</a>
        <Link href="/training" onClick={closeMenu}>Formation</Link>
        <Link href="/contact" onClick={closeMenu}>Contact</Link>
        <Link href={isLoggedIn ? "/dashboard" : "/login"} style={{ fontWeight: "600", color: "#1e40af" }} onClick={closeMenu}>
          {isLoggedIn ? "Dashboard" : "Connexion"}
        </Link>
      </div>
    </>
  );
}
