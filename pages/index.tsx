"use client";

import React, { useEffect, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
const HeroSlideshow = dynamic(() => import("@/components/heroSlideshow"), { ssr: false });

const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.94 2.18 2 2 0 012.92.01h3a2 2 0 012 1.72c.13 1 .37 1.97.72 2.9a2 2 0 01-.45 2.11L7.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.93.35 1.9.59 2.9.72a2 2 0 011.63 2.01z"/>
  </svg>
);

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="M2 7l10 7 10-7"/>
  </svg>
);

const GlobeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M2 12h20"/>
    <path d="M12 2a15.3 15.3 0 010 20"/>
    <path d="M12 2a15.3 15.3 0 000 20"/>
  </svg>
);

const PinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="10" r="3"/>
    <path d="M12 2a8 8 0 00-8 8c0 5.25 8 14 8 14s8-8.75 8-14a8 8 0 00-8-8z"/>
  </svg>
);

const contactItems = [
  {
    label: "Téléphone Sénégal",
    value: "+221 78 896 59 39",
    href: "tel:+221788965939",
    icon: <PhoneIcon />,
    highlight: true,
  },
  {
    label: "Téléphone Tchad",
    value: "+235 66 08 83 84",
    href: "tel:+23566088384",
    icon: <PhoneIcon />,
    highlight: false,
  },
  {
    label: "Email",
    value: "contact@fisafigroupe.com",
    href: "mailto:contact@fisafigroupe.com",
    icon: <MailIcon />,
    highlight: false,
  },
  {
    label: "Site web",
    value: "www.fisafigroupe.com",
    href: "https://www.fisafigroupe.com",
    icon: <GlobeIcon />,
    highlight: false,
  },
  {
    label: "Adresse",
    value: "Liberté 6 Extension, Dakar Sénégal",
    href: null,
    icon: <PinIcon />,
    highlight: false,
  },
];

export default function Home() {
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
      </Head>

      <Header />

      {/* ─── HERO (component) ─── */}
      <HeroSlideshow />

      {/* ─── ABOUT STRIP ─── */}
      <div className="about-strip">
        <div>
          <p className="about-quote">
            « Pensez grand.<br />Pensez digital.<br />Pensez FISAFI. »
          </p>
        </div>
        <div>
          <p className="about-text">
            FISAFI GROUPE <br />
Partenaire stratégique pour l’avenir numérique de l’Afrique.
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

      {/* ─── SERVICES ─── */}
      <section className="section" id="services">
        <div className="section-eyebrow reveal">Nos offres</div>
        <h2 className="section-title reveal reveal-delay-1">Solutions<br />complètes</h2>
        <div className="services-grid-new">
          {[
            { num: "01", name: "Réseaux & Télécommunications", desc: "Conception, déploiement et modernisation d'infrastructures réseaux et télécom pour entreprises et institutions.", img: "/20.jpeg" },
            { num: "02", name: "Informatique & Infrastructures IT", desc: "Audit, déploiement et maintenance de systèmes d'information performants et sécurisés.", img: "/18.jpeg" },
            { num: "03", name: "Sécurité & Cybersécurité", desc: "Protection des données, audit de sécurité et mise en œuvre de solutions de cyberdéfense adaptées à votre contexte.", img: "/19.jpeg" },
            { num: "04", name: "Conseil & Accompagnement Stratégique", desc: "Études, formations et conseil pour anticiper les mutations numériques et piloter vos transformations.", img: "/1.jpeg" },
          ].map((s, i) => (
            <div key={s.num} className={`service-card-new reveal${i > 0 ?  ` reveal-delay-${i}` : ""}`}>
              <div className="service-image-wrapper">
                <Image
                  src={s.img}
                  alt={s.name}
                  width={400}
                  height={280}
                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
                />
                <div className="service-overlay" />
                <div className="service-num-badge">{s.num}</div>
              </div>
              <div className="service-content">
                <h3 className="service-name-new">{s.name}</h3>
                <p className="service-desc-new">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="services-cta reveal reveal-delay-4">
          <Link href="/services" className="btn-primary" style={{ textDecoration: "none" }}>Voir tous nos services</Link>
        </div>
      </section>

      <div className="divider" />

      {/* ─── COMPETENCES ─── */}
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

      {/* ─── VISION ─── */}
      <section className="vision-section" id="vision">
        <div className="section-eyebrow reveal">Notre philosophie</div>
        <h2 className="section-title reveal reveal-delay-1">Pourquoi<br />FISAFI ?</h2>

        <div className="vision-box reveal reveal-delay-2">
          {/* Grand guillemet décoratif */}
          <div className="vision-quote-mark">&ldquo;</div>

          <div className="vision-label">Notre vision</div>

          <div className="vision-box-inner">
            <p className="vision-text">
              Devenir le partenaire de référence en Afrique dans l&apos;expertise,
              l&apos;ingénierie et le conseil technologique, en contribuant activement
              à la construction d&apos;infrastructures numériques performantes,
              sécurisées et durables.
            </p>
          </div>
        </div>

        {/* Atouts — conservés mais séparés sous la vision box */}
        <div className="atouts-list reveal reveal-delay-3">
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
      </section>

      <div className="divider" />

      {/* ─── NEWS ─── */}
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

      {/* ─── CONTACT ─── */}
      <section className="contact-section" id="contact">
        <div className="section-eyebrow reveal">Parlons-en</div>
        <h2 className="section-title reveal reveal-delay-1">Travaillons<br />ensemble</h2>
        <p className="contact-tagline reveal reveal-delay-2">« L&apos;expertise qui fait la différence »</p>

        <div className="contact-items">
          {contactItems.map((item, i) => {
            const Tag = item.href ? "a" : "div";
            return (
              <Tag
                key={item.label}
                href={item.href || undefined}
                className={`contact-item reveal${i > 0 ? ` reveal-delay-${i}` : ""}`}
              >
                <div className={`contact-icon${item.highlight ? " contact-icon--highlight" : ""}`}>
                  {item.icon}
                </div>
                <div className="contact-info">
                  <div className="contact-label">{item.label}</div>
                  <div className="contact-value">{item.value}</div>
                </div>
              </Tag>
            );
          })}
        </div>

        <button
          className="btn-contact reveal"
          onClick={() => (location.href = "mailto:contact@fisafigroupe.com")}
        >
          Envoyer un message
        </button>
      </section>

      {/* ─── FOOTER ─── */}
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