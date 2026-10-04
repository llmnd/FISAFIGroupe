import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import PortalThemeToggle from "@/components/PortalThemeToggle";
import { useRouter } from "next/router";
import type { PointOfSale } from "@/lib/erp/contracts";

type Employee = {
  role: string;
  employeeRole: string | null;
};

function readError(payload: unknown): string {
  return payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
    ? payload.error
    : "Impossible de vérifier le point de vente.";
}

export default function OpenPOSPage() {
  const router = useRouter();
  const posId = typeof router.query.id === "string" ? Number(router.query.id) : NaN;
  const [point, setPoint] = useState<PointOfSale | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [openingAmount, setOpeningAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const operationId = useRef<string | null>(null);
  const mayOpen = employee?.role === "admin" ||
    ["manager", "cashier"].includes(employee?.employeeRole || "");

  useEffect(() => {
    if (!router.isReady || !Number.isSafeInteger(posId) || posId < 1) return;
    const token = localStorage.getItem("token");
    if (!token) {
      void router.replace("/login");
      return;
    }

    let cancelled = false;
    void Promise.all([
      fetch("/api/employee/pos", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("/api/employee/me", { headers: { Authorization: `Bearer ${token}` } }),
    ]).then(async ([posResponse, employeeResponse]) => {
      const [posPayload, employeePayload]: [unknown, unknown] = await Promise.all([
        posResponse.json(),
        employeeResponse.json(),
      ]);
      if (posResponse.status === 401 || employeeResponse.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        await router.replace("/login?session=expired");
        return;
      }
      if (!posResponse.ok) throw new Error(readError(posPayload));
      if (!employeeResponse.ok) throw new Error(readError(employeePayload));
      if (
        !posPayload || typeof posPayload !== "object" || !("pointsOfSale" in posPayload) ||
        !Array.isArray(posPayload.pointsOfSale) ||
        !employeePayload || typeof employeePayload !== "object" || !("employee" in employeePayload)
      ) {
        throw new Error("Les données reçues sont invalides.");
      }
      if (cancelled) return;
      const selected = (posPayload.pointsOfSale as PointOfSale[]).find((candidate) => candidate.id === posId);
      if (!selected) throw new Error("Ce point de vente n’existe pas ou n’est pas accessible.");
      setPoint(selected);
      setEmployee(employeePayload.employee as Employee);
      if (selected.session) {
        setError("Une session est déjà référencée pour ce point de vente. Son état doit être vérifié avant toute nouvelle ouverture.");
      }
    }).catch((loadError: unknown) => {
      if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Impossible de charger le point de vente.");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [posId, router, router.isReady]);

  const openSession = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!point || !mayOpen || submitting) return;
    const amount = Number(openingAmount);
    if (!Number.isSafeInteger(amount) || amount < 0) {
      setError("Saisissez un montant initial entier positif ou nul.");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      await router.replace("/login");
      return;
    }
    operationId.current ||= crypto.randomUUID();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/employee/pos/${point.id}/open`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operationId: operationId.current,
          openingAmount: amount,
        }),
      });
      const payload: unknown = await response.json();
      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        await router.replace("/login?session=expired");
        return;
      }
      if (!response.ok) throw new Error(readError(payload));
      operationId.current = null;
      await router.replace(`/espace-employe/pos/${point.id}`);
    } catch (requestError) {
      setError(requestError instanceof Error
        ? requestError.message
        : "Impossible de confirmer l’ouverture. Vérifiez l’état de la caisse avant de réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Ouvrir une caisse — FiSAFi Groupe</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="employee-portal-page employee-open">
        <header className="employee-open-header">
          <Link href="/espace-employe/points-de-vente" className="employee-open-link">← Points de vente</Link>
          <strong className="employee-open-brand">FiSAFi POS</strong>
          <PortalThemeToggle />
          <Link href="/" className="employee-portal-home-link">Accueil</Link>
        </header>
        <section className="employee-open-content">
          <p className="employee-open-eyebrow">Démarrage de session</p>
          <h1 className="employee-open-title">Ouvrir la caisse</h1>
          {loading ? (
            <p className="employee-open-notice">Vérification du point de vente et de vos permissions…</p>
          ) : (
            <>
              {point && (
                <article className="employee-open-pointCard">
                  <span className="employee-open-label">Point de vente sélectionné</span>
                  <strong className="employee-open-pointName">{point.name}</strong>
                  <span className="employee-open-location">{point.location || "Lieu non précisé"}</span>
                  <span className="employee-open-status">État : {point.active ? "Actif" : "Inactif"}</span>
                </article>
              )}
              {error && <p role="alert" className="employee-open-error">{error}</p>}
              {!error && point && !point.active && (
                <p role="alert" className="employee-open-error">Ce point de vente est inactif et ne peut pas être ouvert.</p>
              )}
              {!mayOpen && employee && (
                <p role="alert" className="employee-open-error">L’ouverture de caisse est réservée aux responsables, caissiers et administrateurs.</p>
              )}
              <form className="employee-open-formCard" onSubmit={(event) => void openSession(event)}>
                <label htmlFor="opening-amount" className="employee-open-label">Montant initial (FCFA)</label>
                <input
                  id="opening-amount"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={openingAmount}
                  onChange={(event) => {
                    setOpeningAmount(event.target.value);
                    setError("");
                  }}
                  placeholder="Ex. 50 000"
                  className="employee-open-input"
                  disabled={!mayOpen || !point?.active || !!point?.session || submitting}
                />
                <p className="employee-open-hint">Le montant doit être un nombre entier positif ou nul.</p>
                <p className="employee-open-hint">
                  L’ouverture est enregistrée dans Odoo avec une clé de reprise pour éviter de créer deux sessions si la connexion est interrompue.
                </p>
                <button
                  type="submit"
                  disabled={!mayOpen || !point?.active || !!point?.session || submitting || openingAmount === ""}
                  className={`employee-open-button ${(!mayOpen || !point?.active || !!point?.session || submitting || openingAmount === "") ? "is-disabled" : ""}`}
                >
                  {submitting ? "Ouverture en cours…" : "Ouvrir la caisse"}
                </button>
              </form>
            </>
          )}
        </section>
      </main>
    </>
  );
}
