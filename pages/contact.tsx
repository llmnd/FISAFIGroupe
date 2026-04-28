"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import Header from "@/components/Header";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

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
        <title>Contact FiSAFi Groupe | Consultant IT Dakar | Réponse 24h</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <meta name="theme-color" content="#1e40af" />
        <meta name="description" content="Contactez FiSAFi pour une consultation gratuite. Tél : +221 78 781 22 97 — Dakar, Sénégal. Réponse garantie sous 24h." />
        <meta name="keywords" content="contact IT, consultant Dakar, support technique, devis IT, Sénégal" />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <link rel="canonical" href="https://fisafigroupe.com/contact" />
        <meta property="og:title" content="Nous Contacter | FiSAFi Groupe" />
        <meta property="og:description" content="Prenez contact pour une audit IT gratuit. +221 78 781 22 97" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://fisafigroupe.com/contact" />
        <meta property="og:image" content="https://fisafigroupe.com/favicon/web-app-manifest-512x512.png" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:site_name" content="FiSAFi Groupe" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Contact | FiSAFi Groupe" />
        <meta name="twitter:description" content="Contactez FiSAFi pour une consultation. +221 78 781 22 97" />
        <meta name="twitter:image" content="https://fisafigroupe.com/favicon/web-app-manifest-512x512.png" />
      </Head>

      <Header />

      {/* HERO */}
      <section className="hero" data-observe>
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
          <div className="hero-eyebrow">Parlons de votre projet</div>
          <h1 className="hero-title">
            Nous<br />
            <em>contacter</em>
          </h1>
          <p className="hero-sub">
            Exprimez vos besoins et découvrez comment nous pouvons accompagner votre transformation technologique.
          </p>
        </div>
      </section>

      <div className="divider" />

      {/* CONTACT SECTION */}
      <section className="section" id="contact-form">

        <div className="contact-grid">
          {/* Infos */}
          <div className="contact-info reveal">
            <div className="contact-item">
              <div className="contact-label">Téléphone Sénégal</div>
              <a href="tel:+221787812297" className="contact-value">+221 78 781 22 97</a>
            </div>
            <div className="contact-item">
              <div className="contact-label">Téléphone Tchad</div>
              <a href="tel:+23566088384" className="contact-value">+235 66 08 83 84</a>
            </div>
            <div className="contact-item">
              <div className="contact-label">Email</div>
              <a href="mailto:contact@fisafigroupe.com" className="contact-value">contact@fisafigroupe.com</a>
            </div>
            <div className="contact-item">
              <div className="contact-label">Adresse</div>
              <div className="contact-value contact-address">
                Liberté 6 Extension<br />
                Dakar, Sénégal
              </div>
            </div>
            <div className="contact-item">
              <div className="contact-label">Site web</div>
              <a href="https://www.fisafigroupe.com" className="contact-value">www.fisafigroupe.com</a>
            </div>
          </div>

          {/* Formulaire */}
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
                <option value="reseaux">Réseaux & Télécommunications</option>
                <option value="it">Informatique & Infrastructures IT</option>
                <option value="cyber">Sécurité & Cybersécurité</option>
                <option value="conseil">Conseil & Accompagnement Stratégique</option>
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
              />
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
          <p>&copy; 2025 FISAFI Groupe. Tous droits réservés.</p>
        </div>
      </footer>
    </>
  );
}