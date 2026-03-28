"use client";

import { useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Header from "@/components/Header";

export default function Services() {
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

  const services = [
    {
      title: "Réseaux & Télécommunications",
      items: [
        "Conception, déploiement et modernisation d'infrastructures réseaux",
        "Études techniques télécoms et dimensionnement",
        "Intégration de solutions de communication unifiée",
        "Maintenance et supervision des infrastructures",
      ],
    },
    {
      title: "Informatique & Infrastructures IT",
      items: [
        "Audit, déploiement et maintenance de systèmes d'information",
        "Virtualisation et cloud computing",
        "Administration de serveurs et bases de données",
        "Support technique et infogérance",
      ],
    },
    {
      title: "Sécurité & Cybersécurité",
      items: [
        "Audit de sécurité et tests d'intrusion",
        "Mise en œuvre de solutions de cyberdéfense",
        "Protection des données et conformité RGPD",
        "Sensibilisation et formation à la sécurité",
      ],
    },
    {
      title: "Conseil & Accompagnement Stratégique",
      items: [
        "Études et diagnostics numériques",
        "Assistance à maîtrise d'ouvrage (AMO)",
        "Transformation digitale et stratégie IT",
        "Formations techniques spécialisées",
      ],
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

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-overlay" />

        {/* Badge */}
        <div className="hero-badge">
          <div className="hero-badge-label">Expertise</div>
          <div className="hero-badge-value">Nos Services</div>
        </div>

        <div className="hero-content">
          <div className="hero-eyebrow">Nos solutions</div>
          <h1 className="hero-title">
            Des services<br />
            <em>à la mesure</em> de vos besoins
          </h1>
          <p className="hero-sub">
            Ingénierie, expertise, cybersécurité et conseil stratégique pour transformer votre infrastructure numérique.
          </p>
        </div>
      </section>

      <div className="divider" />

      {/* SERVICES SECTION */}
      <section className="section" id="services-list">
        <div className="section-eyebrow reveal">Nos offres complètes</div>
        <h2 className="section-title reveal reveal-delay-1">Nos<br />services</h2>

        <div className="services-detailed">
          {services.map((service, index) => (
            <div
              key={index}
              className={`service-detail-card reveal${index > 0 ? ` reveal-delay-${index}` : ""}`}
            >
              <div className="service-detail-header">
                <h3 className="service-detail-title">{service.title}</h3>
              </div>
              <ul className="service-detail-items">
                {service.items.map((item, i) => (
                  <li key={i} className="service-detail-item">
                    <span className="service-detail-dot" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="services-cta reveal reveal-delay-4" style={{ textAlign: "center", marginTop: "3rem" }}>
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