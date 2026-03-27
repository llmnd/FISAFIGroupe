"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import Header from "@/components/Header";

export default function FormationPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    formationId: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [brochures, setBrochures] = useState<any[]>([]);
  const [loadingBrochures, setLoadingBrochures] = useState(true);

  // Load brochures from API
  useEffect(() => {
    const fetchBrochures = async () => {
      try {
        const response = await fetch('/api/brochures');
        if (response.ok) {
          const data = await response.json();
          setBrochures(data.data || []);
        }
      } catch (error) {
        console.error('Error loading brochures:', error);
      } finally {
        setLoadingBrochures(false);
      }
    };

    fetchBrochures();
  }, []);

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

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSubmitStatus(null);

    try {
      // Separate firstName and lastName from input
      const nameParts = formData.firstName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || formData.lastName;

      const response = await fetch('/api/v1/inscriptions-formations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: firstName || formData.firstName,
          lastName: lastName || formData.lastName,
          email: formData.email,
          phone: formData.phone,
          formationId: parseInt(formData.formationId),
          message: formData.message,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus({
          type: 'success',
          message: 'Inscription confirmée! Nous vous contacterons très bientôt.',
        });
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          formationId: '',
          message: '',
        });
      } else {
        setSubmitStatus({
          type: 'error',
          message: data.error || 'Une erreur est survenue lors de l\'inscription.',
        });
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'Erreur de connexion. Veuillez réessayer.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper: Format file size from bytes to readable format
  const getFormattedFileSize = (bytes: number): string => {
    if (bytes > 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    } else if (bytes > 1024) {
      return (bytes / 1024).toFixed(0) + ' KB';
    } else {
      return bytes + ' B';
    }
  };

  // Helper: Extract nested ternary into independent conditions for brochure rendering
  const renderBrochuresList = () => {
    const isLoading = loadingBrochures;
    const isEmpty = brochures.length === 0;
    
    // Extracted: Independent condition statements instead of nested ternaries
    if (isLoading) {
      return <p style={{ textAlign: 'center', color: '#666', padding: '2rem 0' }}>Chargement des documents...</p>;
    }
    
    if (isEmpty) {
      return <p style={{ textAlign: 'center', color: '#666', padding: '2rem 0' }}>Aucun document disponible pour le moment.</p>;
    }

    // Render brochures list
    return brochures.map((doc) => {
      const fileSize = doc.fileSize ? parseInt(doc.fileSize, 10) : 0;
      const displaySize = getFormattedFileSize(fileSize);
      const isFileAvailable = !!doc.fileUrl;
      
      // Extracted: Button accessibility states as independent variables
      const buttonCursor = isFileAvailable ? 'pointer' : 'not-allowed';
      const buttonOpacity = isFileAvailable ? 1 : 0.6;
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

      const handleDownload = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!isFileAvailable) {
          e.preventDefault();
          alert('Fichier non disponible');
          return;
        }

        try {
          // Use backend download endpoint
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
          const downloadUrl = `${backendUrl}/api/brochures/${doc.id}/download`;
          
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = doc.name || 'document';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (error) {
          console.error('Download error:', error);
        }
      };

      return (
        <button
          onClick={handleDownload}
          key={doc.id}
          className="atout-item"
          style={{
            cursor: buttonCursor,
            opacity: buttonOpacity,
            border: 'none',
            background: 'none',
            padding: isMobile ? '0.75rem 0' : '1rem 0',
            textAlign: 'left',
            fontFamily: 'inherit',
            width: '100%',
            minHeight: isMobile ? '2.5rem' : '3rem',
            transition: 'opacity 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
          disabled={!isFileAvailable}
          title={isFileAvailable ? 'Cliquez pour télécharger' : 'Fichier non disponible'}
        >
          <div className="atout-dot" style={{ background: '#1e40af', flexShrink: 0 }} />
          <div className="atout-text" style={{ flex: 1 }}>
            <div style={{ fontWeight: '500', fontSize: isMobile ? '0.95rem' : '1rem' }}>{doc.name}</div>
            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>📄 {displaySize}</div>
          </div>
        </button>
      );
    });
  };

  return (
    <>
      <Head>
        <title>Formations — FiSAFi Groupe</title>
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

        <div className="hero-badge">
          <div className="hero-badge-label">Expertise</div>
          <div className="hero-badge-value">Formations Technologiques</div>
        </div>

        <div className="hero-content">
          <div className="hero-eyebrow">Développement des compétences</div>
          <h1 className="hero-title">
            Formations<br />
            d&apos;<em>excellence</em>
          </h1>
          <p className="hero-sub">
            Réseaux, cybersécurité, infrastructure IT — Des formations professionnelles conçues pour développer l&apos;expertise technologique de vos équipes.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth" })}>Voir le catalogue</button>
          </div>
        </div>
      </section>

      {/* ESPACE FORMATION */}
      <div className="about-strip">
        <div>
          <p className="about-quote">
            « L&apos;Espace<br />Formation FISAFI.<br />Votre partenaire<br />de compétences. »
          </p>
        </div>
        <div>
          <p className="about-text">
            L&apos;Espace Formation FISAFI est un centre de formation spécialisé dans les technologies de l&apos;information et des télécommunications. Nous proposons des formations pratiques et certifiantes conçues pour développer vos compétences et celles de vos équipes, avec un accompagnement pédagogique de qualité assuré par nos experts de terrain.
          </p>
          <div className="about-ceo">
            <div className="ceo-avatar">
              <div style={{ background: "#1e40af", borderRadius: "50%", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "20px" }}>📚</div>
            </div>
            <div>
              <div className="ceo-name">Center Formation FISAFI</div>
              <div className="ceo-title">Excellence Pédagogique &amp; Certification</div>
            </div>
          </div>
        </div>
      </div>

      {/* CATALOGUE DE FORMATIONS */}
      <section className="section" id="catalogue">
        <div className="section-eyebrow reveal">Nos offres de formation</div>
        <h2 className="section-title reveal reveal-delay-1">Catalogue de<br />formations</h2>
        <div className="services-grid">
          {[
            { num: "01", name: "Administration Réseaux &amp; Télécoms", desc: "Conception, installation, maintenance et sécurisation des infrastructures réseaux et télécom." },
            { num: "02", name: "Infrastructure IT &amp; Virtualisation", desc: "Déploiement de serveurs, gestion des données, virtualisation et cloud computing." },
            { num: "03", name: "Cybersécurité &amp; Digital Trust", desc: "Sécurité informatique, protection des données, audit de sécurité et conformité." },
            { num: "04", name: "Certification Professionnelle", desc: "Préparation aux certifications reconnues internationales (Cisco, CompTIA, Microsoft, etc.)." },
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
      </section>

      <div className="divider" />

      {/* CALENDRIER & SESSIONS */}
      <section className="competences-section" id="sessions">
        <div className="section-eyebrow reveal">Planning des sessions</div>
        <h2 className="section-title reveal reveal-delay-1">Calendrier<br />des sessions</h2>
        <div className="comp-grid">
          {[
            { title: "Sessions Présentielles", desc: "Formation en groupe au centre FISAFI" },
            { title: "Sessions E-Learning", desc: "Apprentissage digitalisé avec tuteur virtuel" },
            { title: "Sessions Hybrides", desc: "Combine présentiel et apprentissage en ligne" },
            { title: "Sessions Intra-Entreprise", desc: "Formation personnalisée sur site entreprise" },
          ].map((session, i) => (
            <div key={session.title} className={`comp-item reveal${i > 0 ? ` reveal-delay-${i}` : ""}`}>
              <div className="comp-icon">📅</div>
              <div className="comp-name">{session.title}</div>
              <div style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.5rem" }}>{session.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* BROCHURES & DOCUMENTS */}
      <section className="vision-section" id="brochures">
        <div className="section-eyebrow reveal">Ressources</div>
        <h2 className="section-title reveal reveal-delay-1">Téléchargement<br />de brochures</h2>
        <div className="vision-box reveal reveal-delay-2">
          <div className="vision-label">Documents disponibles</div>
          <p className="vision-text">
            Accédez à notre documentation complète sur les formations : catalogues détaillés, programmes pédagogiques, tarifs et modalités d&apos;inscription.
          </p>
          <div className="atouts-list">
            {renderBrochuresList()}
          </div>
        </div>
      </section>

      {/* INSCRIPTION EN LIGNE */}
      <section className="contact-section" id="inscription">
        <div className="section-eyebrow reveal">Rejoignez-nous</div>
        <h2 className="section-title reveal reveal-delay-1">Inscription<br />en ligne</h2>
        <p className="contact-tagline reveal reveal-delay-2">« Développez vos compétences avec FISAFI »</p>
        
        <form className="contact-form reveal reveal-delay-3" style={{ maxWidth: "600px", margin: "2rem auto" }} onSubmit={handleFormSubmit}>
          <div style={{ display: "grid", gap: "1rem" }}>
            {submitStatus && (
              <div style={{
                padding: "1rem",
                borderRadius: "4px",
                backgroundColor: submitStatus.type === 'success' ? "#d4edda" : "#f8d7da",
                color: submitStatus.type === 'success' ? "#155724" : "#721c24",
                border: `1px solid ${submitStatus.type === 'success' ? "#c3e6cb" : "#f5c6cb"}`,
              }}>
                {submitStatus.message}
              </div>
            )}
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Nom complet *</label>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleFormChange} placeholder="Votre nom" required style={{ width: "100%", padding: "0.75rem", border: "1px solid #ddd", borderRadius: "4px", fontSize: "1rem" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Email *</label>
              <input type="email" name="email" value={formData.email} onChange={handleFormChange} placeholder="votre@email.com" required style={{ width: "100%", padding: "0.75rem", border: "1px solid #ddd", borderRadius: "4px", fontSize: "1rem" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Téléphone *</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleFormChange} placeholder="+221 77 XXX XX XX" required style={{ width: "100%", padding: "0.75rem", border: "1px solid #ddd", borderRadius: "4px", fontSize: "1rem" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Formation souhaitée *</label>
              <select name="formationId" value={formData.formationId} onChange={handleFormChange} required style={{ width: "100%", padding: "0.75rem", border: "1px solid #ddd", borderRadius: "4px", fontSize: "1rem" }}>
                <option value="">Sélectionnez une formation</option>
                <option value="1">Administration Réseaux &amp; Télécoms</option>
                <option value="2">Infrastructure IT &amp; Virtualisation</option>
                <option value="3">Cybersécurité &amp; Digital Trust</option>
                <option value="4">Certification Professionnelle</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Message</label>
              <textarea name="message" value={formData.message} onChange={handleFormChange} placeholder="Vos questions..." rows={4} style={{ width: "100%", padding: "0.75rem", border: "1px solid #ddd", borderRadius: "4px", fontSize: "1rem", fontFamily: "inherit" }} />
            </div>
            <button type="submit" className="btn-contact" style={{ marginTop: "1rem", opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }} disabled={loading}>
              {loading ? "Envoi en cours..." : "Soumettre mon inscription"}
            </button>
          </div>
        </form>

        <div className="contact-items" style={{ marginTop: "3rem" }}>
          <a href="tel:+221788965939" className="contact-item reveal">
            <div className="contact-icon">✆</div>
            <div className="contact-info">
              <div className="contact-label">Téléphone</div>
              <div className="contact-value">+221 78 896 59 39</div>
            </div>
          </a>
          <a href="mailto:formations@fisafigroupe.com" className="contact-item reveal reveal-delay-1">
            <div className="contact-icon">✉</div>
            <div className="contact-info">
              <div className="contact-label">Email Formations</div>
              <div className="contact-value">formations@fisafigroupe.com</div>
            </div>
          </a>
          <div className="contact-item reveal reveal-delay-2">
            <div className="contact-icon">◎</div>
            <div className="contact-info">
              <div className="contact-label">Adresse Centre</div>
              <div className="contact-value">Liberté 6 Extension, Dakar</div>
            </div>
          </div>
        </div>
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
