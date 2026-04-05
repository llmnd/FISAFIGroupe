"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const IconHome = () => (
  <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
    <path d="M10.5 1.5H3a1.5 1.5 0 0 0-1.5 1.5v16.5a1.5 1.5 0 0 0 1.5 1.5h18a1.5 1.5 0 0 0 1.5-1.5V9.5a1.5 1.5 0 0 0-1.5-1.5h-9V1.5Z"/>
  </svg>
);

const IconMail = () => (
  <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
    <rect x="1.5" y="3.75" width="21" height="16.5" rx="1.5" ry="1.5"/>
    <path d="M1.5 5.25L12 13.5l10.5-8.25"/>
  </svg>
);

const IconServices = () => (
  <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
  </svg>
);

const IconNews = () => (
  <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
    <rect x="2" y="3" width="20" height="18" rx="1.5"/>
    <circle cx="6" cy="9" r="1.5"/>
    <circle cx="6" cy="16" r="1.5"/>
    <path d="M10 8h10M10 15h10"/>
  </svg>
);

const IconTraining = () => (
  <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
    <path d="M12 2L2 7v10a8 8 0 0 0 10 7.73 8 8 0 0 0 10-7.73V7l-10-5Z"/>
  </svg>
);

interface FloatingAction {
  icon: React.ReactNode;
  label: string;
  href: string;
  color: string;
}

const ACTIONS: FloatingAction[] = [
  { icon: <IconHome />, label: "Accueil", href: "/", color: "#E8580A" },
  { icon: <IconServices />, label: "Services", href: "/services", color: "#FF7235" },
  { icon: <IconTraining />, label: "Formation", href: "/training", color: "#F59052" },
  { icon: <IconNews />, label: "Actualités", href: "/news", color: "#EC6B1F" },
  { icon: <IconMail />, label: "Contact", href: "/contact", color: "#D94B05" },
];

export default function FloatingLogo() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Logo Button */}
      <div className="floating-logo-container">
        <button
          className={`floating-logo-btn${isOpen ? " active" : ""}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Menu rapide"
          aria-expanded={isOpen}
        >
          <Image
            src="/logo.jpeg"
            alt="FiSAFi"
            width={56}
            height={56}
            priority
            className="floating-logo-img"
          />
          <span className={`floating-logo-indicator${isOpen ? " active" : ""}`} aria-hidden="true" />
        </button>

        {/* Actions Menu */}
        {isOpen && (
          <div className="floating-actions-menu">
            {ACTIONS.map((action, index) => (
              <Link
                key={action.label}
                href={action.href}
                className="floating-action-item"
                style={{
                  "--action-index": index,
                  "--action-color": action.color,
                } as React.CSSProperties}
                onClick={() => setIsOpen(false)}
                title={action.label}
              >
                <div className="floating-action-icon">
                  {action.icon}
                </div>
                <span className="floating-action-label">{action.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="floating-backdrop"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
