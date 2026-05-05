"use client";

import React, { useState } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
const HeroSlideshow = dynamic(() => import("@/components/heroSlideshow"));
const AboutStripSlideshow = dynamic(() => import("@/components/AboutStripSlideshow"));
const CardCarousel = dynamic(() => import("@/components/CardCarousel"));

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
    value: "+221 78 781 22 97",
    href: "tel:+221787812297",
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

const areaCards = [
  {
    index: "01",
    name: "Réseaux & Télécoms",
    desc: "Conception, déploiement et optimisation d'infrastructures réseaux, fibre optique et télécommunications haute performance.",
    img: "https://i.pinimg.com/1200x/25/0b/fd/250bfdd334adaa0cb9257c6141a00bb1.jpg",
    tag: "Réseaux",
  },
  {
    index: "02",
    name: "Infrastructure IT",
    desc: "Audit, déploiement et maintenance de systèmes d'information sécurisés et scalables adaptés à vos enjeux.",
    img: "https://i.pinimg.com/1200x/db/31/53/db315328dfae0f0bbda614be50b75b43.jpg",
    tag: "Infrastructure",
  },
  {
    index: "03",
    name: "Sécurité Digitale",
    desc: "Protection données, audit compliance et défense contre les menaces cyber émergentes et persistantes.",
    img: "https://i.pinimg.com/736x/53/3e/52/533e52f1f29a8c0c248156235ce88bbf.jpg",
    tag: "Cyberdéfense",
  },
  {
    index: "04",
    name: "Conseil Stratégique",
    desc: "Stratégie technologique, transformation digitale et accompagnement expert de vos projets de grande envergure.",
    img: "https://i.pinimg.com/1200x/7e/08/d4/7e08d403064e4afe167924fd655516a0.jpg",
    tag: "Conseil",
  },
];

export default function Home() {
  const [selectedService, setSelectedService] = useState<any>(null);

  return (
    <>
      <Head>
        <title>FiSAFi Groupe | Expert Fibre Optique, Réseaux & Télécoms | Dakar</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1.5, user-scalable=yes, viewport-fit=cover" />
        <meta name="theme-color" content="#1e40af" />
        <meta name="description" content="Expert réseau & télécoms, spécialiste fibre optique. Déploiement fibre aérien & souterrain, suivi/contrôle de travaux, cybersécurité, cloud. 10+ ans d'expertise à Dakar, Sénégal." />
        <meta name="keywords" content="expert fibre optique Dakar, télécoms Sénégal, déploiement fibre optique aérien souterrain, expert réseau, ingénierie réseaux Dakar, suivi travaux fibre optique, cabinet IT Dakar, cybersécurité Sénégal, infrastructure cloud, formation IT, consultant télécoms Afrique, FTTH FTTX Sénégal" />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <link rel="canonical" href="https://fisafigroupe.com" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:url" content="https://fisafigroupe.com" />
        <meta property="og:title" content="FiSAFi Groupe | Expert Fibre Optique, Réseaux & Télécoms | Dakar" />
        <meta property="og:description" content="Spécialiste fibre optique, déploiement aérien/souterrain, suivi de travaux, réseaux & télécoms. Cabinet IT à Dakar avec 10+ ans d'expertise." />
        <meta property="og:image" content="https://fisafigroupe.com/share.jpeg" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="FiSAFi Groupe" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="FiSAFi Groupe | Expert Fibre Optique & Télécoms Dakar" />
        <meta name="twitter:description" content="Déploiement fibre optique aérien/souterrain, réseaux & télécoms à Dakar, Sénégal." />
        <meta name="twitter:image" content="https://fisafigroupe.com/share.jpeg" />
        <meta name="twitter:creator" content="@fisafigroupe" />
      </Head>

      <Header />

      {/* ─── HERO ─── */}
      <HeroSlideshow />

      {/* ─── ABOUT STRIP ─── */}
      <div className="about-strip">
        <AboutStripSlideshow />
        <div className="about-strip-right">
          <p className="about-text">
            FISAFI GROUPE <br />
            Partenaire stratégique pour l&apos;avenir numérique de l&apos;Afrique.
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

        <div className="services-grid" data-observe>
          {[
            { num: "01", name: "Réseaux & Télécommunications", fullDesc: "Nos experts en réseaux et télécommunications conçoivent, déploient et modernisent des infrastructures robustes adaptées à vos besoins spécifiques. Nous assurons performance, sécurité et scalabilité à chaque étape.", img: "https://i.pinimg.com/originals/ff/04/31/ff0431d11ff6b73e937280252f58f371.gif", tags: ["INFRASTRUCTURE", "NETWORKING"] },
            { num: "02", name: "Informatique & Infrastructures IT", fullDesc: "Nous auditions vos systèmes, identifions les optimisations nécessaires et déployons des solutions IT performantes. Maintenance proactive et support continu garantis.", img: "https://i.pinimg.com/1200x/ba/98/28/ba9828f1dedbac62fde7444b2aab978a.jpg", tags: ["IT", "INFRASTRUCTURE"] },
            { num: "03", name: "Sécurité & Cybersécurité", fullDesc: "Protection complète de vos données et infrastructures. Audits de sécurité, tests de pénétration, et mise en place de solutions de cyberdéfense adaptées aux menaces actuelles.", img: "https://i.pinimg.com/1200x/67/3c/54/673c54c87878338793b7bd30801ec1fc.jpg", tags: ["SÉCURITÉ", "PROTECTION"] },
            { num: "04", name: "Conseil & Accompagnement Stratégique", fullDesc: "Nous vous accompagnez dans votre transformation digitale avec des études stratégiques, formations personnalisées et conseil expert pour anticiper les mutations numériques.", img: "https://i.pinimg.com/originals/bb/0c/c7/bb0cc783196fa9b2119864ff90eb5702.gif", tags: ["CONSEIL", "STRATÉGIE"] },
            { num: "05", name: "Fibre Optique & Ingénierie Réseau", fullDesc: "Nous vous accompagnons dans vos projets fibre optique avec des études de déploiement, formations techniques et conseil expert pour garantir performance, débit et pérennité de votre infrastructure.", img: "https://i.pinimg.com/1200x/23/e1/36/23e136d0c010468805abcc11b6adf877.jpg", tags: ["FIBRE", "RÉSEAU"] },
            { num: "06", name: "Déploiement Réseau Fibre Optique", fullDesc: "Nous réalisons votre déploiement fibre optique, que ce soit en aérien ou en souterrain, avec un suivi rigoureux des travaux, un contrôle qualité permanent et une coordination complète des équipes sur le terrain.", img: "https://i.pinimg.com/1200x/15/50/e0/1550e00f9f4ff4edf4ec89c2b826abd5.jpg", tags: ["DÉPLOIEMENT", "FIBRE", "SUIVI CHANTIER"] },
          ].map((service) => (
            <div
              key={service.num}
              className="service-card"
              onClick={() => setSelectedService(service)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedService(service);
                }
              }}
            >
              <div className="service-card-media">
                <Image
                  src={service.img}
                  alt={service.name}
                  width={400}
                  height={300}
                  loading="lazy"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
                />
                <div className="service-card-badge" aria-hidden>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17L17 7" /><path d="M7 7h10v10" />
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

      {/* ─── MODAL SERVICE ─── */}
      {selectedService && (
        <div
          className="service-modal-backdrop"
          onClick={() => setSelectedService(null)}
          onKeyDown={(e) => { if (e.key === "Escape") setSelectedService(null); }}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
        >
          <div className="service-modal" onClick={(e) => e.stopPropagation()} role="document">
            <button
              className="service-modal-close"
              onClick={() => setSelectedService(null)}
              aria-label="Fermer le modal"
              type="button"
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
            { title: "Ingénierie Réseaux", desc: "Conception et déploiement d'infrastructures réseaux robustes, scalables et sécurisées pour tous types d'organisations.", img: "https://i.pinimg.com/originals/d7/ac/8f/d7ac8fe75a93307683db992d9c8c6f8c.gif" },
            { title: "Solutions Sécurité", desc: "Audit, compliance et mise en œuvre de solutions de cyberdéfense adaptées à votre contexte et vos enjeux.", img: "https://i.pinimg.com/originals/14/e3/f8/14e3f8b54c14417611cfb6477c86c09d.gif" },
            { title: "Cloud & Virtualisation", desc: "Migration, optimisation et management de vos infrastructures cloud pour une performance optimale.", img: "https://i.pinimg.com/1200x/2e/30/d8/2e30d8bd3a1f97b8301829256c21a91b.jpg" },
          ].map((cap) => (
            <div key={cap.title} className="split-card compact">
              <div className="split-card-image">
                <Image src={cap.img} alt={cap.title} width={350} height={250} data-observe style={{ objectFit: "cover", width: "100%", height: "100%" }} />
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

      {/* ─── COMPÉTENCES ─── */}
      <section className="competences-section" id="competences">
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(30,30,40,0.5)", zIndex: 0, pointerEvents: "none" }} />
        <div className="section-eyebrow">Domaines d&apos;expertise</div>
        <h2 className="section-title">Nos compétences<br />clés</h2>
        <div className="comp-grid">
          {["Réseaux & Télécoms", "Fibre Optique", "Infrastructures IT", "Cybersécurité", "Conseil Stratégique"].map((name) => (
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
        <div
          className="vision-box"
          style={{ backgroundImage: "url(https://i.pinimg.com/736x/e1/a2/a7/e1a2a73729b6d7fbda9f7d534b5dc216.jpg)" }}
        >
          <div className="vision-box-overlay" />
          <div className="vision-box-body">
            <span className="vision-quote-mark">&ldquo;</span>
            <div className="vision-label">Notre vision</div>
            <div className="vision-box-inner">
              <p className="vision-text">
                Partenaire de référence en Afrique, nous bâtissons ensemble une infrastructure numérique performante, sécurisée et durable.
              </p>
            </div>
          </div>
        </div>
        <div className="atouts-list" />
      </section>

      {/* ─── AREA CARDS GRID — NOUVEAU DESIGN ─── */}
      <section className="section area-section" id="domaines">
        <div className="section-eyebrow">Zones d&apos;intervention</div>
        <h2 className="section-title">Nos domaines<br />d&apos;action</h2>

        <div className="area-cards-grid">
          {areaCards.map((area) => (
            <div key={area.name} className="area-card-item">
              <div className="area-card">

                {/* IMAGE */}
                <div className="area-card-media">
                  <Image
                    src={area.img}
                    alt={area.name}
                    width={480}
                    height={220}
                    sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 25vw"
                    style={{ objectFit: "cover", width: "100%", height: "100%", display: "block" }}
                  />
                  <span className="area-card-index">{area.index} / 04</span>
                  <span className="area-card-signal" />
                </div>

                {/* CONTENT */}
                <div className="area-card-content">
                  <h3 className="area-card-title">{area.name}</h3>
                  <p className="area-card-desc">{area.desc}</p>
                  <div className="area-card-footer">
                    <span className="area-card-tag">{area.tag}</span>
                    <div className="area-card-arrow" aria-hidden>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M7 17L17 7" />
                        <path d="M7 7h10v10" />
                      </svg>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PARTENAIRES — CAROUSEL MINIMALISTE ─── */}
      <section className="partners-section" id="partners">
        <div className="partners-inner">
          {/* HEADER */}
          <div className="partners-header">
            <span className="partners-eyebrow">Nos partenaires</span>
            <h2 className="partners-title">Confiance &<br />collaboration</h2>
            <p className="partners-subtitle">
              Nous travaillons avec les meilleures organisations pour apporter l'excellence technologique en Afrique.
            </p>
          </div>

          {/* CAROUSEL PARTENAIRES */}
          <CardCarousel variant="partners">
            {[
              {
                id: "ns2i",
                name: "NS2I",
                desc: "Partenaire stratégique pour l'infrastructure numérique et télécoms en Afrique.",
                tags: ["IT & Télécoms", "Fibre Optique",],
                logo: "/NS2I.jpeg",
              },
              {
                id: "coming-2",
                name: "À venir",
                desc: "Nous explorons continuellement de nouvelles opportunités de collaboration.",
                tags: ["Innovation", "Croissance"],
              },
              {
                id: "coming-3",
                name: "À venir",
                desc: "Nous explorons continuellement de nouvelles opportunités de collaboration.",
                tags: ["Excellence", "Synergies"],
              },
              {
                id: "coming-4",
                name: "À venir",
                desc: "Nous explorons continuellement de nouvelles opportunités de collaboration.",
                tags: ["Pertinence", "Valeur"],
              },
            ].map((partner) => (
              <div key={partner.id} className="partner-card carousel-item">
                <div className="partner-logo-zone">
                  {partner.logo ? (
                    <div className="partner-logo">
                      <Image
                        src={partner.logo}
                        alt={partner.name}
                        width={240}
                        height={140}
                        style={{ maxWidth: "100%", height: "auto", objectFit: "contain" }}
                      />
                    </div>
                  ) : (
                    <div className="partner-logo-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                        <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z" />
                      </svg>
                      <span>Bientôt</span>
                    </div>
                  )}
                </div>
                <div className="partner-content">
                  <h3 className="partner-name">{partner.name}</h3>
                  <p className="partner-desc">{partner.desc}</p>
                  <div className="partner-tags">
                    {partner.tags.map((tag) => (
                      <span key={tag} className="partner-tag">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </CardCarousel>

          {/* SECTION CLIENTS */}
          <div className="clients-section">
            <div className="clients-header">
              <h3 className="clients-title">Nos clients de confiance</h3>
            </div>
            <div className="clients-list">
              <div className="client-item">
                <p className="client-name">Opérateurs Télécoms</p>
              </div>
              <div className="client-item">
                <p className="client-name">Ministères & Gouvernance</p>
              </div>
              <div className="client-item">
                <p className="client-name">Grandes Entreprises</p>
              </div>
              <div className="client-item">
                <p className="client-name">PME & Startups</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CONTACT ─── */}
      <section className="contact-section" id="contact">
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "linear-gradient(135deg, rgba(20,40,70,0.8), rgba(30,50,90,0.8))", zIndex: 0, pointerEvents: "none" }} />
        <div className="section-eyebrow">Parlons-en</div>
        <h2 className="section-title">Travaillons<br />ensemble</h2>
        <p className="contact-tagline">« L&apos;expertise qui fait la différence »</p>

        <div className="contact-items">
          {contactItems.map((item) => {
            const Tag = item.href ? "a" : "div";
            return (
              <Tag key={item.label} href={item.href || undefined} className="contact-item">
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

        <button className="btn-contact" onClick={() => (location.href = "mailto:contact@fisafigroupe.com")}>
          Envoyer un message
        </button>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="footer-enhanced">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="foot-logo">Fi<span>SAFI</span> Groupe</div>
            <div className="foot-tagline">L&apos;expertise qui fait la différence</div>
            <p className="footer-desc">Partenaire stratégique en expertise technologique, ingénierie et conseil pour l&apos;Afrique.</p>
            <div className="footer-socials">
              <a href="https://www.linkedin.com/company/fisafigroupe" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.475-2.236-1.986-2.236-1.081 0-1.722.722-2.006 1.422-.103.249-.129.597-.129.946v5.437h-3.554s.05-8.817 0-9.737h3.554v1.378c-.009.015-.021.029-.031.042h.031v-.042c.427-.659 1.191-1.598 2.897-1.598 2.117 0 3.704 1.381 3.704 4.352v5.605zM5.337 8.855c-1.144 0-1.915-.759-1.915-1.71 0-.955.771-1.71 1.958-1.71 1.187 0 1.914.755 1.937 1.71 0 .951-.75 1.71-1.98 1.71zm1.581 11.597H3.714V9.671h3.203v10.781zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
                </svg>
              </a>
              <a href="https://twitter.com/fisafigroupe" aria-label="Twitter" target="_blank" rel="noopener noreferrer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.953 4.57a10 10 0 002.856-3.515 9.953 9.953 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Services</h4>
            <ul className="footer-list">
              <li><Link href="/services#networks">Réseaux & Télécoms</Link></li>
              <li><Link href="/services#infrastructure">Infrastructure IT</Link></li>
              <li><Link href="/services#security">Cybersécurité</Link></li>
              <li><Link href="/services#consulting">Conseil Stratégique</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Entreprise</h4>
            <ul className="footer-list">
              <li><Link href="/#services">À propos</Link></li>
              <li><Link href="/training">Formations</Link></li>
              <li><Link href="/news">Actualités</Link></li>
              <li><Link href="/#contact">Contact</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Légal</h4>
            <ul className="footer-list">
              <li><Link href="/privacy">Politique de confidentialité</Link></li>
              <li><Link href="/terms">Conditions d&apos;utilisation</Link></li>
              <li><a href="mailto:contact@fisafigroupe.com">Support</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="foot-copy">© 2025 FISAFI Groupe. Tous droits réservés.</div>
          <a href="https://www.fisafigroupe.com" className="foot-web">fisafigroupe.com</a>
        </div>
      </footer>
    </>
  );
}