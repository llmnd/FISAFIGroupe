'use client';

import { useState, useEffect, useRef } from 'react';

interface Service {
  title: string;
  items: string[];
  num: string;
  accent: string;
  accentDark: string;
  icon: string;
  description: string;
}

const services: Service[] = [
  {
    num: '01',
    title: 'Ingénierie',
    icon: '⚙️',
    accent: 'from-stone-800 to-stone-700',
    accentDark: '#1c1917',
    description:
      'Nous concevons, étudions et déployons des solutions techniques robustes adaptées aux défis d\'infrastructure modernes.',
    items: [
      'Études techniques (télécoms, réseaux, infrastructures)',
      'Conception et déploiement',
    ],
  },
  {
    num: '02',
    title: 'Expertise & Conseil',
    icon: '🔍',
    accent: 'from-amber-800 to-amber-700',
    accentDark: '#78350f',
    description:
      'Notre expertise pluridisciplinaire vous accompagne dans chaque phase de votre transformation numérique, de l\'audit à la stratégie.',
    items: [
      'Audit technique',
      'Assistance à maîtrise d\'ouvrage',
      'Stratégie et transformation digitale',
    ],
  },
  {
    num: '03',
    title: 'Formation',
    icon: '🎓',
    accent: 'from-teal-800 to-teal-700',
    accentDark: '#134e4a',
    description:
      'Des programmes de formation structurés pour renforcer les compétences de vos équipes sur les technologies actuelles et émergentes.',
    items: [
      'Formations techniques spécialisées',
      'Certifications professionnelles',
      'Formations sur mesure',
    ],
  },
  {
    num: '04',
    title: 'Import – Export & Négoce',
    icon: '🌐',
    accent: 'from-indigo-800 to-indigo-700',
    accentDark: '#1e1b4b',
    description:
      'Nous facilitons l\'accès aux équipements techniques de qualité à travers un réseau de partenaires internationaux fiables.',
    items: [
      'Fourniture d\'équipements techniques',
      'Commerce général',
      'Solutions d\'approvisionnement international',
    ],
  },
];

function ServiceModal({
  service,
  onClose,
}: {
  service: Service;
  onClose: () => void;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      backdropRef.current?.classList.add('modal-in');
      modalRef.current?.classList.add('modal-panel-in');
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <>
      <style>{`
        .modal-backdrop {
          opacity: 0;
          transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .modal-backdrop.modal-in { opacity: 1; }

        .modal-panel {
          opacity: 0;
          transform: translateY(28px) scale(0.97);
          transition:
            opacity    0.5s  cubic-bezier(0.16, 1, 0.3, 1),
            transform  0.5s  cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .modal-panel.modal-panel-in {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        .modal-num-display {
          font-family: 'Cormorant Garamond', 'Palatino Linotype', Georgia, serif;
          font-size: clamp(5rem, 10vw, 8rem);
          font-weight: 300;
          line-height: 1;
          letter-spacing: -0.04em;
          color: rgba(255,255,255,0.15);
          user-select: none;
        }

        .modal-title-serif {
          font-family: 'Cormorant Garamond', 'Palatino Linotype', Georgia, serif;
          font-weight: 300;
          letter-spacing: -0.025em;
          line-height: 1.15;
        }

        @keyframes slideItem {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .modal-item {
          animation: slideItem 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .modal-cta {
          background: #1a1a1a;
          color: #fff;
          border: none;
          padding: 0.85rem 2.25rem;
          border-radius: 60px;
          font-family: 'Outfit', 'DM Sans', system-ui, sans-serif;
          font-size: 0.78rem;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .modal-cta:hover {
          background: #333;
          transform: scale(1.03) translateY(-1px);
        }

        .modal-close-btn {
          background: rgba(255,255,255,0.1);
          border: 0.5px solid rgba(255,255,255,0.2);
          color: rgba(255,255,255,0.8);
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 18px;
          transition: background 0.3s ease, transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          flex-shrink: 0;
        }
        .modal-close-btn:hover {
          background: rgba(255,255,255,0.25);
          transform: rotate(90deg) scale(1.1);
        }

        .modal-divider {
          width: 40px;
          height: 1.5px;
          background: rgba(0,0,0,0.12);
          margin: 1rem 0;
        }

        .modal-tag {
          font-family: 'Outfit', sans-serif;
          font-size: 0.62rem;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 0.26rem 0.8rem;
          border-radius: 40px;
          background: rgba(0,0,0,0.04);
          color: #666;
          border: 0.5px solid rgba(0,0,0,0.07);
          display: inline-block;
        }
      `}</style>

      <div
        ref={backdropRef}
        className="modal-backdrop"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(4, 4, 8, 0.80)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
        }}
        onClick={(e) => e.target === backdropRef.current && onClose()}
      >
        <div
          ref={modalRef}
          className="modal-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          style={{
            display: 'flex',
            width: '100%',
            maxWidth: '960px', // 🔥 ÉLARGI DE 820px À 960px
            maxHeight: '90vh',
            borderRadius: '32px',
            overflow: 'hidden',
            boxShadow:
              '0 32px 80px rgba(0,0,0,0.45), 0 0 0 0.5px rgba(255,255,255,0.08)',
          }}
        >
          {/* ── Left accent column ─────────────── */}
          <div
            style={{
              width: '220px', // Légèrement élargi aussi
              flexShrink: 0,
              background: `linear-gradient(160deg, ${service.accentDark}, #111)`,
              padding: '2rem 1.6rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
            }}
            className="hidden sm:flex"
          >
            <button className="modal-close-btn" onClick={onClose} aria-label="Fermer">
              ✕
            </button>

            <div style={{ marginTop: 'auto', paddingBottom: '1rem' }}>
              <div className="modal-num-display">{service.num}</div>
              <div
                style={{
                  width: '30px',
                  height: '1px',
                  background: 'rgba(255,255,255,0.3)',
                  margin: '1rem 0',
                }}
              />
              <p
                style={{
                  fontFamily: "'Outfit', system-ui, sans-serif",
                  fontSize: '0.65rem',
                  fontWeight: 500,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.45)',
                  margin: 0,
                }}
              >
                Service
              </p>
            </div>

            <div
              style={{
                position: 'absolute',
                bottom: '-20px',
                right: '-20px',
                width: '100px',
                height: '100px',
                backgroundImage:
                  'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)',
                backgroundSize: '12px 12px',
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* ── Right content pane ─────────────── */}
          <div
            style={{
              flex: 1,
              background: '#fafaf8',
              padding: 'clamp(2.5rem, 5%, 3.5rem)', // Un peu plus de padding
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0',
            }}
          >
            {/* Header row for mobile */}
            <div
              className="flex sm:hidden"
              style={{ justifyContent: 'flex-end', marginBottom: '1.25rem' }}
            >
              <button
                onClick={onClose}
                aria-label="Fermer"
                style={{
                  background: 'rgba(0,0,0,0.05)',
                  border: '0.5px solid rgba(0,0,0,0.1)',
                  color: '#555',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'background 0.3s, transform 0.35s',
                }}
              >
                ✕
              </button>
            </div>

            <p
              style={{
                fontFamily: "'Outfit', system-ui, sans-serif",
                fontSize: '0.65rem',
                fontWeight: 600,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#c06030',
                margin: '0 0 0.85rem',
              }}
            >
              {service.num} — Nos services
            </p>

            <h2
              id="modal-title"
              className="modal-title-serif"
              style={{
                fontSize: 'clamp(2.4rem, 6vw, 3.6rem)', // 🔥 Taille augmentée pour éviter la coupure
                color: '#111',
                margin: '0 0 0.2rem',
              }}
            >
              {service.title}
            </h2>

            <div className="modal-divider" />

            <p
              style={{
                fontFamily: "'Outfit', system-ui, sans-serif",
                fontSize: '0.92rem',
                fontWeight: 390,
                color: '#555',
                lineHeight: 1.8,
                margin: '0 0 2rem',
              }}
            >
              {service.description}
            </p>

            <ul
              style={{
                listStyle: 'none',
                margin: '0 0 2.25rem',
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.7rem',
              }}
            >
              {service.items.map((item, i) => (
                <li
                  key={i}
                  className="modal-item"
                  style={{ animationDelay: `${0.18 + i * 0.08}s` }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.85rem',
                      padding: '0.9rem 1.1rem',
                      background: '#fff',
                      borderRadius: '14px',
                      border: '0.5px solid rgba(0,0,0,0.07)',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    }}
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: service.accentDark,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: '1px',
                      }}
                    >
                      <svg
                        width="11"
                        height="8"
                        viewBox="0 0 11 8"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M1 4L3.8 7L10 1"
                          stroke="rgba(255,255,255,0.85)"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span
                      style={{
                        fontFamily: "'Outfit', system-ui, sans-serif",
                        fontSize: '0.87rem',
                        fontWeight: 400,
                        color: '#333',
                        lineHeight: 1.55,
                      }}
                    >
                      {item}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              <button className="modal-cta">Nous contacter</button>
              <span className="modal-tag">En savoir plus →</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Services() {
  const [active, setActive] = useState<Service | null>(null);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=Outfit:wght@300;400;500;570&display=swap');

        .svc-card {
          cursor: pointer;
          transition: transform 0.45s cubic-bezier(0.22, 1.2, 0.36, 0.97),
                      box-shadow 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .svc-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.07), 0 2px 6px rgba(0,0,0,0.04);
        }
        .svc-card:hover .svc-line {
          width: 100% !important;
        }
        .svc-card:hover .svc-title {
          color: #c06030 !important;
        }
        .svc-line {
          transition: width 0.55s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .svc-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-weight: 350;
          letter-spacing: -0.02em;
          line-height: 1.2;
          transition: color 0.3s ease;
        }
        .svc-num {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-weight: 300;
          letter-spacing: 0.04em;
          color: rgba(0,0,0,0.18);
        }
        .svc-item {
          font-family: 'Outfit', system-ui, sans-serif;
          font-size: 0.83rem;
          font-weight: 390;
          color: #666;
          line-height: 1.6;
          letter-spacing: 0.005em;
        }
        .svc-discover {
          font-family: 'Outfit', system-ui, sans-serif;
          font-size: 0.62rem;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(0,0,0,0.28);
          transition: color 0.3s ease, letter-spacing 0.4s;
        }
        .svc-card:hover .svc-discover {
          color: #c06030;
          letter-spacing: 0.2em;
        }
      `}</style>

      <section
        id="services"
        className="py-16 sm:py-20 md:py-32 px-4 sm:px-6"
        style={{ background: '#fafaf8' }}
      >
        <div className="max-w-7xl mx-auto">
          <div style={{ marginBottom: 'clamp(2.5rem, 5vw, 4.5rem)' }}>
            <p
              style={{
                fontFamily: "'Outfit', system-ui, sans-serif",
                fontSize: '0.65rem',
                fontWeight: 600,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: '#c06030',
                marginBottom: '1rem',
              }}
            >
              Ce que nous faisons
            </p>
            <h2
              className="svc-title"
              style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', color: '#111', margin: 0 }}
            >
              Nos services
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'clamp(1.5rem, 3vw, 2.5rem)',
            }}
          >
            {services.map((service) => (
              <div
                key={service.num}
                className="svc-card"
                role="button"
                tabIndex={0}
                aria-label={`En savoir plus sur ${service.title}`}
                onClick={() => setActive(service)}
                onKeyDown={(e) =>
                  (e.key === 'Enter' || e.key === ' ') && setActive(service)
                }
                style={{
                  background: '#fff',
                  borderRadius: '24px',
                  border: '0.5px solid rgba(0,0,0,0.06)',
                  padding: 'clamp(1.75rem, 4%, 2.25rem)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.2rem',
                  outline: 'none',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <span className="svc-num" style={{ fontSize: '2rem' }}>
                    {service.num}
                  </span>
                  <span style={{ fontSize: '1.5rem', opacity: 0.7 }}>{service.icon}</span>
                </div>

                <h3
                  className="svc-title"
                  style={{ fontSize: 'clamp(1.35rem, 3vw, 1.7rem)', color: '#111', margin: 0 }}
                >
                  {service.title}
                </h3>

                <div
                  className="svc-line"
                  style={{
                    height: '1px',
                    width: '36px',
                    background: '#1a1a1a',
                    borderRadius: '2px',
                  }}
                />

                <ul
                  style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                >
                  {service.items.map((item, i) => (
                    <li key={i} className="svc-item" style={{ display: 'flex', gap: '0.5rem' }}>
                      <span style={{ color: '#c06030', flexShrink: 0 }}>—</span>
                      {item}
                    </li>
                  ))}
                </ul>

                <p className="svc-discover" style={{ margin: 0, marginTop: 'auto', paddingTop: '0.5rem' }}>
                  Découvrir →
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {active && <ServiceModal service={active} onClose={() => setActive(null)} />}
    </>
  );
}