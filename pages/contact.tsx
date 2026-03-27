"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";

export default function Contact() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);

  // Scroll reveal animation
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

  const closeMenu = () => setMenuOpen(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    }, 3000);
  };

  return (
    <>
      <Head>
        <title>Nous contacter — FiSAFi Groupe</title>
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
          <div className="hero-eyebrow">Contactez-nous</div>
          <h1 className="hero-title">
            Parlons de votre<br />
            <em>projet</em>
          </h1>
          <p className="hero-sub">
            Notre équipe est prête à vous accompagner dans vos défis numériques et techniques.
          </p>
        </div>
      </section>

      <div className="divider" />

      {/* CONTACT SECTION */}
      <section className="section" id="contact-form">
        <div className="section-eyebrow reveal">Nous sommes à votre écoute</div>
        <h2 className="section-title reveal reveal-delay-1">Amenez votre<br />vision</h2>
        <div className="contact-grid">
          <div className="contact-info reveal">
            <div className="contact-item">
              <div className="contact-label">TÉLÉPHONE</div>
              <a href="tel:+212" className="contact-value">+212 [Votre numéro]</a>
            </div>
            <div className="contact-item">
              <div className="contact-label">EMAIL</div>
              <a href="mailto:contact@fisafi.ma" className="contact-value">contact@fisafi.ma</a>
            </div>
            <div className="contact-item">
              <div className="contact-label">ADRESSE</div>
              <div className="contact-value contact-address">
                [Votre adresse]<br />
                [Ville], [Code postal]
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="contact-form reveal reveal-delay-1">
            <div className="form-field">
              <input
                type="text"
                name="name"
                placeholder="Nom complet"
                value={formData.name}
                onChange={handleChange}
                required
                className="form-input"
              />
              <div className="form-line" />
            </div>

            <div className="form-field">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
                className="form-input"
              />
              <div className="form-line" />
            </div>

            <div className="form-field">
              <input
                type="tel"
                name="phone"
                placeholder="Téléphone"
                value={formData.phone}
                onChange={handleChange}
                className="form-input"
              />
              <div className="form-line" />
            </div>

            <div className="form-field">
              <select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="form-input form-select"
              >
                <option value="">Sujet</option>
                <option value="engineering">Ingénierie</option>
                <option value="expertise">Expertise & Conseil</option>
                <option value="training">Formation</option>
                <option value="import-export">Import-Export</option>
                <option value="other">Autre</option>
              </select>
              <div className="form-line" />
            </div>

            <div className="form-field form-message">
              <textarea
                name="message"
                placeholder="Message"
                value={formData.message}
                onChange={handleChange}
                rows={5}
                required
                className="form-input form-textarea"
              ></textarea>
              <div className="form-line" />
            </div>

            <button type="submit" className="btn-primary">
              {submitted ? 'Message envoyé ✓' : 'Envoyer le message'}
            </button>
          </form>
        </div>
      </section>

      <div className="divider" />

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">Fi<span>SAFI</span></div>
          <div className="footer-links">
            <a href="/#services">Services</a>
            <a href="/#competences">Expertises</a>
            <a href="/#vision">Vision</a>
            <a href="/training">Formation</a>
            <a href="/contact">Contact</a>
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