import Link from "next/link";

type Competence = {
  num: string;
  name: string;
  tag: string;
};

const COMPETENCES: Competence[] = [
  { num: "01", name: "Sécurité des systèmes",    tag: "Audit · Protection · Conformité" },
  { num: "02", name: "Infrastructure & réseaux", tag: "Conception · Déploiement · Supervision" },
  { num: "03", name: "Cybersécurité",            tag: "SOC · Détection · Réponse" },
  { num: "04", name: "Cloud & virtualisation",   tag: "Hybride · Migration · Optimisation" },
  { num: "05", name: "Conseil & accompagnement", tag: "Cadrage · Stratégie · Suivi" },
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
        <span className="comp-count" aria-hidden="true">05 disciplines</span>
      </header>

      <ul className="comp-list">
        {COMPETENCES.map((c) => (
          <li key={c.num} className="comp-row">
            <Link href={`${href}#${c.num}`} className="comp-link">
              <span className="comp-num">{c.num}</span>
              <span className="comp-name">{c.name}</span>
              <span className="comp-tag">{c.tag}</span>
              <span className="comp-arrow" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}