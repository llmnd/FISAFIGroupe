export default function Footer() {
  const currentYear = new Date().getFullYear();
  const companyUrl = (path: string) => `https://www.fisafigroupe.com${path}`;

  return (
    <footer className="footer-enhanced">
      <div className="footer-content">
        <div className="footer-brand">
          <div className="foot-logo">Fi<span>SAFI</span> Groupe</div>
          <div className="foot-tagline">L&apos;expertise qui fait la différence</div>
          <p className="footer-desc">
            Entreprise sénégalaise à vocation africaine, elle intervient dans les réseaux &amp; télécoms, les infrastructures IT, la cybersécurité, l’ingénierie et le conseil, tout en développant des activités de commerce général, import-export, négoce et distribution.
          </p>
          <div className="footer-socials">
            <a
              href="https://www.linkedin.com/company/fisafigroupe"
              aria-label="LinkedIn"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.475-2.236-1.986-2.236-1.081 0-1.722.722-2.006 1.422-.103.249-.129.597-.129.946v5.437h-3.554s.05-8.817 0-9.737h3.554v1.378c-.009.015-.021.029-.031.042h.031v-.042c.427-.659 1.191-1.598 2.897-1.598 2.117 0 3.704 1.381 3.704 4.352v5.605zM5.337 8.855c-1.144 0-1.915-.759-1.915-1.71 0-.955.771-1.71 1.958-1.71 1.187 0 1.914.755 1.937 1.71 0 .951-.75 1.71-1.98 1.71zm1.581 11.597H3.714V9.671h3.203v10.781zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
              </svg>
            </a>
            <a
              href="https://twitter.com/fisafigroupe"
              aria-label="Twitter"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.953 4.57a10 10 0 002.856-3.515 9.953 9.953 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
            </a>
          </div>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">Services</h4>
          <ul className="footer-list">
            <li><a href={companyUrl("/services#networks")}>Réseaux &amp; Télécoms</a></li>
            <li><a href={companyUrl("/services#infrastructure")}>Infrastructure IT</a></li>
            <li><a href={companyUrl("/services#security")}>Cybersécurité</a></li>
            <li><a href={companyUrl("/services#consulting")}>Conseil Stratégique</a></li>
            <li><a href={companyUrl("/market")}>Trading</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">Entreprise</h4>
          <ul className="footer-list">
            <li><a href={companyUrl("/#services")}>À propos</a></li>
            <li><a href={companyUrl("/training")}>Formations</a></li>
            <li><a href={companyUrl("/news")}>Actualités</a></li>
            <li><a href={companyUrl("/contact")}>Contact</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">Légal</h4>
          <ul className="footer-list">
            <li><a href={companyUrl("/privacy")}>Politique de confidentialité</a></li>
            <li><a href={companyUrl("/terms")}>Conditions d&apos;utilisation</a></li>
            <li><a href="mailto:contact@fisafigroupe.com">Support</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="foot-copy">© {currentYear} FISAFI Groupe. Tous droits réservés.</div>
        <a href="https://www.fisafigroupe.com" className="foot-web">fisafigroupe.com</a>
      </div>
    </footer>
  );
}
