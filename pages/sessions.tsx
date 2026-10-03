
"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Session {
  id: string;
  formationId: string;
  formationTitle: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  maxParticipants: number;
  currentParticipants: number;
  location: string;
  status: "ouverte" | "complète" | "terminée";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeApiSession(value: unknown): Session {
  if (!isRecord(value)) {
    throw new Error("Invalid session returned by the API");
  }

  const id = value.id;
  const formationId = value.formationId;
  const startDate = value.startDate;
  const endDate = value.endDate;
  const status = value.status;
  const capacity = Number(value.capacity ?? value.maxParticipants ?? 0);
  const available = Number(value.available ?? capacity);
  const currentParticipants = Number(
    value.currentParticipants ?? Math.max(0, capacity - available),
  );
  const formation = isRecord(value.formation) ? value.formation : null;
  const formationTitle =
    typeof value.formationTitle === "string"
      ? value.formationTitle
      : formation && typeof formation.name === "string"
        ? formation.name
        : "Formation";

  if (
    (typeof id !== "number" && typeof id !== "string") ||
    (typeof formationId !== "number" && typeof formationId !== "string") ||
    typeof startDate !== "string" ||
    Number.isNaN(Date.parse(startDate)) ||
    typeof endDate !== "string" ||
    Number.isNaN(Date.parse(endDate)) ||
    (status !== "ouverte" && status !== "complète" && status !== "terminée") ||
    !Number.isFinite(capacity) ||
    !Number.isFinite(currentParticipants)
  ) {
    throw new Error("Invalid session data returned by the API");
  }

  return {
    id: String(id),
    formationId: String(formationId),
    formationTitle,
    startDate,
    endDate,
    startTime: typeof value.startTime === "string" ? value.startTime : "",
    endTime: typeof value.endTime === "string" ? value.endTime : "",
    maxParticipants: capacity,
    currentParticipants,
    location: typeof value.location === "string" ? value.location : "",
    status,
  };
}

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const DAY_NAMES = ["L", "M", "M", "J", "V", "S", "D"];

export default function SessionsPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "");
      const res = await fetch(backendUrl ? `${backendUrl}/api/sessions` : "/api/sessions");
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const payload: unknown = await res.json();
      const apiSessions = isRecord(payload) ? payload.data : payload;
      if (!Array.isArray(apiSessions)) {
        throw new Error("Invalid sessions response from the API");
      }
      setSessions(apiSessions.map(normalizeApiSession));
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const sessionsOfMonth = sessions.filter((s) => {
    const d = new Date(s.startDate);
    return (
      d.getMonth() === selectedMonth.getMonth() &&
      d.getFullYear() === selectedMonth.getFullYear()
    );
  });

  const getSessionsForDay = (day: number) =>
    sessionsOfMonth.filter((s) => new Date(s.startDate).getDate() === day);

  const selectedDaySessions = selectedDay ? getSessionsForDay(selectedDay) : [];

  const firstDayRaw = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).getDay();
  const firstDayMon = (firstDayRaw + 6) % 7;
  const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();

  const today = new Date();
  const isToday = (day: number) =>
    today.getDate() === day &&
    today.getMonth() === selectedMonth.getMonth() &&
    today.getFullYear() === selectedMonth.getFullYear();

  const prevMonth = () => {
    setSelectedDay(null);
    setMobileSheetOpen(false);
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1));
  };
  const nextMonth = () => {
    setSelectedDay(null);
    setMobileSheetOpen(false);
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1));
  };

  const handleDayClick = (day: number, hasSessions: boolean) => {
    if (!hasSessions) return;
    if (selectedDay === day) {
      setSelectedDay(null);
      setMobileSheetOpen(false);
    } else {
      setSelectedDay(day);
      setMobileSheetOpen(true);
    }
  };

  const closeSheet = () => {
    setMobileSheetOpen(false);
    setSelectedDay(null);
  };

  const statusLabel = (status: Session["status"]) => {
    if (status === "ouverte") return "Ouverte";
    if (status === "complète") return "Complète";
    return "Terminée";
  };

  const fillRate = (s: Session) => {
    const max = Number(s.maxParticipants) || 0;
    const current = Number(s.currentParticipants) || 0;
    if (max === 0) return 0;
    return Math.round((current / max) * 100);
  };

  const placesLibres = (s: Session) => {
    const max = Number(s.maxParticipants) || 0;
    const current = Number(s.currentParticipants) || 0;
    return max - current;
  };

  return (
    <>
      <Head>
        <title>Sessions & Calendrier | Formations IT | FiSAFi Groupe</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="UTF-8" />
        <meta name="theme-color" content="#1e40af" />
        <meta name="description" content="Consulter le calendrier des sessions de formation IT disponibles. Inscrivez-vous dès maintenant." />
        <meta name="keywords" content="sessions, calendrier formation, inscription, formations IT" />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <link rel="canonical" href="https://fisafigroupe.com/sessions" />
        <meta property="og:title" content="Sessions & Calendrier | FiSAFi Groupe" />
        <meta property="og:description" content="Calendrier des sessions de formation IT" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://fisafigroupe.com/sessions" />
        <meta property="og:image" content="https://fisafigroupe.com/favicon/web-app-manifest-512x512.png" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:site_name" content="FiSAFi Groupe" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Sessions | FiSAFi Groupe" />
        <meta name="twitter:description" content="Sessions de formation IT disponibles" />
        <meta name="twitter:image" content="https://fisafigroupe.com/favicon/web-app-manifest-512x512.png" />
      </Head>

      <Header />

      {/* HERO */}
      <section className="hero sessions-hero" data-observe aria-labelledby="sessions-hero-title">
        <div className="hero-bg" aria-hidden="true" />
        <div className="hero-overlay" aria-hidden="true" />
        <div className="hero-content">
          <div className="hero-eyebrow">Apprendre, progresser, certifier</div>
          <h1 className="hero-title" id="sessions-hero-title">Calendrier des Sessions</h1>
          <p className="hero-sub">
            Consultez nos prochaines formations et inscrivez-vous en quelques clics
          </p>
        </div>
      </section>

      {/* MAIN */}
      <section className="sess-wrap">
        {/* Barre de contrôle */}
        <div className="ctrl-bar">
          <h2 className="ctrl-title">Sessions de formation</h2>
          <div className="view-toggle">
            <button
              className={`vt-btn ${view === "calendar" ? "active" : ""}`}
              onClick={() => setView("calendar")}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.3" />
                <path d="M5 1v4M11 1v4M1 7h14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <span>Calendrier</span>
            </button>
            <button
              className={`vt-btn ${view === "list" ? "active" : ""}`}
              onClick={() => setView("list")}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M2 8h12M2 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span>Liste</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Chargement des sessions…</p>
          </div>
        ) : loadError ? (
          <div className="loading-state" role="alert">
            <p>Impossible de charger les sessions pour le moment.</p>
            <button className="vt-btn" onClick={fetchSessions}>Réessayer</button>
          </div>
        ) : (
          <>
            {/* ── CALENDRIER ── */}
            {view === "calendar" && (
              <>
                <div className="cal-layout">
                  <div className="cal-main">
                    <div className="cal-nav">
                      <button className="nav-btn" onClick={prevMonth} aria-label="Mois précédent">
                        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                          <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <span className="cal-month-label">
                        {MONTH_NAMES[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
                      </span>
                      <button className="nav-btn" onClick={nextMonth} aria-label="Mois suivant">
                        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                          <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>

                    <div className="cal-grid">
                      {DAY_NAMES.map((d, i) => (
                        <div key={i} className="cal-dh">{d}</div>
                      ))}
                      {Array.from({ length: firstDayMon }).map((_, i) => (
                        <div key={`e-${i}`} className="cal-cell empty" />
                      ))}
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                        const daySessions = getSessionsForDay(day);
                        const hasOpen = daySessions.some((s) => s.status === "ouverte");
                        const hasFull = daySessions.some((s) => s.status === "complète");
                        const hasDone = daySessions.some((s) => s.status === "terminée");
                        const isSelected = selectedDay === day;

                        return (
                          <button
                            type="button"
                            aria-label={`${day} ${MONTH_NAMES[selectedMonth.getMonth()]}${daySessions.length ? `, ${daySessions.length} session${daySessions.length > 1 ? "s" : ""}` : ""}`}
                            disabled={daySessions.length === 0}
                            key={day}
                            className={`cal-cell ${daySessions.length > 0 ? "has-sessions" : ""} ${isSelected ? "selected" : ""} ${isToday(day) ? "today" : ""}`}
                            onClick={() => handleDayClick(day, daySessions.length > 0)}
                          >
                            <span className="cal-day-num">{day}</span>
                            {daySessions.length > 0 && (
                              <div className="cal-dots">
                                {hasOpen && <span className="dot ouverte" />}
                                {hasFull && <span className="dot complete" />}
                                {hasDone && <span className="dot terminee" />}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="legend">
                      <div className="leg-item"><span className="dot ouverte" /> Ouverte</div>
                      <div className="leg-item"><span className="dot complete" /> Complète</div>
                      <div className="leg-item"><span className="dot terminee" /> Terminée</div>
                    </div>
                  </div>

                  {/* Panneau desktop */}
                  <div className="cal-panel desktop-panel">
                    {selectedDay ? (
                      <>
                        <div className="panel-head">
                          <div>
                            <span className="panel-day">{selectedDay}</span>
                            <span className="panel-month">
                              {MONTH_NAMES[selectedMonth.getMonth()]}
                            </span>
                          </div>
                          <button className="panel-close" onClick={closeSheet}>
                            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>
                        <div className="panel-list">
                          {selectedDaySessions.map((s) => (
                            <SessionCard key={s.id} s={s} isLoggedIn={isLoggedIn} fillRate={fillRate} statusLabel={statusLabel} placesLibres={placesLibres} />
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="panel-empty">
                        <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
                          <rect x="3" y="5" width="26" height="23" rx="3" stroke="currentColor" strokeWidth="1.4" opacity=".35" />
                          <path d="M10 3v4M22 3v4M3 13h26" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity=".35" />
                        </svg>
                        <p>Sélectionnez un jour pour voir les sessions</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom sheet mobile */}
                {mobileSheetOpen && selectedDay && (
                  <>
                    <div className="sheet-backdrop" onClick={closeSheet} />
                    <div className="bottom-sheet">
                      <div className="sheet-handle" />
                      <div className="sheet-head">
                        <div>
                          <span className="panel-day">{selectedDay}</span>
                          <span className="panel-month">
                            {MONTH_NAMES[selectedMonth.getMonth()]}
                          </span>
                        </div>
                        <button className="panel-close" onClick={closeSheet}>
                          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                      <div className="sheet-body">
                        {selectedDaySessions.map((s) => (
                          <SessionCard key={s.id} s={s} isLoggedIn={isLoggedIn} fillRate={fillRate} statusLabel={statusLabel} placesLibres={placesLibres} />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* ── LISTE ── */}
            {view === "list" && (
              <>
                <div className="list-nav">
                  <button className="nav-btn" onClick={prevMonth}>
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                      <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <span className="cal-month-label">
                    {MONTH_NAMES[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
                  </span>
                  <button className="nav-btn" onClick={nextMonth}>
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>

                {sessionsOfMonth.length === 0 ? (
                  <div className="empty-state">
                    <svg width="38" height="38" viewBox="0 0 40 40" fill="none">
                      <rect x="4" y="6" width="32" height="29" rx="4" stroke="currentColor" strokeWidth="1.4" opacity=".35" />
                      <path d="M13 4v6M27 4v6M4 16h32" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity=".35" />
                    </svg>
                    <p>Aucune session en {MONTH_NAMES[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}</p>
                  </div>
                ) : (
                  <div className="sessions-list">
                    {sessionsOfMonth
                      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                      .map((s) => {
                        const d = new Date(s.startDate);
                        const hasTime = s.startTime && s.endTime;
                        return (
                          <div
                            key={s.id}
                            className={`list-card ${s.status === "terminée" ? "terminated" : ""}`}
                          >
                            {/* Bloc date */}
                            <div className="list-date-block">
                              <span className="list-date-num">{d.getDate()}</span>
                              <span className="list-date-mon">
                                {MONTH_NAMES[d.getMonth()].slice(0, 3)}
                              </span>
                            </div>

                            {/* Corps */}
                            <div className="list-body">
                              <div className="list-top">
                                <h3 className="list-title">{s.formationTitle}</h3>
                                <span className={`s-badge ${s.status}`}>
                                  {statusLabel(s.status)}
                                </span>
                              </div>

                              <div className="list-meta">
                                {s.location && (
                                  <span className="list-meta-item">
                                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                      <path d="M8 1a5 5 0 0 1 5 5c0 3.5-5 9-5 9S3 9.5 3 6a5 5 0 0 1 5-5z" stroke="currentColor" strokeWidth="1.3" />
                                      <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3" />
                                    </svg>
                                    {s.location}
                                  </span>
                                )}
                                {hasTime && (
                                  <span className="list-meta-item">
                                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                      <path d="M8 4v4l3 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
                                    </svg>
                                    {s.startTime} – {s.endTime}
                                  </span>
                                )}
                              </div>

                              {s.status === "ouverte" && (
                                <Link
                                  href={isLoggedIn ? `/training?sessionId=${s.id}` : "/login"}
                                  className="list-cta"
                                  style={{ textDecoration: "none" }}
                                >
                                  {isLoggedIn ? "S'inscrire" : "Se connecter pour s'inscrire"}
                                </Link>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </section>

      <Footer />

      <style jsx>{`
        /* ── LAYOUT ── */
        .sess-wrap {
          max-width: 1380px;
          margin: clamp(42px, 6vw, 80px) auto;
          padding: 0 clamp(18px, 4vw, 48px);
        }

        /* ── CTRL BAR ── */
        .ctrl-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
          gap: 12px;
          flex-wrap: wrap;
        }
        .ctrl-title {
          font-size: clamp(1.5rem, 2.5vw, 2rem);
          font-weight: 700;
          color: #12213a;
          margin: 0;
        }
        .view-toggle {
          display: flex;
          gap: 4px;
          background: var(--mist);
          padding: 4px;
          border-radius: 8px;
          border: 0.5px solid var(--line);
        }
        .vt-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          border: none;
          background: transparent;
          color: var(--steel);
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 650;
          transition: background 0.15s, color 0.15s;
          white-space: nowrap;
        }
        .vt-btn.active {
          background: var(--white);
          color: var(--blue);
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }

        /* ── CAL LAYOUT DESKTOP ── */
        .cal-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 20px;
          align-items: start;
        }
        .cal-main {
          background: var(--white);
          border: 1px solid #dce3ec;
          border-radius: 18px;
          padding: clamp(20px, 3vw, 34px);
          box-shadow: 0 10px 30px rgba(20, 39, 65, 0.07);
        }

        /* NAV */
        .cal-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
        }
        .cal-month-label {
          font-size: clamp(1.2rem, 2vw, 1.55rem);
          font-weight: 700;
          color: #12213a;
        }
        .nav-btn {
          width: 42px;
          height: 42px;
          border: 1px solid #dce3ec;
          border-radius: 10px;
          background: var(--white);
          color: var(--steel);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.15s, color 0.15s;
          flex-shrink: 0;
        }
        .nav-btn:hover {
          border-color: var(--blue);
          color: var(--blue);
        }

        /* GRILLE */
        .cal-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: clamp(5px, 0.8vw, 10px);
          margin-bottom: 18px;
        }
        .cal-dh {
          text-align: center;
          font-size: 12px;
          font-weight: 750;
          color: #526174;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 8px 0 12px;
        }
        .cal-cell {
          aspect-ratio: 1;
          border: 1px solid transparent;
          border-radius: 12px;
          padding: 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          cursor: default;
          appearance: none;
          font: inherit;
          transition: background 0.14s, border-color 0.14s;
        }
        .cal-cell.empty { background: transparent; }
        .cal-cell.has-sessions {
          cursor: pointer;
          background: var(--mist);
          border-color: var(--line);
        }
        .cal-cell.has-sessions:hover {
          border-color: var(--blue);
          background: rgba(30,64,175,0.04);
        }
        .cal-cell.selected {
          border-color: var(--blue) !important;
          background: rgba(30,64,175,0.07) !important;
        }
        .cal-cell.today .cal-day-num {
          background: var(--blue);
          color: var(--white);
          border-radius: 50%;
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cal-day-num {
          font-size: clamp(0.95rem, 1.3vw, 1.15rem);
          font-weight: 600;
          color: #25344a;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .cal-dots {
          display: flex;
          gap: 2px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          display: inline-block;
          flex-shrink: 0;
        }
        .dot.ouverte { background: #16a34a; }
        .dot.complete { background: #dc2626; }
        .dot.terminee { background: #94a3b8; }

        /* LÉGENDE */
        .legend {
          display: flex;
          gap: 16px;
          border-top: 0.5px solid var(--line);
          padding-top: 14px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .leg-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 550;
          color: #526174;
        }

        /* PANNEAU DESKTOP */
        .desktop-panel {
          background: var(--white);
          border: 1px solid #dce3ec;
          border-radius: 18px;
          min-height: 280px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .panel-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 18px 14px;
          border-bottom: 0.5px solid var(--line);
        }
        .panel-day {
          font-size: 26px;
          font-weight: 700;
          color: var(--blue);
          line-height: 1;
          margin-right: 6px;
        }
        .panel-month {
          font-size: 13px;
          color: var(--steel);
        }
        .panel-close {
          width: 26px;
          height: 26px;
          border: 0.5px solid var(--line);
          border-radius: 6px;
          background: transparent;
          color: var(--steel);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.15s;
          flex-shrink: 0;
        }
        .panel-close:hover { border-color: var(--ink); color: var(--ink); }
        .panel-list {
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow-y: auto;
          max-height: 520px;
        }
        .panel-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 32px 20px;
          color: var(--steel);
          text-align: center;
        }
        .panel-empty p {
          font-size: 1rem;
          font-weight: 550;
          line-height: 1.5;
          margin: 0;
          max-width: 180px;
        }

        /* ── BOTTOM SHEET MOBILE ── */
        .sheet-backdrop { display: none; }
        .bottom-sheet { display: none; }

        /* ── SESSION CARD (calendrier) ── */
        .s-card {
          border: 1px solid #dce3ec;
          border-radius: 14px;
          padding: 18px;
          background: var(--white);
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: all 0.2s ease;
        }
        .s-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.08);
          border-color: var(--orange);
        }
        .s-card.ouverte { border-left: 4px solid #16a34a; }
        .s-card.complete { border-left: 4px solid #dc2626; opacity: 0.85; }
        .s-card.terminee { border-left: 4px solid #94a3b8; opacity: 0.7; }
        .s-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .s-card-title {
          font-family: var(--card-title-font);
          font-size: var(--card-title-size);
          font-weight: var(--card-title-weight);
          color: #12213a;
          margin: 0;
          line-height: 1.35;
        }
        .s-card-loc {
          font-family: var(--card-copy-font);
          font-size: var(--card-copy-size);
          font-weight: var(--card-copy-weight);
          color: #526174;
          display: flex;
          align-items: center;
          gap: 4px;
          margin: 0;
        }
        .s-badge {
          font-size: 0.82rem;
          font-weight: 700;
          padding: 5px 11px;
          border-radius: 20px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .s-badge.ouverte { background: rgba(22,163,74,0.1); color: #15803d; }
        .s-badge.complète { background: rgba(220,38,38,0.1); color: #b91c1c; }
        .s-badge.terminée { background: rgba(148,163,184,0.12); color: var(--steel); }
        .s-time {
          font-size: 0.88rem;
          color: #40516a;
          white-space: nowrap;
          background: var(--mist);
          padding: 2px 8px;
          border-radius: 12px;
        }
        .fill-bar-track {
          height: 5px;
          background: rgba(0,0,0,0.07);
          border-radius: 3px;
          overflow: hidden;
        }
        .fill-bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.4s ease;
        }
        .fill-bar-fill.ouverte { background: #16a34a; }
        .fill-bar-fill.complète { background: #dc2626; }
        .fill-bar-fill.terminée { background: #94a3b8; }
        .fill-label { font-size: 0.88rem; color: #526174; }
        .s-card-cta {
          display: block;
          text-align: center;
          padding: 12px 16px;
          background: var(--blue);
          color: var(--white);
          border-radius: 8px;
          font-size: 0.94rem;
          font-weight: 700;
          text-decoration: none;
          transition: opacity 0.2s ease;
          margin-top: 4px;
        }
        .s-card-cta:hover { opacity: 0.88; }

        /* ── VUE LISTE ── */
        .list-nav {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
        }
        .sessions-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        /* Card liste — design épuré */
        .list-card {
          display: flex;
          align-items: stretch;
          background: var(--white);
          border: 1px solid #dce3ec;
          border-radius: 14px;
          overflow: hidden;
          transition: box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .list-card:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.07);
          border-color: rgba(0,0,0,0.12);
        }
        .list-card.terminated {
          opacity: 0.55;
        }

        /* Bloc date */
        .list-date-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 84px;
          padding: 22px 12px;
          background: var(--mist);
          border-right: 0.5px solid var(--line);
          gap: 3px;
          flex-shrink: 0;
        }
        .list-date-num {
          font-size: 1.9rem;
          font-weight: 750;
          color: #12213a;
          line-height: 1;
        }
        .list-date-mon {
          font-size: 0.82rem;
          color: #526174;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        /* Corps */
        .list-body {
          flex: 1;
          padding: 18px 22px;
          display: flex;
          flex-direction: column;
          gap: 7px;
          min-width: 0;
          justify-content: center;
        }
        .list-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .list-title {
          font-family: var(--card-title-font);
          font-size: var(--card-title-size);
          font-weight: var(--card-title-weight);
          color: #12213a;
          margin: 0;
          line-height: 1.3;
          flex: 1;
          min-width: 0;
        }
        .list-meta {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }
        .list-meta-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-family: var(--card-copy-font);
          font-size: var(--card-copy-size);
          font-weight: var(--card-copy-weight);
          color: #526174;
        }

        /* CTA liste */
        .list-cta {
          display: inline-flex;
          align-self: flex-start;
          align-items: center;
          padding: 10px 16px;
          background: var(--white);
          border: 0.5px solid var(--line);
          border-radius: 8px;
          font-size: 0.92rem;
          font-weight: 650;
          color: var(--ink);
          text-decoration: none;
          margin-top: 4px;
          transition: border-color 0.15s, background 0.15s;
        }
        .list-cta:hover {
          border-color: var(--blue);
          color: var(--blue);
          background: rgba(30,64,175,0.04);
        }

        /* ── ÉTATS ── */
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          padding: 70px 20px;
          color: #526174;
          font-size: 1rem;
        }
        .spinner {
          width: 26px;
          height: 26px;
          border: 2px solid var(--line);
          border-top-color: var(--blue);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 70px 20px;
          color: #526174;
          font-size: 1rem;
          text-align: center;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 860px) {
          .cal-layout { grid-template-columns: 1fr; }
          .desktop-panel { display: none; }
          .sheet-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.4);
            z-index: 40;
            animation: fadeIn 0.2s ease;
          }
          @supports(backdrop-filter:blur(1px)){@media(min-width:769px){.sheet-backdrop{backdrop-filter:blur(4px);}}}
          .bottom-sheet {
            display: flex;
            flex-direction: column;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: var(--white);
            border-radius: 20px 20px 0 0;
            z-index: 50;
            max-height: 75vh;
            animation: slideUp 0.3s cubic-bezier(0.4,0,0.2,1);
            border-top: 1px solid var(--line);
          }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
          .sheet-handle {
            width: 40px;
            height: 4px;
            background: var(--line);
            border-radius: 2px;
            margin: 12px auto 0;
            flex-shrink: 0;
          }
          .sheet-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 14px 20px 12px;
            border-bottom: 0.5px solid var(--line);
            flex-shrink: 0;
          }
          .sheet-body {
            padding: 16px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
            -webkit-overflow-scrolling: touch;
          }
        }

        @media (max-width: 500px) {
          .sess-wrap { padding: 0 14px; margin: 36px auto; }
          .ctrl-title { font-size: 1.25rem; }
          .vt-btn span { display: inline; }
          .vt-btn { padding: 9px 10px; font-size: 0.82rem; }
          .cal-main { padding: 16px 12px; }
          .cal-grid { gap: 3px; }
          .cal-dh { font-size: 0.7rem; padding: 4px 0 6px; }
          .cal-cell { border-radius: 6px; gap: 2px; }
          .cal-day-num { font-size: 0.85rem; width: 24px; height: 24px; }
          .cal-cell.today .cal-day-num { width: 24px; height: 24px; }
          .dot { width: 4px; height: 4px; }
          .list-date-block { min-width: 66px; padding: 14px 8px; }
          .list-date-num { font-size: 1.45rem; }
          .s-card-title,
          .list-title { font-size: var(--card-title-size-mobile); }
          .list-top { flex-wrap: wrap; }
          .list-body { padding: 12px 14px; }
        }

        @media (min-width: 900px) {
          .s-card-title,
          .list-title { font-size: var(--card-title-size-wide); }

          .s-card-loc,
          .list-meta-item { font-size: var(--card-copy-size-wide); }
        }

        @media (max-width: 640px) {
          .s-card-title,
          .list-title { font-size: var(--card-title-size-mobile); }
        }

        .vt-btn:focus-visible,
        .nav-btn:focus-visible,
        .panel-close:focus-visible,
        .cal-cell.has-sessions:focus-visible {
          outline: 3px solid #f0a36b;
          outline-offset: 2px;
        }

        @media (prefers-reduced-motion: reduce) {
          .spinner { animation: none; }
          .s-card,
          .list-card,
          .nav-btn,
          .vt-btn { transition: none; }
        }
      `}</style>
    </>
  );
}

/* ── SessionCard (vue calendrier) ── */
function SessionCard({
  s,
  isLoggedIn,
  fillRate,
  statusLabel,
  placesLibres,
}: {
  s: Session;
  isLoggedIn: boolean;
  fillRate: (s: Session) => number;
  statusLabel: (status: Session["status"]) => string;
  placesLibres: (s: Session) => number;
}) {
  const statusClass =
    s.status === "complète" ? "complete" : s.status === "terminée" ? "terminee" : "ouverte";

  return (
    <div className={`s-card ${statusClass}`}>
      <div className="s-card-top">
        <span className={`s-badge ${s.status}`}>{statusLabel(s.status)}</span>
        {s.startTime && s.endTime && (
          <span className="s-time">{s.startTime} – {s.endTime}</span>
        )}
      </div>
      <h4 className="s-card-title">{s.formationTitle}</h4>
      {s.location && (
        <p className="s-card-loc">
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
            <path d="M8 1a5 5 0 0 1 5 5c0 3.5-5 9-5 9S3 9.5 3 6a5 5 0 0 1 5-5z" stroke="currentColor" strokeWidth="1.3" />
            <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3" />
          </svg>
          {s.location}
        </p>
      )}
      {s.maxParticipants > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <div className="fill-bar-track">
            <div className={`fill-bar-fill ${s.status}`} style={{ width: `${fillRate(s)}%` }} />
          </div>
          <span className="fill-label">
            {s.currentParticipants} / {s.maxParticipants} participants
          </span>
        </div>
      )}
      {s.status === "ouverte" && (
        <Link
          href={isLoggedIn ? `/training?sessionId=${s.id}` : "/login"}
          className="s-card-cta"
        >
          {isLoggedIn
            ? `S'inscrire (${placesLibres(s)} place${placesLibres(s) > 1 ? "s" : ""})`
            : "Se connecter pour s'inscrire"}
        </Link>
      )}
    </div>
  );
}