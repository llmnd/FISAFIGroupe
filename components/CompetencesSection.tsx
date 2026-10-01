import Link from "next/link";
import Image from "next/image";

type Competence = {
  name: string;
  description: string;
  image: string;
};

const COMPETENCES: Competence[] = [
  {
    name: "Sécurité des systèmes",
    description: "Audit, protection et conformité des systèmes d’information.",
    image: "/Sécurité des systèmes.jpg",
  },
  {
    name: "Infrastructure & réseaux",
    description: "Conception, déploiement et supervision des infrastructures.",
    image: "/Infrastructure & réseaux.gif",
  },
  {
    name: "Cybersécurité",
    description: "Détection des menaces et réponse aux incidents.",
    image: "/Cybersécurité.gif",
  },
  {
    name: "Cloud & virtualisation",
    description: "Migration, environnements hybrides et optimisation du cloud.",
    image: "/Cloud & virtualisation.jpg",
  },
  {
    name: "Conseil & accompagnement",
    description: "Cadrage stratégique et accompagnement de vos projets.",
    image: "/Conseil & accompagnement.jpg",
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
        {COMPETENCES.map(({ name, description, image }) => (
          <li key={name} className="comp-card">
            <Link href={href} className="comp-link">
              <span className="comp-image" aria-hidden="true">
                <Image src={image} alt="" fill sizes="(max-width: 760px) 100vw, 560px" />
              </span>
              <span className="comp-heading">
                <span className="comp-name">{name}</span>
              </span>
              <span className="comp-description">{description}</span>
              <span className="comp-arrow" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}