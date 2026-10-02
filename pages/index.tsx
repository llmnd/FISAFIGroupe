"use client";

import React, { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CompetencesSection from "@/components/CompetencesSection";
import BusinessBrands from "@/components/BusinessBrands";
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
    img: "/area/2.jpg",
    tag: "Réseaux",
  },
  {
    index: "02",
    name: "Infrastructure IT",
    desc: "Audit, déploiement et maintenance de systèmes d'information sécurisés et scalables adaptés à vos enjeux.",
    img: "/area/1.jpg",
    tag: "Infrastructure",
  },
  {
    index: "03",
    name: "Sécurité Digitale",
    desc: "Protection données, audit compliance et défense contre les menaces cyber émergentes et persistantes.",
    img: "/area/3.gif",
    tag: "Cyberdéfense",
  },
  {
    index: "04",
    name: "Conseil Stratégique",
    desc: "Stratégie technologique, transformation digitale et accompagnement expert de vos projets de grande envergure.",
    img: "/area/4.gif",
    tag: "Conseil",
  },
];

export default function Home() {
  const [isGroupSelected, setIsGroupSelected] = useState(false);
  const homeContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const revealGroupContent = () => setIsGroupSelected(true);

    if (window.location.hash === "#home-content") {
      revealGroupContent();
    }

    window.addEventListener("fisafi:select-group", revealGroupContent);
    return () => window.removeEventListener("fisafi:select-group", revealGroupContent);
  }, []);

  useEffect(() => {
    if (isGroupSelected) {
      homeContentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isGroupSelected]);

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

      {/* ─── OUR BUSINESS ─── */}
      <section className="home-business-section" aria-labelledby="home-business-title">
        <div className="home-business-heading">
          <h2 id="home-business-title">Our Business</h2>
          <p>Découvrez les pôles FiSAFi Technologies et FiSAFi Négoce.</p>
        </div>
        <BusinessBrands
          className="home-business-brands"
          onGroupSelect={() => setIsGroupSelected(true)}
        />
      </section>

      {isGroupSelected && (
      <div id="home-content" ref={homeContentRef}>
      {/* ─── COMPÉTENCES ─── */}
      <CompetencesSection />

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

      </div>
      )}

      <Footer />
    </>
  );
}