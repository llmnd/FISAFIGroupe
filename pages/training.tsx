"use client";

import { useState, useEffect } from "react";
import Head from "next/head";
import Image from "next/image";
import dynamic from "next/dynamic";
import Header from "@/components/Header";

const HeroSlideshow = dynamic(() => import("@/components/heroSlideshow"), { ssr: false });

// Icon components extracted for better code organization
const CalendarIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const PdfIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="9" y1="15" x2="15" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="9" y1="12" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

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
  const [emailError, setEmailError] = useState('');
  const [brochures, setBrochures] = useState<any[]>([]);
  const [loadingBrochures, setLoadingBrochures] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  // Fetch brochures on client only
  useEffect(() => {
    const fetchBrochures = async () => {
      try {
        // Vérifier le cache d'abord
        if (typeof window !== 'undefined') {
          const cachedBrochures = sessionStorage.getItem('brochures_cache');
          if (cachedBrochures) {
            setBrochures(JSON.parse(cachedBrochures));
            setLoadingBrochures(false);
            return;
          }
        }

        const response = await fetch('/api/brochures');
        if (response.ok) {
          const data = await response.json();
          const brochuresData = data.data || [];
          setBrochures(brochuresData);
          // Mettre en cache pour cette session
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('brochures_cache', JSON.stringify(brochuresData));
          }
        }
      } catch (error) {
        console.error('Error loading brochures:', error);
      } finally {
        setLoadingBrochures(false);
      }
    };
    fetchBrochures();
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Validation email en temps réel
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        setEmailError('Veuillez entrer une adresse email valide');
      } else {
        setEmailError('');
      }
    }
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Vérifier l'email avant de soumettre
    if (!isValidEmail(formData.email)) {
      setEmailError('Veuillez entrer une adresse email valide');
      setSubmitStatus(null);
      return;
    }
    
    setLoading(true);
    setSubmitStatus(null);
    setEmailError('');
    try {
      const nameParts = formData.firstName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || formData.lastName;
      const response = await fetch('/api/v1/inscriptions-formations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName || formData.firstName,
          lastName: lastName || formData.lastName,
          email: formData.email,
          phone: formData.phone,
          formationId: Number.parseInt(formData.formationId, 10),
          message: formData.message,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setSubmitStatus({ type: 'success', message: 'Inscription confirmée ! Nous vous contacterons très bientôt.' });
        setFormData({ firstName: '', lastName: '', email: '', phone: '', formationId: '', message: '' });
      } else {
        setSubmitStatus({ type: 'error', message: data.error || "Une erreur est survenue lors de l'inscription." });
      }
    } catch {
      setSubmitStatus({ type: 'error', message: 'Erreur de connexion. Veuillez réessayer.' });
    } finally {
      setLoading(false);
    }
  };

  const getFormattedFileSize = (bytes: number): string | null => {
    if (!bytes || bytes === 0) return null;
    if (bytes > 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
    if (bytes > 1024) return (bytes / 1024).toFixed(0) + ' Ko';
    return bytes + ' o';
  };

  const handleDownload = async (e: React.MouseEvent<HTMLButtonElement>, doc: any) => {
    if (!doc.fileUrl) { e.preventDefault(); return; }
    setDownloadingId(doc.id);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      const downloadUrl = `${backendUrl}/api/brochures/${doc.id}/download`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = doc.name || 'document';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setTimeout(() => setDownloadingId(null), 1200);
    }
  };

  const renderBrochuresList = () => {
    if (loadingBrochures) {
      return (
        <div className="brochures-loading">
          {[1, 2, 3].map(i => (
            <div key={i} className="brochures-skeleton" />
          ))}
          <style>{`
            @keyframes shimmer {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
          `}</style>
        </div>
      );
    }

    if (brochures.length === 0) {
      return (
        <div className="brochures-empty">
          Aucun document disponible pour le moment.
        </div>
      );
    }

    return (
      <div className="brochures-list">
        {brochures.map((doc) => {
          const fileSize = doc.fileSize ? Number.parseInt(doc.fileSize, 10) : 0;
          const displaySize = getFormattedFileSize(fileSize);
          const isAvailable = !!doc.fileUrl;
          const isDownloading = downloadingId === doc.id;

          return (
            <button
              key={doc.id}
              onClick={(e) => handleDownload(e, doc)}
              disabled={!isAvailable || isDownloading}
              title={isAvailable ? 'Télécharger' : 'Fichier non disponible'}
              className={`brochure-item ${!isAvailable ? 'brochure-item--unavailable' : ''}`}
            >
              {/* Icône PDF */}
              <div className="brochure-icon">
                <PdfIcon />
                <span className="brochure-label">PDF</span>
              </div>

              {/* Infos */}
              <div className="brochure-info">
                <div className="brochure-name">{doc.name || 'Document sans titre'}</div>
                <div className="brochure-meta">
                  {displaySize && (
                    <>
                      <span>{displaySize}</span>
                      <span className="brochure-separator" />
                    </>
                  )}
                  <span>
                    {isAvailable ? 'Disponible' : 'Non disponible'}
                  </span>
                </div>
              </div>

              {/* Action télécharger */}
              <div className="brochure-action">
                {isDownloading ? (
                  <span>…</span>
                ) : (
                  <>
                    <DownloadIcon />
                    Télécharger
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const sessions = [
    { title: "Sessions Présentielles", desc: "Formation en groupe au centre FISAFI" },
    { title: "Sessions E-Learning", desc: "Apprentissage digitalisé avec tuteur virtuel" },
    { title: "Sessions Hybrides", desc: "Combine présentiel et apprentissage en ligne" },
    { title: "Sessions Intra-Entreprise", desc: "Formation personnalisée sur site entreprise" },
  ];

  const formations = [
    { 
      num: "01", 
      name: "Administration Réseaux & Télécoms", 
      desc: "Conception, installation, maintenance et sécurisation des infrastructures réseaux et télécom.", 
      img: "/19.jpeg",
      hours: "40H",
      level: "Intermédiaire"
    },
    { 
      num: "02", 
      name: "Infrastructure IT & Virtualisation", 
      desc: "Déploiement de serveurs, gestion des données, virtualisation et cloud computing.", 
      img: "/18.jpeg",
      hours: "35H",
      level: "Avancé"
    },
    { 
      num: "03", 
      name: "Cybersécurité & Digital Trust", 
      desc: "Sécurité informatique, protection des données, audit de sécurité et conformité.", 
      img: "/21.jpeg",
      hours: "45H",
      level: "Avancé"
    },
    { 
      num: "04", 
      name: "Certification Professionnelle", 
      desc: "Préparation aux certifications reconnues internationales (Cisco, CompTIA, Microsoft, etc.).", 
      img: "/17.jpeg",
      hours: "30H",
      level: "Variable"
    },
  ];

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

      <HeroSlideshow variant="training" />

      {/* ESPACE FORMATION */}
      <div className="about-strip">
        <div className="about-strip-left">
          <p className="about-quote">
            « L&apos;Espace<br />Formation FISAFI.<br />Votre partenaire<br />de compétences. »
          </p>
        </div>
        <div className="about-strip-right">
          <p className="about-text">
            L&apos;Espace Formation FISAFI est un centre de formation spécialisé dans les technologies de l&apos;information et des télécommunications. Nous proposons des formations pratiques et certifiantes conçues pour développer vos compétences et celles de vos équipes.
          </p>
          <div className="about-ceo">
            <div className="ceo-avatar">
              📚
            </div>
            <div>
              <div className="ceo-name">Center Formation FISAFI</div>
              <div className="ceo-title">Excellence Pédagogique & Certification</div>
            </div>
          </div>
        </div>
      </div>

      {/* CATALOGUE */}
      <section className="section" id="catalogue">
        <div className="section-eyebrow">Nos offres de formation</div>
        <h2 className="section-title">Catalogue de<br />formations</h2>
        
        <div className="services-grid">
          {formations.map((formation, i) => (
            <div key={formation.num} className="service-card">
              <div className="service-card-media">
                <Image
                  src={formation.img}
                  alt={formation.name}
                  width={400}
                  height={300}
                  priority={i === 0}
                  style={{ objectFit: "cover", width: "100%", height: "auto" }}
                />
                <div className="service-card-badge">{formation.num}</div>
              </div>
              <div className="service-card-content">
                <h3 className="service-card-title">{formation.name}</h3>
                <div className="service-card-tags">
                  <span className="service-tag">📚 {formation.hours}</span>
                  <span className="service-tag">🎯 {formation.level}</span>
                </div>
                <p className="service-desc-new">{formation.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="divider" />

      {/* CALENDRIER DES SESSIONS */}
      
      {/* ─── BROCHURES ─── */}
      <section className="vision-section" id="brochures">
        <div className="section-eyebrow">Ressources</div>
        <h2 className="section-title">Téléchargement<br />de brochures</h2>
        <div className="vision-box">
          <div className="brochures-header">
            <div>
              <div className="vision-label">Documents disponibles</div>
              <p className="vision-text" style={{ marginBottom: 0 }}>
                Catalogues détaillés, programmes pédagogiques, tarifs et modalités d&apos;inscription.
              </p>
            </div>
            {!loadingBrochures && brochures.length > 0 && (
              <div className="brochures-count">
                {brochures.length} document{brochures.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
          <div style={{ borderTop: '0.5px solid var(--line)', marginTop: '1.5rem' }} />
          {renderBrochuresList()}
        </div>
      </section>

      {/* INSCRIPTION */}
      <section className="contact-section" id="inscription">
        <div className="section-eyebrow">Rejoignez-nous</div>
        <h2 className="section-title">Inscription<br />en ligne</h2>
        <p className="contact-tagline">« Développez vos compétences avec FISAFI »</p>

        <form
          className="contact-form"
          onSubmit={handleFormSubmit}
        >
          <div className="form-grid">
            {submitStatus && (
              <div className={`form-status form-status-${submitStatus.type}`}>
                {submitStatus.message}
              </div>
            )}
            <div className="form-group">
              <label htmlFor="fullName" className="form-label">Nom complet *</label>
              <input id="fullName" type="text" name="firstName" value={formData.firstName} onChange={handleFormChange} placeholder="Votre nom" required className="form-input" />
            </div>
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email *</label>
              <input 
                id="email"
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleFormChange} 
                placeholder="votre@email.com" 
                required 
                className={`form-input ${emailError ? 'form-input-error' : ''}`}
              />
              {emailError && (
                <div className="form-error">
                  ✗ {emailError}
                </div>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="phone" className="form-label">Téléphone *</label>
              <input id="phone" type="tel" name="phone" value={formData.phone} onChange={handleFormChange} placeholder="+221 77 XXX XX XX" required className="form-input" />
            </div>
            <div className="form-group">
              <label htmlFor="formation" className="form-label">Formation souhaitée *</label>
              <select id="formation" name="formationId" value={formData.formationId} onChange={handleFormChange} required className="form-input">
                <option value="">Sélectionnez une formation</option>
                <option value="1">Administration Réseaux & Télécoms</option>
                <option value="2">Infrastructure IT & Virtualisation</option>
                <option value="3">Cybersécurité & Digital Trust</option>
                <option value="4">Certification Professionnelle</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="message" className="form-label">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleFormChange}
                placeholder="Vos questions…"
                rows={4}
                className="form-input form-textarea"
              />
            </div>
            <button
              type="submit"
              className="btn-contact"
              disabled={loading}
              style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Envoi en cours…' : 'Soumettre mon inscription'}
            </button>
          </div>
        </form>

        <div className="contact-items" style={{ marginTop: '3rem' }}>
          <a href="tel:+221788965939" className="contact-item">
            <div className="contact-icon">✆</div>
            <div className="contact-info">
              <div className="contact-label">Téléphone</div>
              <div className="contact-value">+221 78 896 59 39</div>
            </div>
          </a>
          <a href="mailto:formations@fisafigroupe.com" className="contact-item">
            <div className="contact-icon">✉</div>
            <div className="contact-info">
              <div className="contact-label">Email Formations</div>
              <div className="contact-value">formations@fisafigroupe.com</div>
            </div>
          </a>
          <div className="contact-item">
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