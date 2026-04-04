export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-main">
      <div className="max-w-7xl mx-auto">
        {/* Main content */}
        <div className="footer-grid">
          {/* Brand */}
          <div>
            <h3 className="footer-title">FISAFI</h3>
            <p className="footer-desc">
              Ingénierie, expertise technique et formation professionnelle pour la transformation digitale.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="footer-section-title">Services</h4>
            <ul className="footer-list">
              <li><a href="#">Ingénierie</a></li>
              <li><a href="#">Expertise</a></li>
              <li><a href="#">Formation</a></li>
              <li><a href="#">Solutions</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="footer-section-title">Entreprise</h4>
            <ul className="footer-list">
              <li><a href="#">À propos</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Carrières</a></li>
              <li><a href="#">Ressources</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="footer-section-title">Contact</h4>
            <ul className="footer-list">
              <li>
                <a href="tel:+22178896593939">
                  +221 78 896 59 39
                </a>
              </li>
              <li>
                <a href="mailto:contact@fisafi.com">
                  contact@fisafi.com
                </a>
              </li>
              <li>
                <a href="https://www.fisafigroupe.com" target="_blank" rel="noopener noreferrer">
                  www.fisafi.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="footer-bottom">
          <p>&copy; {currentYear} FISAFI. Tous droits réservés.</p>
          <div className="footer-bottom-links">
            <a href="/terms">Conditions d'Utilisation</a>
            <a href="/privacy">Confidentialité</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
