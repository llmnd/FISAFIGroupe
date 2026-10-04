import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import PortalThemeToggle from "@/components/PortalThemeToggle";
import { useRouter } from "next/router";
import type { POSClosingSummary } from "@/lib/erp/contracts";

function errorMessage(payload: unknown): string {
  return payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
    ? payload.error
    : "Impossible de vérifier la clôture de caisse.";
}

function money(amount: number): string {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount)} FCFA`;
}

export default function ClosePOSPage() {
  const router = useRouter();
  const configId = typeof router.query.id === "string" ? Number(router.query.id) : NaN;
  const sessionId = typeof router.query.sessionId === "string" ? Number(router.query.sessionId) : NaN;
  const [summary, setSummary] = useState<POSClosingSummary | null>(null);
  const [countedAmounts, setCountedAmounts] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const operationId = useRef<string | null>(null);

  useEffect(() => {
    if (
      !router.isReady ||
      !Number.isSafeInteger(configId) ||
      configId < 1 ||
      !Number.isSafeInteger(sessionId) ||
      sessionId < 1
    ) {
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      void router.replace("/login");
      return;
    }
    let cancelled = false;
    void fetch(`/api/employee/pos/${configId}/close?sessionId=${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(async (response) => {
      const payload: unknown = await response.json();
      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        await router.replace("/login?session=expired");
        return;
      }
      if (!response.ok) throw new Error(errorMessage(payload));
      const summaryPayload: unknown =
        payload && typeof payload === "object" && "summary" in payload
          ? payload.summary
          : null;
      if (
        !summaryPayload ||
        typeof summaryPayload !== "object" ||
        !("sessionId" in summaryPayload) ||
        typeof summaryPayload.sessionId !== "number" ||
        !("cashControl" in summaryPayload) ||
        typeof summaryPayload.cashControl !== "boolean" ||
        !("methods" in summaryPayload) ||
        !Array.isArray(summaryPayload.methods) ||
        !summaryPayload.methods.every((method: unknown) =>
          !!method &&
          typeof method === "object" &&
          "id" in method && Number.isSafeInteger(method.id) &&
          "name" in method && typeof method.name === "string" &&
          "type" in method && (method.type === "cash" || method.type === "bank") &&
          "expectedAmount" in method && typeof method.expectedAmount === "number"
        )
      ) {
        throw new Error("Le récapitulatif de clôture reçu est invalide.");
      }
      if (cancelled) return;
      const result = summaryPayload as POSClosingSummary;
      setSummary(result);
      setCountedAmounts(Object.fromEntries(
        result.methods
          .filter((method) => method.type === "bank" || result.cashControl)
          .map((method) => [method.id, ""]),
      ));
    }).catch((requestError: unknown) => {
      if (!cancelled) setError(
        requestError instanceof Error ? requestError.message : "Impossible de charger le récapitulatif.",
      );
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [configId, router, router.isReady, sessionId]);

  const submitClose = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!summary || submitting) return;
    const counts: Record<number, number> = {};
    for (const [id, rawAmount] of Object.entries(countedAmounts)) {
      const amount = Number(rawAmount);
      if (rawAmount.trim() === "" || !Number.isFinite(amount) || amount < 0) {
        setError("Saisissez le montant réellement compté pour chaque moyen de paiement.");
        return;
      }
      counts[Number(id)] = amount;
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
      const response = await fetch(`/api/employee/pos/${configId}/close`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operationId: operationId.current,
          sessionId: summary.sessionId,
          countedAmounts: counts,
        }),
      });
      const payload: unknown = await response.json();
      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        await router.replace("/login?session=expired");
        return;
      }
      if (!response.ok) throw new Error(errorMessage(payload));
      operationId.current = null;
      await router.replace("/espace-employe/points-de-vente");
    } catch (requestError) {
      setError(requestError instanceof Error
        ? requestError.message
        : "Odoo n’a pas confirmé la clôture. Actualisez l’état de la caisse avant de réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Clôturer la caisse — FiSAFi Groupe</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="employee-portal-page employee-close">
        <header className="employee-close-header">
          <Link href="/espace-employe/points-de-vente" className="employee-close-link">← Points de vente</Link>
          <strong className="employee-close-brand">FiSAFi POS</strong>
          <PortalThemeToggle />
          <Link href="/" className="employee-portal-home-link">Accueil</Link>
        </header>
        <section className="employee-close-content">
          <p className="employee-close-eyebrow">Fin de session</p>
          <h1 className="employee-close-title">Clôturer la caisse</h1>
          {loading ? (
            <p className="employee-close-notice">Récupération des montants attendus depuis Odoo…</p>
          ) : (
            <>
              {error && <p role="alert" className="employee-close-error">{error}</p>}
              {summary && (
                <form className="employee-close-card" onSubmit={(event) => void submitClose(event)}>
                  <p className="employee-close-intro">
                    Comparez chaque montant attendu avec le montant réellement compté. Odoo conserve le détail et valide la clôture.
                  </p>
                  {summary.methods
                    .filter((method) => method.type === "bank" || summary.cashControl)
                    .map((method) => (
                      <label key={method.id} className="employee-close-method">
                        <span>
                          <strong>{method.name}</strong>
                          <small>Attendu dans Odoo : {money(method.expectedAmount)}</small>
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          required
                          value={countedAmounts[method.id] ?? ""}
                          onChange={(event) => setCountedAmounts((current) => ({
                            ...current,
                            [method.id]: event.target.value,
                          }))}
                          className="employee-close-input"
                          disabled={submitting}
                        />
                      </label>
                    ))}
                  {!summary.cashControl && (
                    <p className="employee-close-notice">
                      Le contrôle d’espèces est désactivé dans Odoo ; seuls les montants des moyens de paiement bancaires sont rapprochés.
                    </p>
                  )}
                  <button type="submit" disabled={submitting} className={`employee-close-button ${submitting ? "is-disabled" : ""}`}>
                    {submitting ? "Clôture en cours dans Odoo…" : "Confirmer la clôture"}
                  </button>
                </form>
              )}
            </>
          )}
        </section>
      </main>
    </>
  );
}
