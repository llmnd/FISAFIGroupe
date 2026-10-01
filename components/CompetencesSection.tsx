import Link from "next/link";

type Competence = {
  name: string;
  description: string;
};

const COMPETENCES: Competence[] = [
  {
    name: "Sécurité des systèmes",
    description: "Audit, protection et conformité des systèmes d’information.",
  },
  {
    name: "Infrastructure & réseaux",
    description: "Conception, déploiement et supervision des infrastructures.",
  },
  {
    name: "Cybersécurité",
    description: "Détection des menaces et réponse aux incidents.",
  },
  {
    name: "Cloud & virtualisation",
    description: "Migration, environnements hybrides et optimisation du cloud.",
  },
  {
    name: "Conseil & accompagnement",
    description: "Cadrage stratégique et accompagnement de vos projets.",
  },
];

export default function CompetencesSection({
  href = "/services",
}: {
  href?: string;
}) {
  return (
    <section id="competences" className="competences-section" aria-labelledby="competences-title">
      <header className="comp-header">
        <p className="comp-eyebrow">Nos expertises</p>
        <h2 id="competences-title" className="comp-title">
          Ce que nous <em>maîtrisons</em>
        </h2>
        <p className="comp-intro">
          Des compétences complémentaires pour concevoir, sécuriser et faire évoluer vos infrastructures numériques.
        </p>
      </header>

      <ul className="comp-list">
        {COMPETENCES.map(({ name, description }) => (
          <li key={name} className="comp-card">
            <Link href={href} className="comp-link">
              <span className="comp-name">{name}</span>
              <span className="comp-description">{description}</span>
              <span className="comp-arrow" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}