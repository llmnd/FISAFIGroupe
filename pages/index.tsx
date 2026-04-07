"use client";

import React, { useEffect, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import CardCarousel from "@/components/CardCarousel";
import StatCounter from "@/components/StatCounter";
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
  const [clickedAreaCard, setClickedAreaCard] = useState<string | null>(null);

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

      {/* ─── STATS SECTION ─── */}
      <section className="stats-section">
        <div className="stats-grid">
          {[
            { number: "10+", label: "Projets réalisés", color: "#E8580A" },
            { number: "5+", label: "Clients satisfaits", color: "#FF7235" },
            { number: "1+", label: "Années d'expertise", color: "#F59052" },
            { number: "24/7", label: "Support technique", color: "#EC6B1F" },
          ].map((stat, i) => (
            <div key={stat.label} className={`stat-item reveal${i > 0 ? ` reveal-delay-${i}` : ""}`} style={{ borderLeftColor: stat.color }}>
              <StatCounter number={stat.number} label={stat.label} color={stat.color} />
            </div>
          ))}
        </div>
      </section>

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
        <CardCarousel variant="services">
          {[
            { num: "01", name: "Réseaux & Télécommunications", desc: "Conception, déploiement et modernisation d'infrastructures réseaux et télécom pour entreprises et institutions.", img: "https://i.pinimg.com/1200x/91/bf/3c/91bf3c42a9d339d90f30b2df5a4023f6.jpg" },
            { num: "02", name: "Informatique & Infrastructures IT", desc: "Audit, déploiement et maintenance de systèmes d'information performants et sécurisés.", img: "/18.jpeg" },
            { num: "03", name: "Sécurité & Cybersécurité", desc: "Protection des données, audit de sécurité et mise en œuvre de solutions de cyberdéfense adaptées à votre contexte.", img: "https://i.pinimg.com/736x/37/2d/ff/372dffb1d5ea2ee7cc442cbc3bb2255c.jpg" },
            { num: "04", name: "Conseil & Accompagnement Stratégique", desc: "Études, formations et conseil pour anticiper les mutations numériques et piloter vos transformations.", img: "/22.jpeg" },
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
        </CardCarousel>
        <div className="services-cta reveal reveal-delay-4">
          <Link href="/services" className="btn-primary" style={{ textDecoration: "none" }}>Voir tous nos services</Link>
        </div>
      </section>

      <div className="divider" />

      {/* ─── SPLIT CARDS (CAPABILITIES) ─── */}
      <section className="section" id="capabilities">
        <div className="section-eyebrow reveal">Nos atouts</div>
        <h2 className="section-title reveal reveal-delay-1">Expertise<br />reconnue</h2>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
          {[
            { 
              title: "Ingénierie Réseaux", 
              desc: "Conception et déploiement d'infrastructures réseaux robustes, scalables et sécurisées pour tous types d'organisations.",
              img: "https://i.pinimg.com/1200x/3e/38/40/3e38402097ef1637dc91da355f223715.jpg",
            },
            { 
              title: "Solutions Sécurité", 
              desc: "Audit, compliance et mise en œuvre de solutions de cyberdéfense adaptées à votre contexte et vos enjeux.",
              img: "https://i.pinimg.com/736x/37/2d/ff/372dffb1d5ea2ee7cc442cbc3bb2255c.jpg",
            },
            { 
              title: "Cloud & Virtualisation", 
              desc: "Migration, optimisation et management de vos infrastructures cloud pour une performance optimale.",
              img: "https://i.pinimg.com/1200x/11/73/0e/11730e8efe165364e8ebc2587ba4bbc7.jpg",
            },
          ].map((cap, i) => {
            const delayClass = i > 0 ? ` reveal-delay-${(i % 3) + 1}` : "";
            return (
              <div 
                key={cap.title} 
                className={`split-card reveal${delayClass} compact`}
              >
                <div className="split-card-image">
                  <Image
                    src={cap.img}
                    alt={cap.title}
                    width={350}
                    height={250}
                    style={{ objectFit: "cover", width: "100%", height: "100%" }}
                  />
                  <div className="split-card-overlay" />
                </div>
                <div className="split-card-content" style={{ direction: "ltr" }}>
                  <h3 className="split-card-title">{cap.title}</h3>
                  <p className="split-card-description">{cap.desc}</p>
                  <a href="/services" className="split-card-arrow">En savoir plus</a>
                </div>
              </div>
            );
          })
        }
        </div>
      </section>

      <div className="divider" />
      <section className="competences-section" id="competences">
        <video autoPlay muted loop playsInline className="competences-bg-video" preload="auto">
          <source src="https://res.cloudinary.com/dcs9vkwe0/video/upload/q_auto/f_auto/v1775477690/vzcc5hhwqnlvhi8exxn4.mp4" type="video/mp4" />
        </video>
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

      {/* ─── AREA CARDS GRID ─── */}
      <section className="section" style={{ background: "var(--mist)", paddingTop: "4rem", paddingBottom: "4rem" }}>
        <div className="section-eyebrow reveal">Zones d'intervention</div>
        <h2 className="section-title reveal reveal-delay-1">Nos domaines<br />d'action</h2>
        
        <div className="area-cards-grid">
          {[
            { name: "Réseaux & Télécoms", img: "https://i.pinimg.com/736x/ed/a3/94/eda3945e4636ae02cdd4bb7bff772370.jpg", type: "image" },
            { name: "Infrastructure IT", img: "https://i.pinimg.com/736x/2d/85/a7/2d85a74061bce155cad15c1171265493.jpg", type: "image" },
            { name: "Sécurité Digitale", img: "https://res.cloudinary.com/dcs9vkwe0/video/upload/q_auto/f_auto/v1775500291/hzpqyeflhuofqnit3nch.mp4", type: "video" },
            { name: "Conseil Stratégique", img: "https://i.pinimg.com/736x/fc/1f/3e/fc1f3e0aae27c447ab48784db2ae8c8c.jpg", type: "image" },
          ].map((area, i) => (
            <div key={area.name} className="area-card-item">
              <div 
                className={`area-card ${clickedAreaCard === area.name ? 'flipped' : ''}`}
                onClick={() => setClickedAreaCard(clickedAreaCard === area.name ? null : area.name)}
              >
                {/* Recto - Image ou Vidéo */}
                <div className="area-card-front">
                  {area.type === "video" ? (
                    <video autoPlay muted loop playsInline preload="auto" className="area-card-video">
                      <source src={area.img} type="video/mp4" />
                    </video>
                  ) : (
                    <Image
                      src={area.img}
                      alt={area.name}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  )}
                </div>

                {/* Hint Cliquer */}
                <div className="area-card-hint">Cliquer</div>

                {/* Verso - Contenu texte */}
                <div className="area-card-overlay">
                  <div className="area-card-content">
                    <div className="area-card-name">{area.name}</div>
                  </div>
                </div>
              </div>
            </div>
          ))
        }
        </div>
      </section>

      {/* ─── CONTACT ─── */}
      <section className="contact-section" id="contact">
        <video autoPlay muted loop playsInline className="contact-bg-video" preload="auto">
          <source src="https://res.cloudinary.com/dcs9vkwe0/video/upload/q_auto/f_auto/v1775477690/vzcc5hhwqnlvhi8exxn4.mp4" type="video/mp4" />
        </video>
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
      <footer className="footer-enhanced">
        <div className="footer-content">
          {/* Brand Section */}
          <div className="footer-brand">
            <div className="foot-logo">Fi<span>SAFI</span> Groupe</div>
            <div className="foot-tagline">L&apos;expertise qui fait la différence</div>
            <p className="footer-desc">Partenaire stratégique en expertise technologique, ingénierie et conseil pour l&apos;Afrique.</p>
            <div className="footer-socials">
              <a href="#" aria-label="LinkedIn" title="LinkedIn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.475-2.236-1.986-2.236-1.081 0-1.722.722-2.006 1.422-.103.249-.129.597-.129.946v5.437h-3.554s.05-8.817 0-9.737h3.554v1.378c-.009.015-.021.029-.031.042h.031v-.042c.427-.659 1.191-1.598 2.897-1.598 2.117 0 3.704 1.381 3.704 4.352v5.605zM5.337 8.855c-1.144 0-1.915-.759-1.915-1.71 0-.955.771-1.71 1.958-1.71 1.187 0 1.914.755 1.937 1.71 0 .951-.75 1.71-1.98 1.71zm1.581 11.597H3.714V9.671h3.203v10.781zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/>
                </svg>
              </a>
              <a href="#" aria-label="Twitter" title="Twitter">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.953 4.57a10 10 0 002.856-3.515a9.953 9.953 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827a4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417a9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4 className="footer-col-title">Services</h4>
            <ul className="footer-list">
              <li><Link href="/services#networks">Réseaux & Télécoms</Link></li>
              <li><Link href="/services#infrastructure">Infrastructure IT</Link></li>
              <li><Link href="/services#security">Cybersécurité</Link></li>
              <li><Link href="/services#consulting">Conseil Stratégique</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className="footer-col">
            <h4 className="footer-col-title">Entreprise</h4>
            <ul className="footer-list">
              <li><Link href="/#services">À propos</Link></li>
              <li><Link href="/training">Formations</Link></li>
              <li><Link href="/news">Actualités</Link></li>
              <li><Link href="/#contact">Contact</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="footer-col">
            <h4 className="footer-col-title">Légal</h4>
            <ul className="footer-list">
              <li><Link href="/privacy">Politique de confidentialité</Link></li>
              <li><Link href="/terms">Conditions d&apos;utilisation</Link></li>
              <li><a href="mailto:contact@fisafigroupe.com">Support</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div className="foot-copy">© 2025 FISAFI Groupe. Tous droits réservés.</div>
          <a href="https://www.fisafigroupe.com" className="foot-web">fisafigroupe.com</a>
        </div>
      </footer>
    </>
  );
}