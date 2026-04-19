import React from "react";
import { Metadata } from "next";

// Load your actual privacy page component
export const metadata: Metadata = {
  title: "Politique de Confidentialité | FiSAFi Groupe",
  description: "Politique de confidentialité de FiSAFi Groupe. Comment nous protégeons vos données.",
  robots: "index, follow",
  openGraph: {
    title: "Politique de Confidentialité | FiSAFi Groupe",
    description: "Politique de confidentialité et protection des données",
    url: "https://fisafigroupe.com/privacy",
    type: "website",
    locale: "fr_FR",
    siteName: "FiSAFi Groupe",
  },
  alternates: {
    canonical: "https://fisafigroupe.com/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Politique de Confidentialité</h1>
      <p>Contenu de la politique de confidentialité...</p>
    </div>
  );
}
