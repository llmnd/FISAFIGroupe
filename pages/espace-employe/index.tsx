import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import EmployeePortalHeader from "@/components/EmployeePortalHeader";

type EmployeeProfile = {
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  employeeRole: string | null;
};

const roleLabels: Record<string, string> = {
  manager: "Responsable",
  seller: "Vendeur",
  cashier: "Caissier",
  stock: "Gestionnaire de stock",
  accountant: "Comptable",
};

export default function EmployeeHomePage() {
  const router = useRouter();
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady) return;

    void fetch("/api/employee/me")
      .then(async (response) => {
        const payload = await response.json();
        if (response.status === 401) {
          localStorage.removeItem("user");
          void fetch("/api/auth/logout", { method: "POST" });
          await router.replace("/login?session=expired");
          return;
        }
        if (!response.ok) throw new Error(payload.error || "Impossible de charger votre espace.");
        setEmployee(payload.employee);
      })
      .catch((requestError: unknown) => {
        setError(requestError instanceof Error ? requestError.message : "Une erreur est survenue.");
      })
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <>
      <Head>
        <title>Espace employé — FiSAFi Groupe</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="employee-portal-page employee-home">
        <EmployeePortalHeader pageClassName="employee-home-header" title="Accueil">
          {employee?.role === "admin" && <Link href="/admin-dashboard" className="employee-portal-header-extra">Administration</Link>}
          <button
            className="employee-portal-header-extra employee-portal-header-logout"
            onClick={() => {
              localStorage.removeItem("user");
              void fetch("/api/auth/logout", { method: "POST" }).finally(() => router.replace("/login"));
            }}
          >
            Se déconnecter
          </button>
        </EmployeePortalHeader>

        <section className="employee-home-content">
          {loading ? (
            <div className="employee-home-loading"><span className="employee-home-eyebrow">Portail professionnel</span><p className="employee-home-message">Chargement de votre compte…</p></div>
          ) : error ? (
            <p role="alert" className="employee-home-error">{error}</p>
          ) : employee ? (
            <>
              <div className="employee-home-hero">
                <div className="employee-home-hero-content">
                  <p className="employee-home-eyebrow">Portail professionnel</p>
                  <p className="employee-home-welcome">Bonjour, {[employee.firstName, employee.lastName].filter(Boolean).join(" ") || employee.email}.</p>
                </div>
                <div className="employee-home-role">
                  <span className="employee-home-role-dot" />
                  {employee.role === "admin" ? "Administrateur" : roleLabels[employee.employeeRole || ""] || "Employé"}
                </div>
              </div>
              <div className="employee-home-section-heading">
                <div><p className="employee-home-section-kicker">Accès rapide</p><h2>Vos outils</h2></div>
                <span className="employee-home-section-note">Services connectés à FiSAFi</span>
              </div>
              <div className="employee-home-card-grid">
                <Link href="/espace-employe/points-de-vente" className="employee-tool-card">
                  <span className="employee-home-card-icon" aria-hidden="true"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="4" width="8" height="7" rx="1.5"/><rect x="13" y="4" width="8" height="7" rx="1.5"/><rect x="3" y="13" width="8" height="7" rx="1.5"/><rect x="13" y="13" width="8" height="7" rx="1.5"/></svg></span>
                  <span className="employee-home-card-title">Points de vente</span>
                  <span className="employee-home-card-text">Suivez l’état des caisses Odoo et accédez aux opérations autorisées.</span>
                  <span className="employee-card-link employee-home-card-link">Afficher les points de vente →</span>
                </Link>
                {["admin", "manager", "seller", "stock", "accountant"].includes(employee.role) ||
                ["manager", "seller", "stock", "accountant"].includes(employee.employeeRole || "") ? (
                  <Link href="/espace-employe/produits" className="employee-tool-card">
                    <span className="employee-home-card-icon employee-home-card-icon-green" aria-hidden="true"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="m3 7 9-4 9 4-9 4-9-4Z"/><path d="m3 12 9 4 9-4M3 17l9 4 9-4"/></svg></span>
                    <span className="employee-home-card-title">Catalogue produits</span>
                    <span className="employee-home-card-text">Consultez les produits Odoo, leurs prix, leur stock et leur disponibilité.</span>
                    <span className="employee-card-link employee-home-card-link">Ouvrir le catalogue →</span>
                  </Link>
                ) : null}
                {employee.role === "admin" && (
                  <Link href="/espace-employe/ventes" className="employee-tool-card">
                    <span className="employee-home-card-icon employee-home-card-icon-orange" aria-hidden="true"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h8"/></svg></span>
                    <span className="employee-home-card-title">Ventes, devis et commandes</span>
                    <span className="employee-home-card-text">Consultez les commandes Odoo, créez des devis et gérez leur confirmation.</span>
                    <span className="employee-card-link employee-home-card-link">Ouvrir le module ventes →</span>
                  </Link>
                )}
                {employee.role === "admin" && (
                  <Link href="/admin-dashboard" className="employee-tool-card">
                    <span className="employee-home-card-icon employee-home-card-icon-green" aria-hidden="true"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.4.8l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.4-.8l-1.7.6-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.6l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.4-.8l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.4.8l1.7-.6 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.6Z"/></svg></span>
                    <span className="employee-home-card-title">Administration FiSAFi</span>
                    <span className="employee-home-card-text">Gérez les utilisateurs, les formations et les contenus du portail FiSAFi.</span>
                    <span className="employee-card-link employee-home-card-link">Ouvrir l’administration →</span>
                  </Link>
                )}
              </div>
              <div className="employee-home-footer-note"><span className="employee-home-note-mark">i</span><p>Les données et opérations disponibles dépendent de vos droits FiSAFi et de la configuration Odoo.</p></div>
            </>
          ) : null}
        </section>
      </main>
    </>
  );
}
