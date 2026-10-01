import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import Header from "@/components/Header";
import { businessActivities } from "@/data/business";

export default function BusinessDetailPage() {
  const router = useRouter();
  const { slug } = router.query;

  if (!router.isReady) return null;

  const activity = businessActivities.find((item) => item.slug === slug);
  if (!activity) {
    return (
      <>
        <Head><title>Activité introuvable — FiSAFi Groupe</title></Head>
        <Header />
        <main className="business-detail business-not-found">
          <p className="business-kicker">FiSAFi Groupe</p>
          <h1>Cette activité n&apos;existe pas.</h1>
          <Link href="/business">Retour à Our Business <span aria-hidden="true">↗</span></Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{activity.title} — FiSAFi Groupe</title>
        <meta name="description" content={activity.summary} />
      </Head>
      <Header />
      <main className="business-detail">
        <Link className="business-back" href="/business">← Our Business</Link>
        <section className="business-detail-hero">
          <div className="business-detail-copy">
            <p className="business-kicker">{activity.number} — {activity.eyebrow}</p>
            <h1>{activity.title}</h1>
            <p className="business-detail-summary">{activity.summary}</p>
          </div>
          <div className="business-detail-image">
            <Image
              src={activity.image}
              alt={activity.imageAlt}
              fill
              priority
              sizes="(max-width: 760px) 100vw, 60vw"
            />
          </div>
        </section>
        <section className="business-detail-body">
          <div>
            <p className="business-kicker">L’activité</p>
            <h2>Du concret, à chaque étape.</h2>
          </div>
          <div className="business-detail-description">
            <p>{activity.description}</p>
            <ul>
              {activity.details.map((detail) => <li key={detail}>{detail}</li>)}
            </ul>
            <div className="business-detail-tags">
              {activity.services.map((service) => <span key={service}>{service}</span>)}
            </div>
            <Link className="business-detail-cta" href={activity.linkHref}>
              {activity.linkLabel} <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </section>
        <nav className="business-next" aria-label="Autres activités">
          {businessActivities
            .filter((item) => item.slug !== activity.slug)
            .map((item) => (
              <Link key={item.slug} href={`/business/${item.slug}`}>
                <span>{item.number} · {item.eyebrow}</span>
                <strong>{item.title}</strong>
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
        </nav>
      </main>
    </>
  );
}

export function getStaticPaths() {
  return {
    paths: businessActivities.map(({ slug }) => ({ params: { slug } })),
    fallback: false,
  };
}

export function getStaticProps() {
  return { props: {} };
}
