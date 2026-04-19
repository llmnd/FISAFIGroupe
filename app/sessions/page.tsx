import React from "react";
import { Metadata } from "next";

// Sessions page metadata
export const metadata: Metadata = {
  title: "Sessions & Calendrier | Formations IT | FiSAFi Groupe",
  description: "Consulter le calendrier des sessions de formation IT disponibles. Inscrivez-vous dès maintenant.",
  keywords: ["sessions", "calendrier formation", "inscription", "formations IT"],
  robots: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
  openGraph: {
    title: "Sessions & Calendrier | FiSAFi Groupe",
    description: "Calendrier des sessions de formation IT",
    url: "https://fisafigroupe.com/sessions",
    type: "website",
    locale: "fr_FR",
    siteName: "FiSAFi Groupe",
    images: [
      {
        url: "https://fisafigroupe.com/logo.jpeg",
        width: 1200,
        height: 630,
        alt: "FiSAFi Groupe - Sessions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sessions | FiSAFi Groupe",
    description: "Sessions de formation IT disponibles",
    images: ["https://fisafigroupe.com/logo.jpeg"],
  },
  alternates: {
    canonical: "https://fisafigroupe.com/sessions",
  },
};

export default function SessionsPage() {
  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h1>Sessions</h1>
      <p>Redirecting to sessions section...</p>
    </div>
  );
}
