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
      img: "/19.jpeg",
      tags: ["Infrastructure", "Réseau", "Télécom"]
    },
    {
      num: "02",
      name: "Informatique & Infrastructures IT",
      desc: "Audit, déploiement et maintenance de systèmes d'information performants et sécurisés.",
      img: "/18.jpeg",
      tags: ["IT", "Infrastructure", "Cloud"]
    },
    {
      num: "03",
      name: "Sécurité & Cybersécurité",
      desc: "Protection des données, audit de sécurité et mise en œuvre de solutions de cyberdéfense adaptées à votre contexte.",
      img: "/21.jpeg",
      tags: ["Sécurité", "Cyberdéfense", "Audit"]
    },
    {
      num: "04",
      name: "Conseil & Accompagnement Stratégique",
      desc: "Études, formations et conseil pour anticiper les mutations numériques et piloter vos transformations.",
      img: "/22.jpeg",
      tags: ["Conseil", "Stratégie", "Formation"]
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

      <Header />

      {/* ─── HERO SLIDESHOW ─── */}
      <HeroSlideshow variant="services" />

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
                  style={{ objectFit: "cover", width: "100%", height: "auto" }}
                />
                <div className="service-card-badge">{service.num}</div>
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