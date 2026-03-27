export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-neutral-900 dark:bg-neutral-950 text-white py-16 sm:py-20 px-4 sm:px-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Main content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 sm:gap-10 md:gap-16 mb-16 pb-10 border-b border-neutral-800">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-light tracking-widest mb-4">FISAFI</h3>
            <p className="text-sm font-light text-neutral-400 leading-relaxed">
              Ingénierie, expertise technique et formation professionnelle pour la transformation digitale.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-xs tracking-widest text-neutral-300 mb-6 uppercase font-light">Services</h4>
            <ul className="space-y-3 text-sm font-light">
              <li><a href="#" className="text-neutral-400 hover:text-accent-400 transition">Ingénierie</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-accent-400 transition">Expertise</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-accent-400 transition">Formation</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-accent-400 transition">Solutions</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs tracking-widest text-neutral-300 mb-6 uppercase font-light">Entreprise</h4>
            <ul className="space-y-3 text-sm font-light">
              <li><a href="#" className="text-neutral-400 hover:text-accent-400 transition">À propos</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-accent-400 transition">Blog</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-accent-400 transition">Carrières</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-accent-400 transition">Ressources</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs tracking-widest text-neutral-300 mb-6 uppercase font-light">Contact</h4>
            <ul className="space-y-3 text-sm font-light">
              <li>
                <a href="tel:+22178896593939" className="text-neutral-400 hover:text-accent-400 transition">
                  +221 78 896 59 39
                </a>
              </li>
              <li>
                <a href="mailto:abdelsalam@fisafigroupe.com" className="text-neutral-400 hover:text-accent-400 transition">
                  contact@fisafi.com
                </a>
              </li>
              <li>
                <a href="https://www.fisafigroupe.com" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-accent-400 transition">
                  www.fisafi.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8 sm:gap-4 text-xs font-light text-neutral-500">
          <p>&copy; {currentYear} FISAFI. Tous droits réservés.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-accent-400 transition">Mentions légales</a>
            <a href="#" className="hover:text-accent-400 transition">Confidentialité</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
