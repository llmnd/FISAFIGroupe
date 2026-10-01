import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";

export default function MarketPage() {
  return (
    <>
      <Head>
        <title>FiSAFi Market</title>
        <meta
          name="description"
          content="Découvrez FiSAFi Market et contactez l’équipe FiSAFi Groupe."
        />
      </Head>
      <Header />
      <main className="market-page">
        <section className="market-hero">
          <div className="market-hero-copy">
            <Link href="/business" className="market-back">← Our Business</Link>
            <p className="business-kicker">L’univers FiSAFi</p>
            <h1>FiSAFi<br /><span>Market</span></h1>
            <p className="market-intro">
              Une nouvelle porte d’entrée vers FiSAFi. Écrivez-nous pour toute demande liée à Market.
            </p>
            <a className="market-contact-link" href="mailto:contact@fisafigroupe.com">
              Contacter l’équipe <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className="market-hero-image">
            <Image
              src="https://i.pinimg.com/1200x/26/a2/8a/26a28a9a3fbe9e0fe2bec9a8b689d2d8.jpg"
              alt="Visuel FiSAFi Market"
              fill
              priority
              sizes="(max-width: 760px) 100vw, 58vw"
            />
            <span>FISAFI MARKET · 01</span>
          </div>
        </section>
        <section className="market-footer">
          <span>FI-SA-FI · DAKAR</span>
          <Link href="/">Retour au site FiSAFi Groupe <span aria-hidden="true">↗</span></Link>
        </section>
      </main>
    </>
  );
}
