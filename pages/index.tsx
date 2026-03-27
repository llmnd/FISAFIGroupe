"use client";

import React, { useEffect, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import CeoGreeting from "@/components/CeoGreeting";


export default function Home() {
  // Scroll reveal
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

  return (
    <>
      <Head>
        <title>FiSAFi Groupe — L&apos;Expertise qui fait la Différence</title>
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

      <Header />

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

        {/* Corner badge */}
        <div className="hero-badge">
          <div className="hero-badge-label">Basé à</div>
          <div className="hero-badge-value">Dakar · Sénégal</div>
        </div>

        <div className="hero-content">
          {/* CEO GREETING */}
          <CeoGreeting />

          <div className="hero-eyebrow">Ingénierie & Conseil Technologique</div>
          <h1 className="hero-title">
            L&apos;expertise qui<br />
            fait <em>la différence</em>
          </h1>
          <p className="hero-sub">
            Réseaux, cybersécurité et conseil stratégique — FISAFI Groupe accompagne la transformation numérique de l&apos;Afrique.
          </p>
          <div className="hero-actions">
            <Link href="/services" className="btn-primary" style={{ textDecoration: "none" }}>Nos services</Link>
          </div>
        </div>
      </section>

      {/* ABOUT STRIP */}
      <div className="about-strip">
        <div>
          <p className="about-quote">
            « Pensez grand.<br />Pensez digital.<br />Pensez FISAFI. »
          </p>
        </div>
        <div>
          <p className="about-text">
            FISAFI GROUPE est plus qu&apos;un prestataire : un partenaire stratégique engagé aux côtés de ses clients pour relever les défis d&apos;aujourd&apos;hui et préparer les opportunités de demain. Ensemble, construisons l&apos;avenir numérique de l&apos;Afrique.
          </p>
          <div className="about-ceo">
            <div className="ceo-avatar">
              <Image
                src="/ceo-avatar.png"
                alt="Abdel-Salam Abdel-Aziz Haggar"
                width={44}
                height={44}
                style={{ objectFit: "cover", borderRadius: "50%", width: "100%", height: "100%" }}
              />
            </div>
            <div>
              <div className="ceo-name">Abdel-Salam Abdel-Aziz Haggar</div>
              <div className="ceo-title">Gérant Associé — Expert Réseaux & Télécoms</div>
            </div>
          </div>
        </div>
      </div>

      {/* SERVICES */}
      <section className="section" id="services">
        <div className="section-eyebrow reveal">Nos offres</div>
        <h2 className="section-title reveal reveal-delay-1">Solutions<br />complètes</h2>
        <div className="services-grid">
          {[
            { num: "01", name: "Réseaux & Télécommunications", desc: "Conception, déploiement et modernisation d'infrastructures réseaux et télécom pour entreprises et institutions." },
            { num: "02", name: "Informatique & Infrastructures IT", desc: "Audit, déploiement et maintenance de systèmes d'information performants et sécurisés." },
            { num: "03", name: "Sécurité & Cybersécurité", desc: "Protection des données, audit de sécurité et mise en œuvre de solutions de cyberdéfense adaptées à votre contexte." },
            { num: "04", name: "Conseil & Accompagnement Stratégique", desc: "Études, formations et conseil pour anticiper les mutations numériques et piloter vos transformations." },
          ].map((s, i) => (
            <div key={s.num} className={`service-card reveal${i > 0 ? ` reveal-delay-${i}` : ""}`}>
              <div className="service-left">
                <div className="service-num">{s.num}</div>
                <div className="service-name">{s.name}</div>
                <div className="service-desc">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="services-cta reveal reveal-delay-4">
          <Link href="/services" className="btn-primary" style={{ textDecoration: "none" }}>Voir tous nos services</Link>
        </div>
      </section>

      <div className="divider" />

      {/* COMPETENCES */}
      <section className="competences-section" id="competences">
        <div className="section-eyebrow reveal">Domaines d&apos;expertise</div>
        <h2 className="section-title reveal reveal-delay-1">Nos compétences<br />clés</h2>
        <div className="comp-grid">
          {["Réseaux & Télécoms", "Infrastructures IT", "Cybersécurité", "Conseil Stratégique"].map((name, i) => (
            <div key={name} className={`comp-item reveal${i > 0 ? ` reveal-delay-${i}` : ""}`}>
              <div className="comp-icon" />
              <div className="comp-name">{name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* VISION */}
      <section className="vision-section" id="vision">
        <div className="section-eyebrow reveal">Notre philosophie</div>
        <h2 className="section-title reveal reveal-delay-1">Pourquoi<br />FISAFI ?</h2>
        <div className="vision-box reveal reveal-delay-2">
          <div className="vision-label">Notre vision</div>
          <p className="vision-text">
            Devenir le partenaire de référence en Afrique dans l&apos;expertise, l&apos;ingénierie et le conseil technologique, en contribuant activement à la construction d&apos;infrastructures numériques performantes, sécurisées et durables.
          </p>
          <div className="atouts-list">
            {[
              "Expertise technique de haut niveau, ancrée dans les réalités africaines",
              "Partenaire de confiance pour vos projets technologiques complexes",
              "Solutions sur mesure, innovantes et adaptées à votre contexte",
              "Accompagnement global, fiable et orienté résultats",
              "Engagement qualité, performance et sécurité à chaque mission",
            ].map((text) => (
              <div className="atout-item" key={text}>
                <div className="atout-dot" />
                <div className="atout-text">{text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* NEWS */}
      <section className="section" id="news">
        <div className="section-eyebrow reveal">Publications</div>
        <h2 className="section-title reveal reveal-delay-1">Actualités &<br />innovations</h2>
        <div className="news-grid-home">
          {[
            { category: "Articles techniques", desc: "Contenus approfondis sur nos domaines d'expertise" },
            { category: "Innovations", desc: "Découvrez nos dernières solutions et projets" },
            { category: "Événements", desc: "Participation et sponsoring de conférences et salons" },
          ].map((item, i) => (
            <div key={item.category} className={`news-item-home reveal${i > 0 ? ` reveal-delay-${i + 1}` : ""}`}>
              <div className="news-item-category">{item.category}</div>
              <p className="news-item-desc">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="news-cta reveal reveal-delay-4">
          <Link href="/news" className="btn-primary" style={{ textDecoration: "none" }}>Voir toutes les actualités</Link>
        </div>
      </section>

      <div className="divider" />

      {/* CONTACT */}
      <section className="contact-section" id="contact">
        <div className="section-eyebrow reveal">Parlons-en</div>
        <h2 className="section-title reveal reveal-delay-1">Travaillons<br />ensemble</h2>
        <p className="contact-tagline reveal reveal-delay-2">« L&apos;expertise qui fait la différence »</p>
        <div className="contact-items">
          <a href="tel:+221788965939" className="contact-item reveal">
            <div className="contact-icon">✆</div>
            <div className="contact-info">
              <div className="contact-label">Téléphone Sénégal</div>
              <div className="contact-value">+221 78 896 59 39</div>
            </div>
          </a>
          <a href="tel:+23566088384" className="contact-item reveal reveal-delay-1">
            <div className="contact-icon">✆</div>
            <div className="contact-info">
              <div className="contact-label">Téléphone Tchad</div>
              <div className="contact-value">+235 66 08 83 84</div>
            </div>
          </a>
          <a href="mailto:contact@fisafigroupe.com" className="contact-item reveal reveal-delay-2">
            <div className="contact-icon">✉</div>
            <div className="contact-info">
              <div className="contact-label">Email</div>
              <div className="contact-value">contact@fisafigroupe.com</div>
            </div>
          </a>
          <a href="https://www.fisafigroupe.com" className="contact-item reveal reveal-delay-3">
            <div className="contact-icon">⊕</div>
            <div className="contact-info">
              <div className="contact-label">Site web</div>
              <div className="contact-value">www.fisafigroupe.com</div>
            </div>
          </a>
          <div className="contact-item reveal">
            <div className="contact-icon">◎</div>
            <div className="contact-info">
              <div className="contact-label">Adresse</div>
              <div className="contact-value">Liberté 6 Extension, Dakar Sénégal</div>
            </div>
          </div>
        </div>
        <button className="btn-contact reveal" onClick={() => (location.href = "mailto:contact@fisafigroupe.com")}>
          Envoyer un message
        </button>
      </section>

      {/* FOOTER */}
      <footer>
        <div>
          <div className="foot-logo">Fi<span>SAFI</span> Groupe</div>
          <div className="foot-tagline">L&apos;expertise qui fait la différence</div>
        </div>
        <div className="foot-bottom">
          <div className="foot-copy">© 2025 FISAFI Groupe. Tous droits réservés.</div>
          <a href="https://www.fisafigroupe.com" className="foot-web">fisafigroupe.com</a>
        </div>
      </footer>
    </>
  );
}