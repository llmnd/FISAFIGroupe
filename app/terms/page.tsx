import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions d'Utilisation | FiSAFi Groupe",
  description: "Conditions d'utilisation du site FiSAFi Groupe. Droits et obligations.",
  robots: "index, follow",
  openGraph: {
    title: "Conditions d'Utilisation | FiSAFi Groupe",
    description: "Conditions générales d'utilisation",
    url: "https://fisafigroupe.com/terms",
    type: "website",
    locale: "fr_FR",
    siteName: "FiSAFi Groupe",
  },
  alternates: {
    canonical: "https://fisafigroupe.com/terms",
  },
};

export default function TermsPage() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Conditions d'Utilisation</h1>
      <p>Contenu des conditions d'utilisation...</p>
    </div>
  );
}
