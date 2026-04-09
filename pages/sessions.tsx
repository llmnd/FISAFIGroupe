"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Header from "@/components/Header";

interface Session {
  id: string;
  formationId: string;
  formationTitle: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  currentParticipants: number;
  location: string;
  status: "ouverte" | "complète" | "terminée";
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
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const buildApiUrl = (endpoint: string) => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
    return backendUrl ? `${backendUrl}${endpoint}` : endpoint;
  };

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
      const res = await fetch(buildApiUrl("/api/sessions"));
      if (res.ok) {
        const data = await res.json();
        setSessions(Array.isArray(data) ? data : data.data || []);
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
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
        <title>Calendrier des Sessions — FiSAFi Groupe</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Header />

      {/* HERO */}
      <section className="hero" style={{ height: "260px" }}>
        <div className="hero-bg" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 className="hero-title">Calendrier des Sessions</h1>
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
        ) : (
          <>
            {/* ── CALENDRIER ── */}
            {view === "calendar" && (
              <>
                <div className="cal-layout">
                  {/* Calendrier principal */}
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
                          <div
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
                          </div>
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
                        const places = placesLibres(s);
                        return (
                          <div key={s.id} className={`list-card ${s.status}`}>
                            <div className="list-date-block">
                              <span className="list-date-num">{d.getDate()}</span>
                              <span className="list-date-mon">{MONTH_NAMES[d.getMonth()].slice(0, 3)}</span>
                            </div>
                            <div className="list-body">
                              <div className="list-top">
                                <span className={`s-badge ${s.status}`}>{statusLabel(s.status)}</span>
                                <span className="s-time">{s.startTime} – {s.endTime}</span>
                              </div>
                              <h3 className="list-title">{s.formationTitle}</h3>
                              <div className="list-meta">
                                <span className="list-meta-item">
                                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                                    <path d="M8 1a5 5 0 0 1 5 5c0 3.5-5 9-5 9S3 9.5 3 6a5 5 0 0 1 5-5z" stroke="currentColor" strokeWidth="1.3" />
                                    <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3" />
                                  </svg>
                                  {s.location}
                                </span>
                                <span className="list-meta-item">
                                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                                    <path d="M8 4v4l3 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
                                  </svg>
                                  {s.currentParticipants}/{s.maxParticipants}
                                </span>
                              </div>
                              <div className="fill-bar-track" style={{ marginTop: "8px" }}>
                                <div className={`fill-bar-fill ${s.status}`} style={{ width: `${fillRate(s)}%` }} />
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                                <span style={{ fontSize: "11px", color: "var(--steel)" }}>
                                  {s.currentParticipants}/{s.maxParticipants} participants
                                </span>
                                {s.status === "ouverte" && (
                                  <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: 600 }}>
                                    {places} place{places > 1 ? "s" : ""} libre{places > 1 ? "s" : ""}
                                  </span>
                                )}
                              </div>
                              {/* CTA inline sur mobile */}
                              {s.status === "ouverte" && (
                                <Link
                                  href={isLoggedIn ? `/training?sessionId=${s.id}` : "/login"}
                                  className="list-cta-inline"
                                  style={{ textDecoration: "none" }}
                                >
                                  S&apos;inscrire
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

      <style jsx>{`
        /* ── LAYOUT ── */
        .sess-wrap {
          max-width: 1200px;
          margin: 48px auto;
          padding: 0 20px;
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
          font-size: 20px;
          font-weight: 600;
          color: var(--ink);
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
          padding: 7px 13px;
          border: none;
          background: transparent;
          color: var(--steel);
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
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
          border: 0.5px solid var(--line);
          border-radius: 12px;
          padding: 22px 18px;
        }

        /* NAV */
        .cal-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
        }
        .cal-month-label {
          font-size: 15px;
          font-weight: 600;
          color: var(--ink);
        }
        .nav-btn {
          width: 32px;
          height: 32px;
          border: 0.5px solid var(--line);
          border-radius: 7px;
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
          gap: 4px;
          margin-bottom: 18px;
        }
        .cal-dh {
          text-align: center;
          font-size: 10px;
          font-weight: 700;
          color: var(--steel);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 5px 0 8px;
        }
        .cal-cell {
          aspect-ratio: 1;
          border: 0.5px solid transparent;
          border-radius: 8px;
          padding: 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          cursor: default;
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
          font-size: 12px;
          font-weight: 500;
          color: var(--ink);
          width: 22px;
          height: 22px;
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
          font-size: 11px;
          color: var(--steel);
        }

        /* PANNEAU DESKTOP */
        .desktop-panel {
          background: var(--white);
          border: 0.5px solid var(--line);
          border-radius: 12px;
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
          font-size: 12px;
          line-height: 1.5;
          margin: 0;
          max-width: 180px;
        }

        /* ── BOTTOM SHEET MOBILE ── */
        .sheet-backdrop {
          display: none;
        }
        .bottom-sheet {
          display: none;
        }

        /* ── SESSION CARD AMÉLIORÉE ── */
        .s-card {
          border: 0.5px solid var(--line);
          border-radius: 12px;
          padding: 14px;
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
          font-size: 14px;
          font-weight: 600;
          color: var(--ink);
          margin: 0;
          line-height: 1.35;
        }
        .s-card-loc {
          font-size: 11px;
          color: var(--steel);
          display: flex;
          align-items: center;
          gap: 4px;
          margin: 0;
        }
        .s-badge {
          font-size: 10px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
          white-space: nowrap;
        }
        .s-badge.ouverte { background: rgba(22,163,74,0.12); color: #15803d; }
        .s-badge.complète { background: rgba(220,38,38,0.12); color: #b91c1c; }
        .s-badge.terminée { background: rgba(148,163,184,0.15); color: var(--steel); }
        .s-time { 
          font-size: 11px; 
          color: var(--steel); 
          white-space: nowrap;
          background: var(--mist);
          padding: 2px 8px;
          border-radius: 12px;
        }

        .fill-bar-track {
          height: 6px;
          background: rgba(0,0,0,0.08);
          border-radius: 3px;
          overflow: hidden;
        }
        .fill-bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.4s ease;
        }
        .fill-bar-fill.ouverte { background: linear-gradient(90deg, #16a34a, #22c55e); }
        .fill-bar-fill.complète { background: linear-gradient(90deg, #dc2626, #ef4444); }
        .fill-bar-fill.terminée { background: linear-gradient(90deg, #94a3b8, #cbd5e1); }
        .fill-label {
          font-size: 11px;
          color: var(--steel);
        }
        .s-card-cta {
          display: block;
          text-align: center;
          padding: 10px 16px;
          background: linear-gradient(135deg, var(--blue), var(--blue-deep));
          color: var(--white);
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.2s ease;
          margin-top: 4px;
        }
        .s-card-cta:hover { 
          background: linear-gradient(135deg, var(--blue-deep), var(--blue));
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(30,64,175,0.3);
        }

        /* ── VUE LISTE AMÉLIORÉE ── */
        .list-nav {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
        }
        .sessions-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .list-card {
          display: flex;
          border: 1px solid var(--line);
          border-radius: 14px;
          background: var(--white);
          overflow: hidden;
          transition: all 0.25s ease;
        }
        .list-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
          border-color: var(--orange);
        }
        .list-card.ouverte { border-left: 4px solid #16a34a; }
        .list-card.complète { border-left: 4px solid #dc2626; }
        .list-card.terminée { border-left: 4px solid #94a3b8; opacity: 0.75; }
        .list-date-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 70px;
          padding: 16px 10px;
          background: linear-gradient(135deg, var(--mist), #f0efe8);
          border-right: 1px solid var(--line);
          gap: 4px;
          flex-shrink: 0;
        }
        .list-date-num {
          font-size: 26px;
          font-weight: 700;
          color: var(--blue);
          line-height: 1;
        }
        .list-date-mon {
          font-size: 10px;
          color: var(--steel);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .list-body {
          flex: 1;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }
        .list-top {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .list-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--ink);
          margin: 0;
          line-height: 1.3;
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
          font-size: 11px;
          color: var(--steel);
        }
        .list-cta-inline {
          display: inline-flex;
          align-self: flex-start;
          align-items: center;
          padding: 7px 16px;
          background: linear-gradient(135deg, var(--blue), var(--blue-deep));
          color: var(--white);
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          text-decoration: none;
          margin-top: 6px;
          transition: all 0.2s ease;
        }
        .list-cta-inline:hover { 
          background: linear-gradient(135deg, var(--blue-deep), var(--blue));
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(30,64,175,0.3);
        }

        /* ── ÉTATS ── */
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          padding: 70px 20px;
          color: var(--steel);
          font-size: 13px;
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
          color: var(--steel);
          font-size: 13px;
          text-align: center;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 860px) {
          .cal-layout {
            grid-template-columns: 1fr;
          }
          .desktop-panel {
            display: none;
          }
          /* Bottom sheet activé */
          .sheet-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.4);
            backdrop-filter: blur(4px);
            z-index: 40;
            animation: fadeIn 0.2s ease;
          }
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
          .list-date-block {
            min-width: 60px;
            padding: 12px 8px;
          }
          .list-date-num {
            font-size: 22px;
          }
        }

        @media (max-width: 500px) {
          .sess-wrap {
            padding: 0 14px;
            margin: 36px auto;
          }
          .ctrl-title { font-size: 17px; }
          .vt-btn span { display: none; }
          .vt-btn { padding: 7px 11px; }
          .cal-main { padding: 16px 12px; }
          .cal-grid { gap: 3px; }
          .cal-dh { font-size: 9px; padding: 4px 0 6px; }
          .cal-cell { border-radius: 6px; gap: 2px; }
          .cal-day-num { font-size: 11px; width: 20px; height: 20px; }
          .cal-cell.today .cal-day-num { width: 20px; height: 20px; }
          .dot { width: 4px; height: 4px; }
          .list-title { font-size: 13px; }
          .list-card {
            flex-direction: column;
          }
          .list-date-block {
            flex-direction: row;
            justify-content: space-between;
            padding: 10px 14px;
            border-right: none;
            border-bottom: 0.5px solid var(--line);
          }
          .list-date-num {
            font-size: 16px;
          }
        }
      `}</style>
    </>
  );
}

/* ── Composant SessionCard réutilisable et amélioré ── */
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
  const statusClass = s.status === "complète" ? "complete" : s.status === "terminée" ? "terminee" : "ouverte";
  const places = placesLibres(s);
  
  return (
    <div className={`s-card ${statusClass}`}>
      <div className="s-card-top">
        <span className={`s-badge ${s.status}`}>{statusLabel(s.status)}</span>
        <span className="s-time">{s.startTime} – {s.endTime}</span>
      </div>
      <h4 className="s-card-title">{s.formationTitle}</h4>
      <p className="s-card-loc">
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <path d="M8 1a5 5 0 0 1 5 5c0 3.5-5 9-5 9S3 9.5 3 6a5 5 0 0 1 5-5z" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3" />
        </svg>
        {s.location}
      </p>
      
      {/* Barre de progression améliorée avec indication des places libres */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <div className="fill-bar-track">
          <div className={`fill-bar-fill ${s.status}`} style={{ width: `${fillRate(s)}%` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="fill-label">
            <strong>{s.currentParticipants}</strong> / {s.maxParticipants} participants
          </span>
          {s.status === "ouverte" && (
            <span style={{ 
              fontSize: "12px", 
              background: "rgba(22,163,74,0.1)", 
              color: "#15803d",
              padding: "3px 8px",
              borderRadius: "12px",
              fontWeight: 600
            }}>
              🎯 {places} place{places > 1 ? "s" : ""} restante{places > 1 ? "s" : ""}
            </span>
          )}
          {s.status === "complète" && (
            <span style={{ 
              fontSize: "11px", 
              color: "#b91c1c",
              fontWeight: 500
            }}>
              Complet
            </span>
          )}
          {s.status === "terminée" && (
            <span style={{ 
              fontSize: "11px", 
              color: "var(--steel)"
            }}>
              Session terminée
            </span>
          )}
        </div>
      </div>
      
      {s.status === "ouverte" && (
        <Link
          href={isLoggedIn ? `/training?sessionId=${s.id}` : "/login"}
          className="s-card-cta"
        >
          {places > 0 ? `Réserver (${places} place${places > 1 ? "s" : ""})` : "S'inscrire"}
        </Link>
      )}
    </div>
  );
}