import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";

type SessionRegistration = {
  id: string;
  formationId: string;
  formationTitle: string;
  startDate: string;
  registrationDeadline: string;
  location: string;
};

type Props = {
  session: SessionRegistration;
  placesAvailable: number;
};

export default function SessionRegistrationButton({ session, placesAvailable }: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open, submitting]);

  const submitRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/v1/inscriptions-formations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          formationId: Number(session.formationId),
          sessionId: Number(session.id),
        }),
      });
      const payload: unknown = response.headers.get("content-type")?.includes("application/json")
        ? await response.json()
        : null;
      const errorMessage =
        payload && typeof payload === "object" && "error" in payload &&
        typeof payload.error === "string"
          ? payload.error
          : "Impossible de traiter votre demande. Veuillez réessayer.";

      if (!response.ok) throw new Error(errorMessage);
      setMessage({
        type: "success",
        text: "Votre demande est enregistrée. Nous vous contacterons très bientôt.",
      });
      form.reset();
    } catch (error) {
      console.error("[Sessions/Registration] Registration failed:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Une erreur est survenue. Veuillez réessayer.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const close = () => {
    setOpen(false);
    setMessage(null);
  };

  return (
    <>
      <button
        type="button"
        className="session-register-trigger"
        onClick={() => setOpen(true)}
      >
        S&apos;inscrire · {placesAvailable} place{placesAvailable > 1 ? "s" : ""}
      </button>
      {open && createPortal(
        <div
          className="session-register-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) close();
          }}
        >
          <section
            className="session-register-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="session-register-title"
          >
            <button
              className="session-register-close"
              type="button"
              onClick={close}
              disabled={submitting}
              aria-label="Fermer le formulaire"
            >
              ×
            </button>
            <p className="session-register-kicker">Inscription à une session</p>
            <h2 id="session-register-title">{session.formationTitle}</h2>
            <p className="session-register-date">
              Session du {new Date(session.startDate).toLocaleDateString("fr-FR")} · {placesAvailable} place
              {placesAvailable > 1 ? "s" : ""} disponible{placesAvailable > 1 ? "s" : ""}
              {session.location ? ` · ${session.location}` : ""}
            </p>
            <p className="session-register-date">
              Inscriptions ouvertes jusqu’au{" "}
              {new Date(session.registrationDeadline).toLocaleString("fr-FR")}
            </p>
            {message?.type === "success" ? (
              <div className="session-register-message is-success" role="status">
                <p>{message.text}</p>
                <button type="button" onClick={close}>Terminer</button>
              </div>
            ) : (
              <form className="session-register-form" onSubmit={submitRegistration}>
                <label>
                  Prénom
                  <input name="firstName" autoComplete="given-name" required />
                </label>
                <label>
                  Nom
                  <input name="lastName" autoComplete="family-name" required />
                </label>
                <label>
                  Adresse e-mail
                  <input name="email" type="email" autoComplete="email" required />
                </label>
                <label>
                  Téléphone
                  <input name="phone" type="tel" autoComplete="tel" required />
                </label>
                {message?.type === "error" && (
                  <p className="session-register-message is-error" role="alert">{message.text}</p>
                )}
                <button type="submit" disabled={submitting}>
                  {submitting ? "Envoi en cours…" : "Confirmer mon inscription"}
                </button>
              </form>
            )}
          </section>
        </div>,
        document.body,
      )}
    </>
  );
}
