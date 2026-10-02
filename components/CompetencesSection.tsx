import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Competence = {
  name: string;
  description: string;
  details: string;
  image: string;
  tag: string;
};

const COMPETENCES: Competence[] = [
  {
    name: "Sécurité des systèmes",
    description:
      "Nous évaluons la sécurité de vos systèmes, identifions les vulnérabilités et vous aidons à protéger vos données, vos accès et vos activités.",
    details:
      "Nous commençons par analyser vos équipements, vos applications, les droits d’accès et les pratiques de sauvegarde. À partir des risques observés, nous priorisons des mesures concrètes : sécurisation des accès, mises à jour, protection des données et amélioration des procédures. Vous obtenez une vision claire des actions à mener et un accompagnement adapté à vos contraintes.",
    image: "/Sécurité des systèmes.jpg",
    tag: "Protection",
  },
  {
    name: "Infrastructure & réseaux",
    description:
      "Nous concevons et déployons des réseaux fiables, puis accompagnons leur évolution pour assurer la disponibilité et la performance de vos services.",
    details:
      "Du cadrage des besoins à la mise en service, nous vous accompagnons dans la conception, le déploiement et l’évolution de vos infrastructures réseau. Nous prenons en compte les usages, les sites, la capacité attendue et les exigences de continuité afin de proposer une architecture exploitable et adaptée à votre organisation.",
    image: "/Infrastructure & réseaux.gif",
    tag: "Réseaux",
  },
  {
    name: "Cybersécurité",
    description:
      "Nous renforçons votre posture de sécurité, préparons la réponse aux incidents et aidons vos équipes à réduire les risques numériques.",
    details:
      "Notre accompagnement couvre l’identification des menaces, l’évaluation des mesures de défense et la préparation à la gestion d’incidents. Nous aidons à définir des actions de prévention, des procédures de réaction et des priorités de remédiation, en tenant compte de la taille de votre structure et de la sensibilité de vos activités.",
    image: "/Cybersécurité.gif",
    tag: "Cyberdéfense",
  },
  {
    name: "Cloud & virtualisation",
    description:
      "Nous vous aidons à choisir et faire évoluer vos environnements cloud ou virtualisés, en conciliant disponibilité, maîtrise et sécurité.",
    details:
      "Nous étudions les besoins de vos applications et de vos équipes pour organiser vos environnements cloud, hybrides ou virtualisés. La démarche peut inclure la préparation d’une migration, la structuration des ressources, l’amélioration de la disponibilité et le suivi des usages afin de faire évoluer votre infrastructure sans perdre de vue la sécurité et les coûts.",
    image: "/Cloud & virtualisation.jpg",
    tag: "Cloud",
  },
  {
    name: "Conseil & accompagnement",
    description:
      "Nous clarifions vos priorités technologiques et vous accompagnons du cadrage des besoins au pilotage de vos projets.",
    details:
      "Nous travaillons avec vos équipes pour comprendre vos enjeux, formaliser les besoins et comparer les options possibles. Nous pouvons contribuer au cadrage, à la planification, au suivi des étapes et à la coordination des intervenants, avec des recommandations compréhensibles et directement liées à vos objectifs.",
    image: "/Conseil & accompagnement.jpg",
    tag: "Conseil",
  },
];

export default function CompetencesSection({
  href = "/services",
}: {
  href?: string;
}) {
  const [activeCompetence, setActiveCompetence] = useState<Competence | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (activeCompetence && dialog && !dialog.open) dialog.showModal();
  }, [activeCompetence]);

  const closeDialog = () => dialogRef.current?.close();

  return (
    <section id="competences" className="competences-section" aria-labelledby="competences-title">
      <header className="comp-header">
        <p className="comp-eyebrow">Nos expertises</p>
        <h2 id="competences-title" className="comp-title">
          Ce que nous <em>maîtrisons</em>
        </h2>
        <p className="comp-intro">
          Des compétences complémentaires pour concevoir, sécuriser et faire évoluer vos infrastructures numériques.
          Nous associons conseil, expertise technique et accompagnement pour répondre aux réalités de chaque organisation.
        </p>
      </header>

      <ul className="comp-list">
        {COMPETENCES.map((competence) => (
          <li key={competence.name} className="comp-card">
            <article className="comp-row">
              <button
                className="comp-image-trigger"
                type="button"
                onClick={() => setActiveCompetence(competence)}
                aria-label={`En savoir plus sur ${competence.name}`}
              >
                <span className="comp-image">
                  <Image
                    src={competence.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 33vw"
                  />
                  <span className="comp-image-hint">Découvrir</span>
                </span>
              </button>
              <div className="comp-copy">
                <div className="comp-heading">
                  <h3 className="comp-name">{competence.name}</h3>
                </div>
                <p className="comp-description">{competence.description}</p>
                <div className="comp-footer">
                  <span className="comp-tag">{competence.tag}</span>
                  <button
                    className="comp-details-button"
                    type="button"
                    onClick={() => setActiveCompetence(competence)}
                  >
                    En savoir plus <span aria-hidden="true">↗</span>
                  </button>
                </div>
              </div>
            </article>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        className="comp-dialog"
        aria-labelledby="comp-dialog-title"
        onClose={() => setActiveCompetence(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeDialog();
        }}
      >
        {activeCompetence && (
          <div className="comp-dialog-content">
            <button
              className="comp-dialog-close"
              type="button"
              onClick={closeDialog}
              aria-label="Fermer les détails"
            >
              ×
            </button>
            <div className="comp-dialog-image">
              <Image
                src={activeCompetence.image}
                alt=""
                fill
                sizes="(max-width: 760px) 100vw, 640px"
              />
            </div>
            <div className="comp-dialog-copy">
              <p className="comp-dialog-eyebrow">{activeCompetence.tag}</p>
              <h2 id="comp-dialog-title">{activeCompetence.name}</h2>
              <p>{activeCompetence.details}</p>
              <Link href={href} className="comp-dialog-link">
                Découvrir nos services <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}
