"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";

export default function Services() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  const services = [
    {
      title: 'Ingénierie',
      items: [
        'Études techniques (télécoms, réseaux, infrastructures)',
        'Conception et déploiement',
      ],
    },
    {
      title: 'Expertise & Conseil',
      items: [
        'Audit technique',
        'Assistance à maîtrise d\'ouvrage',
        'Stratégie et transformation digitale',
      ],
    },
    {
      title: 'Formation',
      items: [
        'Formations techniques spécialisées',
        'Certifications professionnelles',
        'Formations sur mesure',
      ],
    },
    {
      title: 'Import – Export & Négoce',
      items: [
        'Fourniture d\'équipements techniques',
        'Commerce général',
        'Solutions d\'approvisionnement international',
      ],
    },
  ];

  return (
    <>
      <Head>
        <title>Nos services — FiSAFi Groupe</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <meta name="theme-color" content="#1e40af" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Outfit:wght@200;300;400;500&display=swap"
          rel="stylesheet"
        />
      </Head>

      {/* NAV */}
      <nav>
        <Link href="/" className="logo">Fi<span>SAFI</span> Groupe</Link>
        <div className="nav-right">
          <ul className="nav-links">
            <li><Link href="/services">Services</Link></li>
            <li><a href="/#competences">Expertises</a></li>
            <li><a href="/#vision">Vision</a></li>
            <li><Link href="/training">Formation</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
          {isLoggedIn ? (
            <Link href="/dashboard" className="nav-cta">Dashboard</Link>
          ) : (
            <Link href="/login" className="nav-cta">login</Link>
          )}
          <button
            className={`hamburger${menuOpen ? " open" : ""}`}
            aria-label="Menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu${menuOpen ? " open" : ""}`}>
        <Link href="/services" onClick={closeMenu}>Services</Link>
        <a href="/#competences" onClick={closeMenu}>Expertises</a>
        <a href="/#vision" onClick={closeMenu}>Notre vision</a>
        <Link href="/training" onClick={closeMenu}>Formation</Link>
        <Link href="/contact" onClick={closeMenu}>Contact</Link>
        <Link href={isLoggedIn ? "/dashboard" : "/login"} style={{ fontWeight: "600", color: "#1e40af" }}>
          {isLoggedIn ? "Dashboard" : "Connexion"}
        </Link>
      </div>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-lines">
          <div className="hero-line" />
          <div className="hero-line" />
          <div className="hero-line" />
        </div>
        <div className="hero-orbs">
          <div className="hero-orb" />
          <div className="hero-orb" />
        </div>
        <div className="hero-overlay" />

        <div className="hero-content">
          <div className="hero-eyebrow">Nos solutions</div>
          <h1 className="hero-title">
            Des services<br />
            <em>à la mesure</em> de vos besoins
          </h1>
          <p className="hero-sub">
            Ingénierie, expertise, formation et solutions commerciales pour transformer votre infrastructure.
          </p>
        </div>
      </section>

      <div className="divider" />

      {/* SERVICES SECTION */}
      <section className="section" id="services-list">
        <div className="section-eyebrow reveal">Nos offres complètes</div>
        <h2 className="section-title reveal reveal-delay-1">Nos <br />services</h2>

        <div className="services-detailed reveal reveal-delay-2">
          {services.map((service, index) => (
            <div key={index} className="service-detail-card">
              <div className="service-detail-header">
                <h3 className="service-detail-title">{service.title}</h3>
              </div>
              <ul className="service-detail-items">
                {service.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="service-detail-item">
                    <span className="service-detail-dot" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <div className="divider" />

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">Fi<span>SAFI</span></div>
          <div className="footer-links">
            <Link href="/#services">Services</Link>
            <Link href="/#competences">Expertises</Link>
            <a href="/#vision">Vision</a>
            <Link href="/training">Formation</Link>
            <Link href="/contact">Contact</Link>
          </div>
          <div className="footer-cta">
            <Link href="/contact" className="btn-small">Nous contacter</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 FISAFI Groupe. Tous droits réservés.</p>
        </div>
      </footer>
    </>
  );
}
