"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import dynamic from "next/dynamic";
import Header from "@/components/Header";

const HeroSlideshow = dynamic(() => import("@/components/heroSlideshow"), { ssr: false });

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
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [hoveredBrochureId, setHoveredBrochureId] = useState<number | null>(null);

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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSubmitStatus(null);
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
          formationId: parseInt(formData.formationId),
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

  // Icône SVG calendrier — pas d'emoji, layout stable sur mobile
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
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setTimeout(() => setDownloadingId(null), 1200);
    }
  };

  const renderBrochuresList = () => {
    if (loadingBrochures) {
      return (
        <div style={{ paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 64, borderRadius: 2, background: 'rgba(30,64,175,0.04)' }} />
          ))}
        </div>
      );
    }

    if (brochures.length === 0) {
      return (
        <div style={{
          padding: '3rem 0',
          textAlign: 'center',
          color: 'var(--steel)',
          fontFamily: "'Outfit', sans-serif",
          fontSize: 14,
        }}>
          Aucun document disponible pour le moment.
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {brochures.map((doc) => {
          const fileSize = doc.fileSize ? parseInt(doc.fileSize, 10) : 0;
          const displaySize = getFormattedFileSize(fileSize);
          const isAvailable = !!doc.fileUrl;
          const isHovered = hoveredBrochureId === doc.id;
          const isDownloading = downloadingId === doc.id;

          // Utilise un objet style unique sans doublon de propriété
          const buttonStyle: React.CSSProperties = {
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            alignItems: 'center',
            gap: '1.25rem',
            padding: '1.25rem 0',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            borderBottom: '0.5px solid var(--line)',
            background: 'transparent',
            cursor: isAvailable ? 'pointer' : 'default',
            textAlign: 'left',
            fontFamily: 'inherit',
            width: '100%',
            opacity: isAvailable ? 1 : 0.45,
            transition: 'all 0.15s ease',
          };

          return (
            <button
              key={doc.id}
              onClick={(e) => handleDownload(e, doc)}
              onMouseEnter={() => isAvailable && setHoveredBrochureId(doc.id)}
              onMouseLeave={() => setHoveredBrochureId(null)}
              disabled={!isAvailable || isDownloading}
              title={isAvailable ? 'Télécharger' : 'Fichier non disponible'}
              style={buttonStyle}
            >
              {/* Icône PDF */}
              <div style={{
                width: 40,
                height: 48,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: isHovered ? 'var(--blue)' : 'var(--steel)',
                transition: 'color 0.15s',
                flexShrink: 0,
              }}>
                <PdfIcon />
                <span style={{
                  fontSize: 8,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  marginTop: 3,
                  fontFamily: "'Outfit', sans-serif",
                  color: isHovered ? 'var(--blue)' : 'var(--steel)',
                  transition: 'color 0.15s',
                }}>
                  PDF
                </span>
              </div>

              {/* Infos */}
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 14,
                  fontWeight: 400,
                  color: 'var(--ink)',
                  letterSpacing: '0.01em',
                  marginBottom: 4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {doc.name || 'Document sans titre'}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 11,
                  color: 'var(--steel)',
                  letterSpacing: '0.03em',
                }}>
                  {displaySize && (
                    <>
                      <span>{displaySize}</span>
                      <span style={{ width: 2, height: 2, borderRadius: '50%', background: 'var(--line)', display: 'inline-block' }} />
                    </>
                  )}
                  <span style={{ textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.08em' }}>
                    {isAvailable ? 'Disponible' : 'Non disponible'}
                  </span>
                </div>
              </div>

              {/* Action télécharger */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontFamily: "'Outfit', sans-serif",
                fontSize: 11,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--blue)',
                opacity: isHovered && isAvailable ? 1 : 0,
                transform: isHovered && isAvailable ? 'translateX(0)' : 'translateX(6px)',
                transition: 'opacity 0.15s, transform 0.15s',
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}>
                {isDownloading ? (
                  <span style={{ fontSize: 11, color: 'var(--steel)' }}>…</span>
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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: '2px',
    fontSize: '14px',
    fontFamily: "'Outfit', sans-serif",
    background: 'rgba(255,255,255,0.08)',
    color: '#ffffff',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: 500,
    fontFamily: "'Outfit', sans-serif",
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  };

  const sessions = [
    { title: "Sessions Présentielles", desc: "Formation en groupe au centre FISAFI" },
    { title: "Sessions E-Learning", desc: "Apprentissage digitalisé avec tuteur virtuel" },
    { title: "Sessions Hybrides", desc: "Combine présentiel et apprentissage en ligne" },
    { title: "Sessions Intra-Entreprise", desc: "Formation personnalisée sur site entreprise" },
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
              <div className="ceo-title">Excellence Pédagogique & Certification</div>
            </div>
          </div>
        </div>
      </div>

      {/* CATALOGUE */}
      <section className="section" id="catalogue">
        <div className="section-eyebrow reveal">Nos offres de formation</div>
        <h2 className="section-title reveal reveal-delay-1">Catalogue de<br />formations</h2>
        <div className="services-grid-new">
          {[
            { num: "01", name: "Administration Réseaux & Télécoms", desc: "Conception, installation, maintenance et sécurisation des infrastructures réseaux et télécom.", img: "/9.jpeg" },
            { num: "02", name: "Infrastructure IT & Virtualisation", desc: "Déploiement de serveurs, gestion des données, virtualisation et cloud computing.", img: "/10.jpeg" },
            { num: "03", name: "Cybersécurité & Digital Trust", desc: "Sécurité informatique, protection des données, audit de sécurité et conformité.", img: "/11.jpeg" },
            { num: "04", name: "Certification Professionnelle", desc: "Préparation aux certifications reconnues internationales (Cisco, CompTIA, Microsoft, etc.).", img: "/12.jpeg" },
          ].map((s, i) => (
            <div key={s.num} className={`service-card-new reveal${i > 0 ? ` reveal-delay-${i}` : ""}`}>
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
      </section>

      <div className="divider" />

      {/* CALENDRIER DES SESSIONS */}
      <section className="competences-section" id="sessions">
        <div className="section-eyebrow reveal">Planning des sessions</div>
        <h2 className="section-title reveal reveal-delay-1">Calendrier<br />des sessions</h2>
        <div className="comp-grid">
          {sessions.map((session, i) => (
            <div
              key={session.title}
              className={`comp-item reveal${i > 0 ? ` reveal-delay-${i}` : ""}`}
            >
              {/* Icône SVG — remplace l'emoji 📅 pour éviter tout chevauchement */}
              <div
                className="comp-icon"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 36,
                  height: 36,
                  color: 'var(--blue)',
                  marginBottom: '0.5rem',
                }}
              >
                <CalendarIcon />
              </div>
              <div className="comp-name">{session.title}</div>
              <div style={{
                fontSize: '0.85rem',
                color: 'var(--steel)',
                marginTop: '0.5rem',
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 300,
                lineHeight: 1.6,
              }}>
                {session.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BROCHURES */}
      <section className="vision-section" id="brochures">
        <div className="section-eyebrow reveal">Ressources</div>
        <h2 className="section-title reveal reveal-delay-1">Téléchargement<br />de brochures</h2>
        <div className="vision-box reveal reveal-delay-2">
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}>
            <div>
              <div className="vision-label">Documents disponibles</div>
              <p className="vision-text" style={{ marginBottom: 0 }}>
                Catalogues détaillés, programmes pédagogiques, tarifs et modalités d&apos;inscription.
              </p>
            </div>
            {!loadingBrochures && brochures.length > 0 && (
              <div style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 11,
                color: 'var(--steel)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                paddingTop: '0.2rem',
                whiteSpace: 'nowrap',
              }}>
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
        <div className="section-eyebrow reveal">Rejoignez-nous</div>
        <h2 className="section-title reveal reveal-delay-1">Inscription<br />en ligne</h2>
        <p className="contact-tagline reveal reveal-delay-2">« Développez vos compétences avec FISAFI »</p>

        <form
          className="contact-form reveal reveal-delay-3"
          style={{ maxWidth: '600px', margin: '2rem auto' }}
          onSubmit={handleFormSubmit}
        >
          <div style={{ display: 'grid', gap: '1rem' }}>
            {submitStatus && (
              <div style={{
                padding: '1rem',
                borderRadius: '4px',
                backgroundColor: submitStatus.type === 'success' ? '#d4edda' : '#f8d7da',
                color: submitStatus.type === 'success' ? '#155724' : '#721c24',
                border: `1px solid ${submitStatus.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
                fontFamily: "'Outfit', sans-serif",
                fontSize: 14,
              }}>
                {submitStatus.message}
              </div>
            )}
            <div>
              <label style={labelStyle}>Nom complet *</label>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleFormChange} placeholder="Votre nom" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email *</label>
              <input type="email" name="email" value={formData.email} onChange={handleFormChange} placeholder="votre@email.com" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Téléphone *</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleFormChange} placeholder="+221 77 XXX XX XX" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Formation souhaitée *</label>
              <select name="formationId" value={formData.formationId} onChange={handleFormChange} required style={inputStyle}>
                <option value="">Sélectionnez une formation</option>
                <option value="1">Administration Réseaux & Télécoms</option>
                <option value="2">Infrastructure IT & Virtualisation</option>
                <option value="3">Cybersécurité & Digital Trust</option>
                <option value="4">Certification Professionnelle</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Message</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleFormChange}
                placeholder="Vos questions…"
                rows={4}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
            <button
              type="submit"
              className="btn-contact"
              style={{ marginTop: '1rem', opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
              disabled={loading}
            >
              {loading ? 'Envoi en cours…' : 'Soumettre mon inscription'}
            </button>
          </div>
        </form>

        <div className="contact-items" style={{ marginTop: '3rem' }}>
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