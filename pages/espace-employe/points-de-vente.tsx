import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import EmployeePortalHeader from "@/components/EmployeePortalHeader";
import { useRouter } from "next/router";
import type { PointOfSale } from "@/lib/erp/contracts";

type SessionStatus = NonNullable<PointOfSale["session"]>["status"];
const sessionLabels: Record<SessionStatus, string> = {
  opened: "Ouverte",
  opening_control: "Contrôle d’ouverture",
  closing_control: "Contrôle de fermeture",
  closed: "Fermée",
  unknown: "État inconnu",
};

export default function EmployeePointsOfSalePage() {
  const router = useRouter();
  const [pointsOfSale, setPointsOfSale] = useState<PointOfSale[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadPointsOfSale = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/employee/points-de-vente");
      const payload = await response.json();
      if (response.status === 401) {
        localStorage.removeItem("user");
        void fetch("/api/auth/logout", { method: "POST" });
        await router.replace("/login?session=expired");
        return;
      }
      if (!response.ok) throw new Error(payload.error || "Impossible de charger les points de vente.");
      setPointsOfSale(payload.pointsOfSale);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (router.isReady) void loadPointsOfSale();
  }, [router.isReady, loadPointsOfSale]);

  return (
    <>
      <Head>
        <title>Points de vente — Espace employé FiSAFi</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="employee-portal-page employee-points">
        <EmployeePortalHeader
          pageClassName="employee-points-header"
          title="Points de vente"
          backHref="/espace-employe"
          backLabel="Espace employé"
        />
        <section className="employee-points-content">
          <p className="employee-points-eyebrow">Opérations</p>
          <h1 className="employee-points-title">Points de vente</h1>
          <p className="employee-points-subtitle">État actuel synchronisé depuis Odoo.</p>
          <div className="employee-points-toolbar">
            <Link href="/espace-employe" className="employee-points-back">← Retour au tableau de bord</Link>
            <button type="button" onClick={() => void loadPointsOfSale()} disabled={loading} className="employee-points-refresh">
              {loading ? "Actualisation…" : "Actualiser"}
            </button>
          </div>
          {error && <p role="alert" className="employee-points-error">{error}</p>}
          {loading ? (
            <p className="employee-points-empty">Chargement des points de vente…</p>
          ) : !error && pointsOfSale.length === 0 ? (
            <p className="employee-points-empty">Aucun point de vente n’est disponible pour le moment.</p>
          ) : (
            <div className="employee-points-grid">
              {pointsOfSale.map((point) => {
                const session = point.session;
                const sessionStatus = session ? sessionLabels[session.status] : "Aucune session";
                return (
                  <article key={point.id} className="employee-points-card">
                    <div className="employee-points-cardHeader">
                      <div>
                        <h2 className="employee-points-cardTitle">{point.name}</h2>
                        <p className="employee-points-location">{point.location || "Lieu non précisé"}</p>
                      </div>
                      <span className={`employee-points-active-badge ${point.active ? "employee-points-active" : "employee-points-inactive"}`}>
                        {point.active ? "Actif" : "Inactif"}
                      </span>
                    </div>
                    <div className="employee-points-sessionRow">
                      <span className="employee-points-sessionLabel">Session de caisse</span>
                      <strong className="employee-points-sessionStatus">{sessionStatus}</strong>
                    </div>
                    {session && (
                      <dl className="employee-points-details">
                        <div><dt>Session</dt><dd>{session.name}</dd></div>
                        <div><dt>Responsable</dt><dd>{session.responsible || "Non attribué"}</dd></div>
                        <div><dt>Démarrée le</dt><dd>{session.startedAt ? new Date(session.startedAt).toLocaleString("fr-FR") : "Non renseigné"}</dd></div>
                      </dl>
                    )}
                    <div className="employee-points-actions">
                      {session?.status === "opened" ? (
                        <>
                          <Link href={`/espace-employe/pos/${point.id}`} className="employee-points-primaryLink">
                            Continuer la caisse
                          </Link>
                          <Link
                            href={`/espace-employe/pos/${point.id}/fermer?sessionId=${session.id}`}
                            className="employee-points-secondaryLink"
                          >
                            Clôturer
                          </Link>
                        </>
                      ) : !session ? (
                        <Link href={`/espace-employe/pos/${point.id}/ouvrir`} className="employee-points-secondaryLink">
                          Ouvrir la caisse
                        </Link>
                      ) : (
                        <span className="employee-points-sessionWarning">État de caisse à vérifier avant toute action.</span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          <p className="employee-points-note">Les ouvertures, ventes et clôtures sont transmises à Odoo après vérification des permissions et des montants côté serveur.</p>
        </section>
      </main>
    </>
  );
}
