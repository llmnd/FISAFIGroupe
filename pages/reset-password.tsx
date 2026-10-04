import { useState } from "react";
import type { FormEvent } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

export default function ResetPasswordPage() {
  const router = useRouter();
  const token = typeof router.query.token === "string" ? router.query.token : "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password !== confirmation) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const payload: { error?: string; message?: string } = await response.json();
      if (!response.ok) {
        setError(payload.error || "Le lien n’est pas valide ou a expiré.");
        return;
      }
      setMessage(payload.message || "Mot de passe réinitialisé.");
    } catch (requestError) {
      console.error("[Auth] Could not reset password:", requestError);
      setError("Impossible de contacter le service. Réessayez dans quelques instants.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Réinitialiser mon mot de passe — FiSAFi Groupe</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "1.5rem", background: "#f5f4f0", fontFamily: "Arial, sans-serif" }}>
        <section style={{ width: "min(100%, 440px)", padding: "2rem", background: "#fff", boxShadow: "0 12px 40px rgba(11,24,41,0.1)" }}>
          <h1 style={{ color: "#0b1829", margin: "0 0 0.75rem" }}>Choisir un nouveau mot de passe</h1>
          <p style={{ color: "#64748b", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            Le nouveau mot de passe doit contenir au moins 8 caractères.
          </p>
          {error && <p role="alert" style={{ color: "#b42318" }}>{error}</p>}
          {message ? (
            <div role="status">
              <p style={{ color: "#067647", lineHeight: 1.6 }}>{message}</p>
              <Link href="/login">Se connecter</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
              <label style={{ display: "grid", gap: "0.4rem", color: "#0b1829" }}>
                Nouveau mot de passe
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  style={{ padding: "0.8rem", border: "1px solid #cbd5e1", font: "inherit" }}
                />
              </label>
              <label style={{ display: "grid", gap: "0.4rem", color: "#0b1829" }}>
                Confirmer le mot de passe
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  required
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  style={{ padding: "0.8rem", border: "1px solid #cbd5e1", font: "inherit" }}
                />
              </label>
              <button
                type="submit"
                disabled={submitting || !token}
                style={{ padding: "0.9rem", border: 0, background: "#0b1829", color: "#fff", cursor: "pointer", font: "inherit" }}
              >
                {submitting ? "Enregistrement…" : "Réinitialiser le mot de passe"}
              </button>
              {!token && router.isReady && <p role="alert" style={{ color: "#b42318" }}>Le lien de réinitialisation est incomplet.</p>}
            </form>
          )}
        </section>
      </main>
    </>
  );
}
