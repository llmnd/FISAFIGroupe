import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";

type VerificationState = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [state, setState] = useState<VerificationState>("loading");
  const [message, setMessage] = useState("Vérification de votre adresse email…");

  useEffect(() => {
    if (!router.isReady) return;
    const token = router.query.token;
    if (typeof token !== "string") {
      setState("error");
      setMessage("Le lien de vérification est invalide.");
      return;
    }

    const controller = new AbortController();
    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload: unknown = await response.json();
        if (!response.ok) {
          const error =
            payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
              ? payload.error
              : "La vérification a échoué.";
          throw new Error(error);
        }
        setState("success");
        setMessage("Votre adresse email est vérifiée. Vous recevrez maintenant les mises à jour de vos devis Market.");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error("[Auth] Email verification failed:", error);
        setState("error");
        setMessage(error instanceof Error ? error.message : "La vérification a échoué.");
      });

    return () => controller.abort();
  }, [router.isReady, router.query.token]);

  return (
    <>
      <Head>
        <title>Vérification email — FiSAFi Groupe</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="market-page market-checkout">
        <section className="market-order-confirmation" aria-live="polite">
          <span>{state === "success" ? "Email vérifié" : state === "error" ? "Vérification impossible" : "Un instant"}</span>
          <h1>{state === "success" ? "Merci !" : "Vérification de votre compte"}</h1>
          <p>{message}</p>
          {state !== "loading" && (
            <div>
              <Link href="/dashboard">Ouvrir mon espace</Link>
              <Link href="/market#rayons">Retour au marché</Link>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
