"use client";

import React, { useState } from "react";
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
  const [clickedAreaCard, setClickedAreaCard] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<any>(null);

  return (
    <>
      <Head>
        <title>FiSAFi Groupe — L&apos;Expertise qui fait la Différence</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <meta name="theme-color" content="#1e40af" />
        
      </Head>

      <Header />

      {/* ─── HERO (component) ─── */}
      <HeroSlideshow />

      {/* ─── ABOUT STRIP ─── */}
      <div className="about-strip">
        <div className="about-strip-left" style={{
          backgroundImage: 'url(https://i.pinimg.com/1200x/e6/22/62/e622624b689e3c604bb26604e4bf008a.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '300px',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.2)',
            zIndex: 1,
          }} />
          <p className="about-quote" style={{ position: 'relative', zIndex: 2, textAlign: 'center', color: '#fff' }}>
            « Pensez grand.<br />Pensez digital.<br />Pensez FISAFI. »
          </p>
        </div>
        <div className="about-strip-right">
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
                loading="lazy"
                data-observe
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
        <div className="section-eyebrow">Nos offres</div>
        <h2 className="section-title">Solutions<br />complètes</h2>
        
        <div className="services-grid">
          {[
            { num: "01", name: "Réseaux & Télécommunications", fullDesc: "Nos experts en réseaux et télécommunications conçoivent, déploient et modernisent des infrastructures robustes adaptées à vos besoins spécifiques. Nous assurons performance, sécurité et scalabilité à chaque étape.", img: "https://i.pinimg.com/1200x/b6/e5/b4/b6e5b453d85cc0aef72de3c1e3c75177.jpg", tags: ["INFRASTRUCTURE", "NETWORKING"] },
            { num: "02", name: "Informatique & Infrastructures IT", fullDesc: "Nous auditions vos systèmes, identifions les optimisations nécessaires et déployons des solutions IT performantes. Maintenance proactive et support continu garantis.", img: "https://i.pinimg.com/1200x/ba/98/28/ba9828f1dedbac62fde7444b2aab978a.jpg", tags: ["IT", "INFRASTRUCTURE"] },
            { num: "03", name: "Sécurité & Cybersécurité", fullDesc: "Protection complète de vos données et infrastructures. Audits de sécurité, tests de pénétration, et mise en place de solutions de cyberdéfense adaptées aux menaces actuelles.", img: "https://i.pinimg.com/1200x/67/3c/54/673c54c87878338793b7bd30801ec1fc.jpg", tags: ["SÉCURITÉ", "PROTECTION"] },
            { num: "04", name: "Conseil & Accompagnement Stratégique", fullDesc: "Nous vous accompagnons dans votre transformation digitale avec des études stratégiques, formations personnalisées et conseil expert pour anticiper les mutations numériques.", img: "https://i.pinimg.com/1200x/19/e4/bf/19e4bfa6fe888fb8abe79d75fe3f3f9e.jpg", tags: ["CONSEIL", "STRATÉGIE"] },
          ].map((service, i) => (
            <div 
              key={service.num} 
              className="service-card"
              onClick={() => setSelectedService(service)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedService(service);
                }
              }}
            >
              <div className="service-card-media">
                <Image
                  src={service.img}
                  alt={service.name}
                  width={280}
                  height={240}
                  loading="lazy"
                  data-observe
                  style={{ objectFit: "cover", width: "100%", height: "auto", display: "block" }}
                />
                <div className="service-card-badge" aria-hidden>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M7 17L17 7" />
                    <path d="M7 7h10v10" />
                  </svg>
                </div>
              </div>
              <div className="service-card-content">
                <h3 className="service-card-title">{service.name}</h3>
                <div className="service-card-tags">
                  {service.tags?.map((tag) => (
                    <span key={tag} className="service-tag">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modal Service */}
      {selectedService && (
        <div 
          className="service-modal-backdrop" 
          onClick={() => setSelectedService(null)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setSelectedService(null);
          }}
          role="button"
          tabIndex={0}
        >
          <div className="service-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="service-modal-close" 
              onClick={() => setSelectedService(null)}
              aria-label="Fermer"
            >
              ✕
            </button>
            <div className="service-modal-content">
              <div className="service-modal-num">{selectedService.num}</div>
              <h2 className="service-modal-title">{selectedService.name}</h2>
              <p className="service-modal-desc">{selectedService.fullDesc}</p>
            </div>
          </div>
        </div>
      )}

      <div className="divider" />

      {/* ─── SPLIT CARDS (CAPABILITIES) ─── */}
      <section className="section" id="capabilities">
        <div className="section-eyebrow">Nos atouts</div>
        <h2 className="section-title">Expertise<br />reconnue</h2>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
          {[
            { 
              title: "Ingénierie Réseaux", 
              desc: "Conception et déploiement d'infrastructures réseaux robustes, scalables et sécurisées pour tous types d'organisations.",
              img: "https://i.pinimg.com/1200x/57/df/ae/57dfae030ee331215028f549c928ae83.jpg",
            },
            { 
              title: "Solutions Sécurité", 
              desc: "Audit, compliance et mise en œuvre de solutions de cyberdéfense adaptées à votre contexte et vos enjeux.",
              img: "https://i.pinimg.com/736x/37/2d/ff/372dffb1d5ea2ee7cc442cbc3bb2255c.jpg",
            },
            { 
              title: "Cloud & Virtualisation", 
              desc: "Migration, optimisation et management de vos infrastructures cloud pour une performance optimale.",
              img: "https://i.pinimg.com/1200x/e8/ce/0f/e8ce0fd1ffe096dee7d7b85b261b626f.jpg",
            },
          ].map((cap, i) => (
            <div 
              key={cap.title} 
              className="split-card compact"
            >
              <div className="split-card-image">
                <Image
                  src={cap.img}
                  alt={cap.title}
                  width={350}
                  height={250}
                  data-observe
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
          ))}
        </div>
      </section>

      <div className="divider" />
      <section className="competences-section" id="competences">
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(30,30,40,0.5)', zIndex: 0, pointerEvents: 'none' }} />
        <div className="section-eyebrow">Domaines d&apos;expertise</div>
        <h2 className="section-title">Nos compétences<br />clés</h2>
        <div className="comp-grid">
          {["Réseaux & Télécoms", "Infrastructures IT", "Cybersécurité", "Conseil Stratégique"].map((name, i) => (
            <div key={name} className="comp-item">
              <div className="comp-icon" />
              <div className="comp-name">{name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── VISION ─── */}
      <section className="vision-section" id="vision">
        <div className="section-eyebrow">Notre philosophie</div>
        <h2 className="section-title">Pourquoi<br />FISAFI ?</h2>

        <div className="vision-box" style={{
          backgroundImage: 'url(https://i.pinimg.com/736x/e1/a2/a7/e1a2a73729b6d7fbda9f7d534b5dc216.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          minHeight: '200px',
          padding: '3rem 6rem 6rem',
          borderRadius: '50px',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.25)',
            zIndex: 0,
          }} />
          {/* Grand guillemet décoratif */}
          <div className="vision-quote-mark" style={{ position: 'relative', zIndex: 3, color: '#fff' }}>&ldquo;</div>

          <div className="vision-label" style={{ position: 'relative', zIndex: 1 }}>Notre vision</div>

          <div className="vision-box-inner" style={{ 
            position: 'relative', 
            zIndex: 1,
            borderLeft: 'none',
            paddingLeft: 0,
            textAlign: 'center'
          }}>
            <p
  className="vision-text"
  style={{
    color: '#fff',
    fontSize: 'clamp(1rem, 2.5vw, 1.4rem)',
    fontFamily: '"Cormorant Garamond", "Georgia", serif',
    fontWeight: 600,
   
  }}
>
  Partenaire de référence en Afrique, nous bâtissons ensemble une infrastructure numérique performante, sécurisée et durable.
</p>
          </div>
        </div>

        {/* Atouts — conservés mais séparés sous la vision box */}
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
      </section>

      {/* ─── AREA CARDS GRID ─── */}
      <section className="section" style={{ background: "var(--mist)", paddingTop: "4rem", paddingBottom: "4rem" }}>
        <div className="section-eyebrow">Zones d'intervention</div>
        <h2 className="section-title">Nos domaines<br />d'action</h2>
        
        <div className="area-cards-grid">
          {[
            { name: "Réseaux & Télécoms", desc: "Conception, déploiement et optimisation d'infrastructures réseaux complexes, fiables et performantes", img: "https://i.pinimg.com/1200x/25/0b/fd/250bfdd334adaa0cb9257c6141a00bb1.jpg", type: "image" },
            { name: "Infrastructure IT", desc: "Audit, déploiement et maintenance de systèmes d'information sécurisés et scalables", img: "https://i.pinimg.com/1200x/9b/aa/22/9baa22f8ed8cf3bda2d8d309f572bc86.jpg", type: "image" },
            { name: "Sécurité Digitale", desc: "Protection données, audit compliance et défense contre les menaces cyber émergentes", img: "https://i.pinimg.com/1200x/67/3c/54/673c54c87878338793b7bd30801ec1fc.jpg", type: "image" },
            { name: "Conseil Stratégique", desc: "Stratégie technologique, transformation digitale et accompagnement expert de vos projets", img: "https://i.pinimg.com/736x/fc/1f/3e/fc1f3e0aae27c447ab48784db2ae8c8c.jpg", type: "image" },
          ].map((area, i) => (
            <div key={area.name} className="area-card-item">
              <div className="area-card">
                <div className="area-card-media">
                  <Image
                    src={area.img}
                    alt={area.name}
                    width={240}
                    height={200}
                    data-observe
                    style={{ objectFit: "cover", width: "100%", height: "auto", display: "block" }}
                  />
                </div>
                <div className="area-card-content">
                  <h3 className="area-card-title">{area.name}</h3>
                  <p className="area-card-desc">{area.desc}</p>
                  <div className="area-card-accent" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CONTACT ─── */}
      <section className="contact-section" id="contact">
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(20,40,70,0.8), rgba(30,50,90,0.8))', zIndex: 0, pointerEvents: 'none' }} />
        <div className="section-eyebrow">Parlons-en</div>
        <h2 className="section-title">Travaillons<br />ensemble</h2>
        <p className="contact-tagline">« L&apos;expertise qui fait la différence »</p>

        <div className="contact-items">
          {contactItems.map((item, i) => {
            const Tag = item.href ? "a" : "div";
            return (
              <Tag
                key={item.label}
                href={item.href || undefined}
                className="contact-item"
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
          className="btn-contact"
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
              <a href="https://www.linkedin.com/company/fisafigroupe" aria-label="LinkedIn" title="LinkedIn" target="_blank" rel="noopener noreferrer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.475-2.236-1.986-2.236-1.081 0-1.722.722-2.006 1.422-.103.249-.129.597-.129.946v5.437h-3.554s.05-8.817 0-9.737h3.554v1.378c-.009.015-.021.029-.031.042h.031v-.042c.427-.659 1.191-1.598 2.897-1.598 2.117 0 3.704 1.381 3.704 4.352v5.605zM5.337 8.855c-1.144 0-1.915-.759-1.915-1.71 0-.955.771-1.71 1.958-1.71 1.187 0 1.914.755 1.937 1.71 0 .951-.75 1.71-1.98 1.71zm1.581 11.597H3.714V9.671h3.203v10.781zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/>
                </svg>
              </a>
              <a href="https://twitter.com/fisafigroupe" aria-label="Twitter" title="Twitter" target="_blank" rel="noopener noreferrer">
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