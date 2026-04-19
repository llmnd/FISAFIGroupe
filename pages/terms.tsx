import Head from 'next/head';
import Link from 'next/link';

export default function Terms() {
  return (
    <>
      <Head>
        <title>Conditions d'Utilisation | FiSAFi Groupe</title>
        <meta name="description" content="Conditions d'utilisation du site FiSAFi Groupe. Droits et obligations." />
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <meta name="theme-color" content="#1e40af" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://fisafigroupe.com/terms" />
        <meta property="og:title" content="Conditions d'Utilisation | FiSAFi Groupe" />
        <meta property="og:description" content="Conditions générales d'utilisation" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://fisafigroupe.com/terms" />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:site_name" content="FiSAFi Groupe" />
      </Head>

      <main style={{ marginTop: '110px' }}>
        <section className="policy-container">
          <div className="policy-content">
            <h1>Conditions d'Utilisation</h1>
            
            <p className="policy-last-updated">Dernière mise à jour : Avril 2026</p>

            <section className="policy-section">
              <h2>1. Acceptation des Conditions</h2>
              <p>
                En accédant et en utilisant le site web de FISAFI Groupe, vous acceptez d'être lié par ces conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser ce site.
              </p>
            </section>

            <section className="policy-section">
              <h2>2. Utilisation du Site</h2>
              <p>
                Vous acceptez d'utiliser ce site uniquement à des fins légales et d'une manière qui ne viole pas les droits d'autrui ou ne restreint pas leur utilisation et leur appréciation du site web. Tout comportement restrictif et abus du site est interdit.
              </p>
            </section>

            <section className="policy-section">
              <h2>3. Inscription et Comptes</h2>
              <p>
                Lorsque vous créez un compte sur notre site, vous devez fournir des informations exactes et à jour. Vous êtes responsable de maintenir la confidentialité de votre mot de passe et de votre compte. Vous acceptez la responsabilité de toutes les activités qui se produisent sous votre compte.
              </p>
            </section>

            <section className="policy-section">
              <h2>4. Formations et Services</h2>
              <p>
                Nos formations et services sont fournis "tels quels". Nous nous réservons le droit de modifier ou d'annuler toute formation, service ou contenu à tout moment. En cas d'annulation de formation, nous vous fournirons un remboursement complet ou la possibilité de vous inscrire à une autre formation.
              </p>
            </section>

            <section className="policy-section">
              <h2>5. Limitation de Responsabilité</h2>
              <p>
                FISAFI Groupe ne sera pas responsable de tout dommage indirect, accessoire, spécial ou consécutif résultant de votre utilisation du site ou des services, y compris les pertes de revenus, de données ou d'informations commerciales.
              </p>
            </section>

            <section className="policy-section">
              <h2>6. Propriété Intellectuelle</h2>
              <p>
                Tout le contenu du site web, y compris le texte, les graphiques, les logos, les images et les logiciels, est la propriété de FISAFI Groupe ou de ses fournisseurs de contenu et est protégé par les lois internationales sur le droit d'auteur. Toute reproduction ou redistribution du contenu sans notre permission écrite est interdite.
              </p>
            </section>

            <section className="policy-section">
              <h2>7. Liens Externes</h2>
              <p>
                Notre site web peut contenir des liens vers des sites web tiers. Nous ne sommes pas responsables du contenu ou de la disponibilité de ces sites externes. Votre utilisation des sites tiers est entièrement à vos risques et périls et soumise aux termes et conditions de ces sites.
              </p>
            </section>

            <section className="policy-section">
              <h2>8. Modifications des Conditions</h2>
              <p>
                Nous nous réservons le droit de modifier ces conditions d'utilisation à tout moment. Les modifications entreront en vigueur immédiatement après leur publication sur le site. Votre utilisation continue du site après la publication des modifications constitue votre acceptation des conditions modifiées.
              </p>
            </section>

            <section className="policy-section">
              <h2>9. Résiliation</h2>
              <p>
                Nous nous réservons le droit de résilier ou de suspendre votre accès au site à tout moment et pour n'importe quelle raison, sans avis préalable et sans responsabilité.
              </p>
            </section>

            <section className="policy-section">
              <h2>10. Droit Applicable</h2>
              <p>
                Ces conditions d'utilisation et tous les documents concernés sont régis par les lois du Sénégal. Vous consentez à la juridiction exclusive des tribunaux situés au Sénégal.
              </p>
            </section>

            <section className="policy-section">
              <h2>11. Contact</h2>
              <p>
                Pour toute question concernant ces conditions d'utilisation, veuillez nous contacter à :
              </p>
              <p>
                Email : <a href="mailto:contact@fisafi.com">contact@fisafi.com</a><br />
                Téléphone : <a href="tel:+22178896593939">+221 78 896 59 39</a>
              </p>
            </section>

            <div className="policy-footer">
              <Link href="/">← Retour à l'accueil</Link>
            </div>
          </div>
        </section>
      </main>

      <style jsx>{`
        .policy-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 3rem 1.5rem;
        }

        .policy-content {
          color: var(--ink);
        }

        .policy-content h1 {
          font-size: 2.5rem;
          font-weight: 300;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
          color: var(--ink);
        }

        .policy-last-updated {
          font-size: 0.875rem;
          color: var(--steel);
          margin-bottom: 2rem;
        }

        .policy-section {
          margin-bottom: 2.5rem;
        }

        .policy-section h2 {
          font-size: 1.5rem;
          font-weight: 400;
          letter-spacing: 0.03em;
          margin-bottom: 1rem;
          color: var(--ink);
          border-bottom: 2px solid var(--line);
          padding-bottom: 0.5rem;
        }

        .policy-section p {
          font-size: 1rem;
          line-height: 1.8;
          color: var(--steel);
          margin-bottom: 1rem;
        }

        .policy-section ul {
          list-style: none;
          margin: 1rem 0;
          padding-left: 0;
        }

        .policy-section li {
          font-size: 1rem;
          line-height: 1.8;
          color: var(--steel);
          margin-bottom: 0.75rem;
          padding-left: 1.5rem;
          position: relative;
        }

        .policy-section li::before {
          content: '•';
          position: absolute;
          left: 0;
          color: var(--orange);
          font-weight: bold;
        }

        .policy-section a {
          color: var(--blue);
          text-decoration: none;
          transition: color 0.2s;
        }

        .policy-section a:hover {
          color: var(--orange);
          text-decoration: underline;
        }

        .policy-footer {
          margin-top: 3rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--line);
        }

        .policy-footer a {
          display: inline-block;
          color: var(--blue);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }

        .policy-footer a:hover {
          color: var(--orange);
        }

        html.dark .policy-content {
          color: #e4e6eb;
        }

        html.dark .policy-content h1 {
          color: #e4e6eb;
        }

        html.dark .policy-section h2 {
          color: #e4e6eb;
          border-bottom-color: rgba(74,158,255,0.12);
        }

        html.dark .policy-section p {
          color: #a0a8b8;
        }

        html.dark .policy-section li {
          color: #a0a8b8;
        }

        html.dark .policy-section a {
          color: #4a9eff;
        }

        html.dark .policy-section a:hover {
          color: #ff9f5a;
        }

        @media (max-width: 640px) {
          .policy-container {
            padding: 2rem 1rem;
          }

          .policy-content h1 {
            font-size: 1.75rem;
          }

          .policy-section h2 {
            font-size: 1.25rem;
          }

          .policy-section p {
            font-size: 0.95rem;
          }

          .policy-section li {
            font-size: 0.95rem;
          }
        }
      `}</style>
    </>
  );
}
