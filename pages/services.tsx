"use client";

import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
const HeroSlideshow = dynamic(() => import("@/components/heroSlideshow"), { ssr: false });

export default function Services() {
  const services = [
    {
      num: "01",
      name: "Réseaux & Télécommunications",
      desc: "Conception, déploiement et modernisation d'infrastructures réseaux et télécom pour entreprises et institutions.",
      img: "https://i.pinimg.com/1200x/b6/e5/b4/b6e5b453d85cc0aef72de3c1e3c75177.jpg",
      tags: ["Infrastructure", "Réseau", "Télécom"]
    },
    {
      num: "02",
      name: "Informatique & Infrastructures IT",
      desc: "Audit, déploiement et maintenance de systèmes d'information performants et sécurisés.",
      img: "https://i.pinimg.com/736x/bb/77/72/bb7772074ede4af7dd24a843856c691a.jpg",
      tags: ["IT", "Infrastructure", "Cloud"]
    },
    {
      num: "03",
      name: "Sécurité & Cybersécurité",
      desc: "Protection des données, audit de sécurité et mise en œuvre de solutions de cyberdéfense adaptées à votre contexte.",
      img: "https://i.pinimg.com/1200x/67/3c/54/673c54c87878338793b7bd30801ec1fc.jpg",
      tags: ["Sécurité", "Cyberdéfense", "Audit"]
    },
    {
      num: "04",
      name: "Conseil & Accompagnement Stratégique",
      desc: "Études, formations et conseil pour anticiper les mutations numériques et piloter vos transformations.",
      img: "https://i.pinimg.com/1200x/58/bf/03/58bf039cae701af3e44489ca310e07c2.jpg",
      tags: ["Conseil", "Stratégie", "Formation"]
    },
  ];

  return (
    <>
      <Head>
        <title>Services IT & Réseaux | Cybersecurité, Cloud, Infrastructure | FiSAFi</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <meta name="theme-color" content="#1e40af" />
        <meta name="description" content="Services complets IT : réseaux, cybersecurité, cloud computing, infrastructure IT et formations. Solutions adaptées à votre contexte au Sénégal." />
        <meta name="keywords" content="services IT, réseaux, cybersecurité, cloud, infrastructure IT, Dakar, Sénégal" />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <link rel="canonical" href="https://fisafigroupe.com/services" />
        <meta property="og:title" content="Services Informatiques Complets | FiSAFi Groupe" />
        <meta property="og:description" content="Réseaux • Cybersecurité • Cloud • Infrastructure IT • Support technique 24/7" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://fisafigroupe.com/services" />
        <meta property="og:image" content="https://fisafigroupe.com/favicon/web-app-manifest-512x512.png" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:site_name" content="FiSAFi Groupe" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Services IT & Réseaux | FiSAFi Groupe" />
        <meta name="twitter:description" content="Services IT : réseaux, cybersecurité, cloud, infrastructure à Dakar" />
        <meta name="twitter:image" content="https://fisafigroupe.com/favicon/web-app-manifest-512x512.png" />
      </Head>

      <Header />

      {/* ─── HERO SLIDESHOW ─── */}
      <HeroSlideshow variant="services" ctaText="Nos formations" ctaHref="/training" />

      <div className="divider" />

      {/* SERVICES SECTION */}
      <section className="section" id="services-list">
        <div className="section-eyebrow">Nos offres complètes</div>
        <h2 className="section-title">Nos<br />services</h2>

        <div className="services-grid">
          {services.map((service, i) => (
            <div key={service.num} className="service-card">
              <div className="service-card-media">
                <Image
                  src={service.img}
                  alt={service.name}
                  width={400}
                  height={300}
                  loading="lazy"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  style={{ width: "100%", height: "100%" }}
                />
                <div className="service-card-badge" aria-hidden="true">
                  {service.num}
                </div>
              </div>
              <div className="service-card-content">
                <h3 className="service-card-title">{service.name}</h3>
                <div className="service-card-tags">
                  {service.tags.map((tag, idx) => (
                    <span key={idx} className="service-tag">{tag}</span>
                  ))}
                </div>
                <p className="service-desc-new">{service.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="services-cta">
          <Link href="/contact" className="btn-primary" style={{ textDecoration: "none" }}>
            Discuter de votre projet
          </Link>
        </div>
      </section>

      <div className="divider" />

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