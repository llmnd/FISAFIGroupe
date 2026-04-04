import Head from 'next/head';
import Link from 'next/link';

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Politique de Confidentialité | FISAFI Groupe</title>
        <meta name="description" content="Politique de confidentialité de FISAFI Groupe" />
      </Head>

      <main style={{ marginTop: '110px' }}>
        <section className="policy-container">
          <div className="policy-content">
            <h1>Politique de Confidentialité</h1>
            
            <p className="policy-last-updated">Dernière mise à jour : Avril 2026</p>

            <section className="policy-section">
              <h2>1. Introduction</h2>
              <p>
                FISAFI Groupe ("nous", "notre" ou "la Société") s'engage à protéger votre vie privée. Cette Politique de Confidentialité explique comment nous collectons, utilisons, divulguons et sauvegardons vos informations lorsque vous utilisez notre site web et nos services.
              </p>
            </section>

            <section className="policy-section">
              <h2>2. Informations Collectées</h2>
              <p>Nous collectons les informations que vous nous fournissez directement, notamment :</p>
              <ul>
                <li>Nom et adresse e-mail lors de la création d'un compte</li>
                <li>Informations de profil et préférences</li>
                <li>Données de contact (téléphone, adresse)</li>
                <li>Historique des formations et inscriptions</li>
                <li>Correspondances et communications avec notre équipe</li>
              </ul>
            </section>

            <section className="policy-section">
              <h2>3. Utilisation des Informations</h2>
              <p>Nous utilisons les informations collectées pour :</p>
              <ul>
                <li>Fournir et améliorer nos services</li>
                <li>Traiter les inscriptions aux formations</li>
                <li>Envoyer des communications importantes concernant votre compte et nos services</li>
                <li>Répondre à vos demandes et questions</li>
                <li>Envoyer des mises à jour marketing (si vous avez accepté)</li>
                <li>Analyser l'utilisation de notre site pour améliorer l'expérience utilisateur</li>
              </ul>
            </section>

            <section className="policy-section">
              <h2>4. Partage des Informations</h2>
              <p>
                Nous ne vendons pas, n'échangeons pas et ne louons pas vos informations personnelles à des tiers. Nous pouvons partager vos informations uniquement :
              </p>
              <ul>
                <li>Avec nos prestataires de services qui assistent nos opérations</li>
                <li>Lorsque la loi l'exige ou pour protéger nos droits légaux</li>
                <li>Avec votre consentement explicite</li>
              </ul>
            </section>

            <section className="policy-section">
              <h2>5. Sécurité des Données</h2>
              <p>
                Nous mettons en place des mesures de sécurité appropriées pour protéger vos informations contre l'accès non autorisé. Cependant, aucune méthode de transmission sur Internet n'est complètement sûre.
              </p>
            </section>

            <section className="policy-section">
              <h2>6. Cookies</h2>
              <p>
                Notre site utilise des cookies pour améliorer votre expérience. Vous pouvez contrôler les paramètres des cookies via les paramètres de votre navigateur.
              </p>
            </section>

            <section className="policy-section">
              <h2>7. Vos Droits</h2>
              <p>Vous avez le droit de :</p>
              <ul>
                <li>Accéder à vos données personnelles</li>
                <li>Corriger les informations inexactes</li>
                <li>Demander la suppression de vos données</li>
                <li>Vous opposer au traitement de vos données</li>
              </ul>
            </section>

            <section className="policy-section">
              <h2>8. Contact</h2>
              <p>
                Pour toute question concernant cette politique de confidentialité, veuillez nous contacter à :
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
