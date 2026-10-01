import Image from "next/image";
import Link from "next/link";

const marketHref = process.env.NEXT_PUBLIC_FISAFI_MARKET_URL || "/market";

const businesses = [
  {
    name: "FiSAFi Groupe",
    eyebrow: "Ingénierie · Réseaux · Formation",
    description: "Réseaux télécoms, ingénierie terrain et formation professionnelle.",
    image: "https://i.pinimg.com/1200x/26/2f/10/262f108ec39907befbd45c4049cd3472.jpg",
    imageAlt: "FiSAFi Groupe — réseaux et télécommunications",
    href: "/",
    linkLabel: "Entrer dans le groupe",
  },
  {
    name: "FiSAFi Market",
    eyebrow: "Le pôle Market",
    description: "Découvrez l’univers FiSAFi Market et contactez notre équipe.",
    image: "https://i.pinimg.com/1200x/26/a2/8a/26a28a9a3fbe9e0fe2bec9a8b689d2d8.jpg",
    imageAlt: "Visuel FiSAFi Market",
    href: marketHref,
    linkLabel: "Découvrir Market",
  },
];

type BusinessBrandsProps = {
  className?: string;
  onGroupSelect?: () => void;
};

export default function BusinessBrands({
  className = "",
  onGroupSelect,
}: BusinessBrandsProps) {
  return (
    <section
      className={`business-brands${className ? ` ${className}` : ""}`}
      aria-label="Les activités FiSAFi"
    >
      {businesses.map((business) => (
        <Link
          className="business-brand-tile"
          href={business.href}
          key={business.name}
          aria-label={`${business.name} — ${business.linkLabel}`}
          onClick={(event) => {
            if (business.name === "FiSAFi Groupe" && onGroupSelect) {
              event.preventDefault();
              onGroupSelect();
            }
          }}
        >
          <Image
            className="business-brand-image"
            src={business.image}
            alt={business.imageAlt}
            fill
            sizes="(max-width: 760px) 100vw, 50vw"
            priority
          />
          <span className="business-brand-tint" aria-hidden="true" />
          <span className="business-brand-content">
            <span className="business-brand-eyebrow">{business.eyebrow}</span>
            <span className="business-brand-name">{business.name}</span>
            <span className="business-brand-description">{business.description}</span>
            <span className="business-brand-action">
              {business.linkLabel}
              <span className="business-brand-arrow" aria-hidden="true">↗</span>
            </span>
          </span>
          <span className="business-brand-plus" aria-hidden="true">+</span>
        </Link>
      ))}
    </section>
  );
}
