import { type ReactNode } from "react";
import Link from "next/link";
import PortalThemeToggle from "@/components/PortalThemeToggle";

type EmployeePortalHeaderProps = {
  pageClassName: string;
  title: string;
  backHref?: string;
  backLabel?: string;
  context?: ReactNode;
  children?: ReactNode;
};

export default function EmployeePortalHeader({
  pageClassName,
  title,
  backHref,
  backLabel = "Espace employé",
  context,
  children,
}: EmployeePortalHeaderProps) {
  return (
    <header className={`employee-portal-header ${pageClassName}`}>
      <div className="employee-portal-header-page">
        <span className="employee-portal-header-page-label">FiSAFi · Espace employé</span>
        <strong>{title}</strong>
      </div>

      {context && <div className="employee-portal-header-context">{context}</div>}

      <nav className="employee-portal-header-actions" aria-label="Navigation de l’espace employé">
        {children}
        <PortalThemeToggle />
        <Link href="/" className="employee-portal-header-button employee-portal-header-home">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="m3 10 9-7 9 7" />
            <path d="M5 9v11h14V9M9 20v-6h6v6" />
          </svg>
          <span>Accueil</span>
        </Link>
        {backHref && (
          <Link href={backHref} className="employee-portal-header-button employee-portal-header-back">
            <span aria-hidden="true">←</span>
            <span className="employee-portal-header-back-label">{backLabel}</span>
          </Link>
        )}
      </nav>
    </header>
  );
}
