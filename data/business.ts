export interface BusinessActivity {
  slug: string;
  number: string;
  eyebrow: string;
  title: string;
  cardTitle: string;
  summary: string;
  description: string;
  image: string;
  imageAlt: string;
  details: string[];
  services: string[];
  linkLabel: string;
  linkHref: string;
}

export const businessActivities: BusinessActivity[] = [
  {
    slug: "reseaux-telecoms",
    number: "01",
    eyebrow: "Infrastructures · Connectivité",
    title: "Réseaux & télécommunications",
    cardTitle: "Relier les territoires.",
    summary: "Études, déploiement et suivi de réseaux télécoms et fibre optique.",
    description:
      "FiSAFi intervient sur les projets d’infrastructure réseau, de la préparation technique au suivi des travaux. Le travail peut inclure des études de déploiement, la fibre optique aérienne ou souterraine et le contrôle d’avancement sur site.",
    image: "/3.jpeg",
    imageAlt: "Équipe de terrain sur un chantier de fibre optique au Tchad",
    details: [
      "Études et ingénierie de réseaux",
      "Déploiement fibre optique, aérien et souterrain",
      "Suivi de chantier et contrôle des travaux",
      "Réseaux et infrastructures IT",
    ],
    services: ["Fibre optique", "Réseaux télécoms", "Suivi de travaux"],
    linkLabel: "Voir les services",
    linkHref: "/services",
  },
  {
    slug: "formation",
    number: "02",
    eyebrow: "Transmission · Compétences",
    title: "Formation professionnelle",
    cardTitle: "Apprendre en faisant.",
    summary: "Des formations techniques accessibles en présentiel et à distance.",
    description:
      "Les parcours de formation FiSAFi portent sur les métiers du numérique et des télécommunications. Consultez le catalogue et les prochaines sessions pour trouver le format adapté.",
    image: "/17.jpeg",
    imageAlt: "Salle de formation équipée d’ordinateurs",
    details: [
      "Formations en réseaux et télécommunications",
      "Sessions en présentiel et en ligne",
      "Parcours adaptés aux professionnels et aux équipes",
      "Catalogue et inscriptions consultables en ligne",
    ],
    services: ["Catalogue de formations", "Sessions", "Parcours en ligne"],
    linkLabel: "Découvrir les formations",
    linkHref: "/training",
  },
  {
    slug: "etudes-ingenierie",
    number: "03",
    eyebrow: "Conseil · Préparation de projets",
    title: "Études & ingénierie",
    cardTitle: "Penser avant de déployer.",
    summary: "Cadrage technique et accompagnement de projets d’infrastructure.",
    description:
      "En amont du déploiement, FiSAFi accompagne le cadrage technique des projets : comprendre les contraintes, préparer les choix d’architecture et organiser les étapes de réalisation.",
    image: "/2.jpeg",
    imageAlt: "Intervenant de terrain préparant une opération d’infrastructure",
    details: [
      "Analyse des besoins et contraintes de site",
      "Études de déploiement réseau",
      "Conseil en infrastructure IT et télécoms",
      "Accompagnement technique pendant le projet",
    ],
    services: ["Études", "Conseil technique", "Ingénierie réseau"],
    linkLabel: "Parler de votre projet",
    linkHref: "/contact",
  },
];
