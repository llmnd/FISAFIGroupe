"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
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
  status: 'ouverte' | 'complète' | 'terminée';
}

export default function SessionsPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);

  // Helper pour construire URLs avec backend
  const buildApiUrl = (endpoint: string) => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
    return backendUrl ? `${backendUrl}${endpoint}` : endpoint;
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  // Fetch sessions
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch(buildApiUrl("/api/sessions"));
      if (res.ok) {
        const data = await res.json();
        const sessionsList = Array.isArray(data) ? data : data.data || [];
        setSessions(sessionsList);
        filterSessionsByMonth(sessionsList, selectedMonth);
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterSessionsByMonth = (allSessions: Session[], month: Date) => {
    const filtered = allSessions.filter((session) => {
      const sessionDate = new Date(session.startDate);
      return (
        sessionDate.getMonth() === month.getMonth() &&
        sessionDate.getFullYear() === month.getFullYear()
      );
    });
    setFilteredSessions(filtered);
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getSessionsForDay = (day: number) => {
    return filteredSessions.filter((session) => {
      const sessionDate = new Date(session.startDate);
      return sessionDate.getDate() === day;
    });
  };

  const previousMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1));
  };

  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedMonth);
    const firstDay = getFirstDayOfMonth(selectedMonth);
    const days = [];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const daySessions = getSessionsForDay(day);
      days.push(
        <div key={day} className="calendar-day">
          <div className="day-number">{day}</div>
          <div className="day-sessions">
            {daySessions.slice(0, 2).map((session) => (
              <div key={session.id} className={`session-badge ${session.status}`}>
                {session.formationTitle.substring(0, 15)}
              </div>
            ))}
            {daySessions.length > 2 && (
              <div className="session-more">+{daySessions.length - 2}</div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <>
      <Head>
        <title>Calendrier des Sessions — FiSAFi Groupe</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Header />

      {/* HERO */}
      <section className="hero" style={{ height: "300px" }}>
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 className="hero-title">Calendrier des Sessions</h1>
          <p className="hero-sub">Découvrez nos sessions de formation et inscrivez-vous facilement</p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="section sessions-section">
        <div className="sessions-header">
          <h2>Nos Sessions</h2>
          <div className="view-toggle">
            <button
              className={`toggle-btn ${view === 'calendar' ? 'active' : ''}`}
              onClick={() => setView('calendar')}
            >
              📅 Calendrier
            </button>
            <button
              className={`toggle-btn ${view === 'list' ? 'active' : ''}`}
              onClick={() => setView('list')}
            >
              📋 Liste
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading">Chargement des sessions...</div>
        ) : (
          <>
            {view === 'calendar' ? (
              // CALENDAR VIEW
              <div className="calendar-container">
                <div className="calendar-controls">
                  <button onClick={previousMonth}>← Précédent</button>
                  <h3>{monthNames[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}</h3>
                  <button onClick={nextMonth}>Suivant →</button>
                </div>

                <div className="calendar">
                  <div className="calendar-header">
                    {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map((day) => (
                      <div key={day} className="calendar-day-header">{day}</div>
                    ))}
                  </div>
                  <div className="calendar-days">
                    {renderCalendar()}
                  </div>
                </div>

                <div className="legend">
                  <div className="legend-item">
                    <span className="badge ouverte"></span> Session ouverte
                  </div>
                  <div className="legend-item">
                    <span className="badge complète"></span> Session complète
                  </div>
                  <div className="legend-item">
                    <span className="badge terminée"></span> Session terminée
                  </div>
                </div>
              </div>
            ) : (
              // LIST VIEW
              <div className="sessions-list">
                {filteredSessions.length === 0 ? (
                  <p className="no-sessions">Aucune session en {monthNames[selectedMonth.getMonth()]}</p>
                ) : (
                  filteredSessions.map((session) => (
                    <div key={session.id} className={`session-card ${session.status}`}>
                      <div className="session-date">
                        <div className="date-value">{new Date(session.startDate).getDate()}</div>
                        <div className="date-month">{monthNames[new Date(session.startDate).getMonth()]}</div>
                      </div>
                      <div className="session-info">
                        <h3>{session.formationTitle}</h3>
                        <p className="session-time">
                          🕐 {session.startTime} - {session.endTime}
                        </p>
                        <p className="session-location">📍 {session.location}</p>
                        <p className="session-capacity">
                          👥 {session.currentParticipants}/{session.maxParticipants} participants
                        </p>
                      </div>
                      <div className="session-status">
                        <span className={`status-badge ${session.status}`}>
                          {session.status === 'ouverte' ? '✓ Ouverte' : session.status === 'complète' ? '✕ Complète' : 'Terminée'}
                        </span>
                        {session.status === 'ouverte' && (
                          <Link href={isLoggedIn ? `/training?sessionId=${session.id}` : '/login'} className="btn-secondary">
                            S'inscrire
                          </Link>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </section>

      {/* FOOTER */}
      <footer>
        <div>
          <div className="foot-logo">Fi<span>SAFI</span> Groupe</div>
          <div className="foot-tagline">L'expertise qui fait la différence</div>
        </div>
        <div className="foot-bottom">
          <div className="foot-copy">© 2025 FISAFI Groupe. Tous droits réservés.</div>
          <a href="https://www.fisafigroupe.com" className="foot-web">fisafigroupe.com</a>
        </div>
      </footer>

      <style jsx>{`
        .sessions-section {
          max-width: 1200px;
          margin: 60px auto;
          padding: 0 20px;
        }

        .sessions-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
        }

        .view-toggle {
          display: flex;
          gap: 10px;
        }

        .toggle-btn {
          padding: 10px 20px;
          border: 2px solid #1e40af;
          background: white;
          color: #1e40af;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s;
        }

        .toggle-btn.active {
          background: #1e40af;
          color: white;
        }

        .calendar-container {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .calendar-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .calendar-controls button {
          padding: 10px 20px;
          background: #1e40af;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }

        .calendar {
          margin-bottom: 30px;
        }

        .calendar-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 10px;
          margin-bottom: 10px;
        }

        .calendar-day-header {
          text-align: center;
          font-weight: 600;
          color: #1e40af;
          padding: 10px 0;
        }

        .calendar-days {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 10px;
        }

        .calendar-day {
          min-height: 100px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 10px;
          background: #f9fafb;
        }

        .calendar-day.empty {
          background: #f5f5f5;
        }

        .day-number {
          font-weight: 600;
          color: #1e40af;
          margin-bottom: 8px;
        }

        .day-sessions {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .session-badge {
          font-size: 11px;
          padding: 4px 6px;
          border-radius: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .session-badge.ouverte {
          background: #dcfce7;
          color: #166534;
        }

        .session-badge.complète {
          background: #fee2e2;
          color: #991b1b;
        }

        .session-badge.terminée {
          background: #f3f4f6;
          color: #374151;
        }

        .session-more {
          font-size: 11px;
          color: #6b7280;
          font-weight: 500;
        }

        .legend {
          display: flex;
          gap: 30px;
          justify-content: center;
          padding: 20px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .badge {
          width: 16px;
          height: 16px;
          border-radius: 3px;
        }

        .badge.ouverte {
          background: #dcfce7;
        }

        .badge.complète {
          background: #fee2e2;
        }

        .badge.terminée {
          background: #f3f4f6;
        }

        .sessions-list {
          display: grid;
          gap: 20px;
        }

        .session-card {
          display: flex;
          gap: 20px;
          padding: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          transition: all 0.3s;
        }

        .session-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .session-date {
          text-align: center;
          min-width: 70px;
          padding: 10px;
          background: #f3f4f6;
          border-radius: 6px;
        }

        .date-value {
          font-size: 24px;
          font-weight: 700;
          color: #1e40af;
        }

        .date-month {
          font-size: 12px;
          color: #6b7280;
        }

        .session-info {
          flex: 1;
        }

        .session-info h3 {
          margin: 0 0 10px 0;
          color: #1f2937;
        }

        .session-info p {
          margin: 6px 0;
          color: #6b7280;
          font-size: 14px;
        }

        .session-status {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: center;
          gap: 10px;
        }

        .status-badge {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
        }

        .status-badge.ouverte {
          background: #dcfce7;
          color: #166534;
        }

        .status-badge.complète {
          background: #fee2e2;
          color: #991b1b;
        }

        .status-badge.terminée {
          background: #f3f4f6;
          color: #374151;
        }

        .btn-secondary {
          padding: 8px 16px;
          background: #1e40af;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          text-decoration: none;
          font-size: 13px;
        }

        .loading {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }

        .no-sessions {
          text-align: center;
          padding: 40px 20px;
          color: #6b7280;
        }

        @media (max-width: 768px) {
          .sessions-header {
            flex-direction: column;
            gap: 20px;
          }

          .calendar-days {
            grid-template-columns: repeat(7, 1fr);
          }

          .calendar-day {
            min-height: 80px;
            padding: 8px;
          }

          .session-card {
            flex-direction: column;
          }

          .session-status {
            align-items: flex-start;
          }

          .legend {
            flex-direction: column;
            gap: 15px;
          }
        }
      `}</style>
    </>
  );
}
