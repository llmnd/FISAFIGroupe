import Head from "next/head";
import Link from "next/link";
import Header from "@/components/Header";

type Department = {
  id: string;
  name: string;
  description: string;
  color: string;
  art: "produce" | "pantry" | "bakery" | "drinks" | "fresh" | "home";
};

const DEPARTMENTS: Department[] = [
  {
    id: "fruits-legumes",
    name: "Fruits & légumes",
    description: "Les couleurs et les saveurs du marché.",
    color: "green",
    art: "produce",
  },
  {
    id: "epicerie",
    name: "Épicerie",
    description: "Les indispensables pour chaque recette.",
    color: "orange",
    art: "pantry",
  },
  {
    id: "boulangerie",
    name: "Boulangerie",
    description: "Le plaisir des bonnes choses à partager.",
    color: "gold",
    art: "bakery",
  },
  {
    id: "boissons",
    name: "Boissons",
    description: "De quoi accompagner chaque moment.",
    color: "blue",
    art: "drinks",
  },
  {
    id: "frais",
    name: "Produits frais",
    description: "Une sélection pour vos repas du quotidien.",
    color: "pink",
    art: "fresh",
  },
  {
    id: "maison",
    name: "Maison & entretien",
    description: "Les essentiels pratiques de la maison.",
    color: "purple",
    art: "home",
  },
];

function DepartmentIllustration({ art }: { art: Department["art"] }) {
  return (
    <svg
      className={`market-department-art market-department-art--${art}`}
      viewBox="0 0 240 180"
      fill="none"
      aria-hidden="true"
    >
      <ellipse cx="120" cy="153" rx="73" ry="10" fill="currentColor" opacity=".1" />
      {art === "produce" && (
        <>
          <path d="M70 94c-2-25 18-42 40-32 13 6 13 26 5 44-11 24-43 21-45-12Z" fill="#F5A43B" />
          <path d="M98 67c-2-13 5-24 18-26-1 11-6 19-18 26Z" fill="#3C985F" />
          <path d="M121 103c-5-26 13-47 37-38 19 7 18 27 8 45-14 25-41 20-45-7Z" fill="#E95D58" />
          <path d="M139 66c4-12 15-18 27-15-5 11-13 16-27 15Z" fill="#4D9A5B" />
          <path d="M92 126c3-24 22-35 39-28 15 6 15 21 4 34-12 15-45 15-43-6Z" fill="#E8C84F" />
          <path d="M109 96c-3-10 0-16 8-21" stroke="#477D42" strokeWidth="4" strokeLinecap="round" />
        </>
      )}
      {art === "pantry" && (
        <>
          <path d="M74 64h38l6 12v66H68V76l6-12Z" fill="#F2E4C6" />
          <path d="M74 64h38v15H74z" fill="#D88B43" />
          <path d="M75 94h36v28H75z" fill="#78A66A" />
          <path d="M134 57h33l7 13v72h-47V70l7-13Z" fill="#F7F0E2" />
          <path d="M134 57h33v15h-33z" fill="#D9B96E" />
          <path d="M133 94h39v28h-39z" fill="#E7A559" />
          <path d="M82 106h22m-22 7h15m24-12h26m-26 8h20" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".8" />
        </>
      )}
      {art === "bakery" && (
        <>
          <path d="M59 116c0-21 13-38 33-46 5-18 23-28 43-22 11 3 19 12 21 23 15 9 25 26 25 45v14H59v-14Z" fill="#D7954C" />
          <path d="M97 73c-2 12 3 23 11 30m18-56c-4 12-2 23 5 33m20-9c-4 12-1 23 6 33" stroke="#F7D49B" strokeWidth="6" strokeLinecap="round" />
          <path d="M56 132h132" stroke="#A76735" strokeWidth="6" strokeLinecap="round" />
        </>
      )}
      {art === "drinks" && (
        <>
          <path d="M79 60h27v12l8 9v64H71V81l8-9V60Z" fill="#79A9D3" />
          <path d="M79 60h27v12H79z" fill="#F6F0DD" />
          <path d="M72 103h42v25H72z" fill="#E7F5F8" opacity=".88" />
          <path d="M139 52h26v14l7 9v70h-40V75l7-9V52Z" fill="#D7954C" />
          <path d="M139 52h26v14h-26z" fill="#F6F0DD" />
          <path d="M132 101h40v27h-40z" fill="#F9E5AF" opacity=".9" />
          <path d="M84 113c8-9 18-9 27 0m28 0c8-9 18-9 27 0" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      {art === "fresh" && (
        <>
          <path d="M71 81h98l-9 70H80l-9-70Z" fill="#F5F1E7" />
          <path d="M78 91h84l-6 47H84l-6-47Z" fill="#E9C8A4" />
          <path d="M92 80c-5-18 7-31 23-28 11 2 15 15 9 28m12 0c-2-18 10-28 25-23 10 4 11 16 3 24" stroke="#5B9A64" strokeWidth="8" strokeLinecap="round" />
          <path d="M97 109c8-9 16-9 24 0m12 0c8-9 16-9 24 0" stroke="#FFF9EC" strokeWidth="5" strokeLinecap="round" />
          <path d="M74 83h92" stroke="#D6B990" strokeWidth="5" strokeLinecap="round" />
        </>
      )}
      {art === "home" && (
        <>
          <path d="M75 90h90l-8 60H83l-8-60Z" fill="#A8C9DE" />
          <path d="M88 76h64v18H88z" fill="#F6F2E9" />
          <path d="M96 75c0-15 9-25 24-25s24 10 24 25" stroke="#F6F2E9" strokeWidth="8" />
          <path d="M97 110h46m-42 12h38" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".85" />
          <path d="M176 110c0-13 10-23 22-23s22 10 22 23v35h-44v-35Z" fill="#D8B69A" />
          <path d="M183 111c0-9 6-15 15-15s15 6 15 15" stroke="#F8EBD9" strokeWidth="5" />
        </>
      )}
    </svg>
  );
}

export default function MarketPage() {
  return (
    <>
      <Head>
        <title>FiSAFi Market — Le marché du quotidien</title>
        <meta
          name="description"
          content="Explorez les rayons FiSAFi Market : produits frais, épicerie, boulangerie, boissons et essentiels de la maison."
        />
      </Head>
      <Header />
      <main className="market-page">
        <div className="market-announcement">
          <span className="market-announcement-dot" aria-hidden="true" />
          <span>LE MARCHÉ DU QUOTIDIEN, TOUT PRÈS DE VOUS</span>
          <span className="market-announcement-note">DAKAR · SÉNÉGAL</span>
        </div>

        <nav className="market-store-nav" aria-label="Navigation Market">
          <Link href="/business" className="market-back">
            <span aria-hidden="true">←</span> Our Business
          </Link>
          <Link href="/" className="market-wordmark" aria-label="FiSAFi Market, accueil">
            <span className="market-wordmark-icon" aria-hidden="true">F</span>
            <span>FiSAFi <strong>Market</strong></span>
          </Link>
          <a className="market-nav-contact" href="mailto:contact@fisafigroupe.com">
            Nous contacter <span aria-hidden="true">↗</span>
          </a>
        </nav>

        <section className="market-hero" aria-labelledby="market-title">
          <div className="market-hero-copy">
            <p className="market-kicker"><span>LE BON MARCHÉ</span> · LE BON CHOIX</p>
            <h1 id="market-title">
              Le plaisir
              <br />
              des courses
              <br />
              <span>bien faites.</span>
            </h1>
            <p className="market-intro">
              Des essentiels du quotidien aux petits plaisirs, retrouvez l’esprit du marché dans une expérience simple et accueillante.
            </p>
            <a className="market-contact-link" href="#rayons">
              Explorer les rayons <span aria-hidden="true">↓</span>
            </a>
            <div className="market-hero-note">
              <span>De bons produits, pour tous les jours.</span>
            </div>
          </div>

          <div className="market-hero-scene" aria-label="Illustration d’un panier de marché rempli de produits frais">
            <div className="market-scene-sun" aria-hidden="true" />
            <span className="market-scene-label market-scene-label--top">LE MARCHÉ EST OUVERT</span>
            <svg className="market-basket-art" viewBox="0 0 640 560" fill="none" aria-hidden="true">
              <ellipse cx="326" cy="487" rx="203" ry="25" fill="#26371C" opacity=".12" />
              <path d="m172 264 24 186c3 24 20 41 44 41h182c24 0 41-17 44-41l24-186H172Z" fill="#E9B65E" />
              <path d="m191 285 19 156c2 15 13 25 28 25h176c15 0 26-10 28-25l19-156H191Z" fill="#F6D58C" />
              <path d="m172 264 24 186c3 24 20 41 44 41h182c24 0 41-17 44-41l24-186" stroke="#AB733E" strokeWidth="8" strokeLinecap="round" />
              <path d="M216 282 239 480m44-198 8 198m49-198v198m49-198-8 198m49-198-23 198" stroke="#C8914D" strokeWidth="5" opacity=".75" />
              <path d="M179 272h355" stroke="#9E6938" strokeWidth="15" strokeLinecap="round" />
              <path d="M209 260c5-48 35-69 68-56 11-48 52-71 88-47 30-35 78-19 83 26 35-4 56 26 53 77" fill="#5B9A54" />
              <path d="M228 269c-20-28-11-65 16-74 22-8 42 11 41 36 29 5 37 39 16 57" fill="#E7654C" />
              <path d="M276 228c-6-31 12-53 37-48 22 4 29 29 17 51 24 17 17 48-8 59" fill="#F0B43D" />
              <path d="M335 217c1-34 28-52 51-39 19 10 19 34 4 52 18 23 4 51-23 54" fill="#D95045" />
              <path d="M388 224c13-27 43-31 58-10 13 19 3 40-18 48 8 27-14 48-40 38" fill="#F2C846" />
              <path d="M232 211c-9-27 6-51 30-51 20 0 32 21 23 42m67-27c-2-27 17-45 38-37 18 7 22 29 9 45" stroke="#3E7546" strokeWidth="7" strokeLinecap="round" />
              <path d="m220 266 14 12m53-53 13 12m42-35 12 13m48-2 11 14m49 19 12 13" stroke="#FFF0C7" strokeWidth="5" strokeLinecap="round" opacity=".7" />
              <path d="M255 366c35-27 72-27 107 0s72 27 107 0" stroke="#D39A4E" strokeWidth="4" opacity=".7" />
              <path d="m174 264-29-17m391 17 28-17" stroke="#AB733E" strokeWidth="9" strokeLinecap="round" />
              <circle cx="153" cy="247" r="12" fill="#6D9E57" />
              <circle cx="563" cy="247" r="12" fill="#6D9E57" />
            </svg>
            <span className="market-scene-label market-scene-label--bottom">FRAIS · LOCAL · GÉNÉREUX</span>
            <div className="market-scene-sticker">
              <span>LE</span>
              <strong>marché</strong>
              <span>DU QUOTIDIEN</span>
            </div>
          </div>
        </section>

        <section className="market-values" aria-label="Nos engagements">
          <div><span>Des produits pour tous les jours</span></div>
          <div><span className="market-value-icon" aria-hidden="true">♡</span><span>Un accueil chaleureux</span></div>
          <div><span className="market-value-icon" aria-hidden="true">⌖</span><span>Au cœur de Dakar</span></div>
        </section>

        <section className="market-departments" id="rayons" aria-labelledby="market-departments-title">
          <div className="market-section-heading">
            <div>
              <p className="market-kicker">À CHACUN SON RAYON</p>
              <h2 id="market-departments-title">Faites votre marché.</h2>
            </div>
            <p>De quoi remplir le panier et régaler toute la maison.</p>
          </div>
          <div className="market-department-grid">
            {DEPARTMENTS.map((department, index) => (
              <a
                className={`market-department-card market-department-card--${department.color}`}
                href="mailto:contact@fisafigroupe.com?subject=Renseignements%20FiSAFi%20Market"
                key={department.id}
              >
                <span className="market-department-number">{String(index + 1).padStart(2, "0")}</span>
                <DepartmentIllustration art={department.art} />
                <span className="market-department-copy">
                  <strong>{department.name}</strong>
                  <span>{department.description}</span>
                  <span className="market-department-arrow" aria-hidden="true">↗</span>
                </span>
              </a>
            ))}
          </div>
        </section>

        <section className="market-pantry-callout">
          <div className="market-pantry-art" aria-hidden="true">
            <svg viewBox="0 0 220 180" fill="none">
              <path d="M41 79h138l-12 82H53L41 79Z" fill="#F4D58B" />
              <path d="M55 91h110l-8 58H63l-8-58Z" fill="#E7B75D" />
              <circle cx="78" cy="74" r="31" fill="#E75A48" />
              <circle cx="112" cy="63" r="35" fill="#F2BB3F" />
              <circle cx="148" cy="75" r="28" fill="#6C9E56" />
              <path d="M76 47c2-13 10-20 22-20m15 2c-3-13 3-22 15-25m22 40c4-12 13-16 23-14" stroke="#47784A" strokeWidth="6" strokeLinecap="round" />
              <path d="M42 80h136" stroke="#A9743F" strokeWidth="7" strokeLinecap="round" />
            </svg>
          </div>
          <div className="market-pantry-copy">
            <p className="market-kicker">LE PANIER VOUS ATTEND</p>
            <h2>Un produit en tête ?</h2>
            <p>Notre équipe vous renseigne sur les rayons et les disponibilités. Écrivez-nous, nous serons heureux de vous répondre.</p>
            <a className="market-contact-link" href="mailto:contact@fisafigroupe.com?subject=Demande%20FiSAFi%20Market">
              Parler à l’équipe <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>

        <footer className="market-footer">
          <span>FI-SA-FI · DAKAR</span>
          <span>Le marché du quotidien.</span>
          <Link href="/">Retour au site FiSAFi Groupe <span aria-hidden="true">↗</span></Link>
        </footer>
      </main>
    </>
  );
}
