export default function Hero() {
  return (
    <section className="pt-40 sm:pt-48 md:pt-60 pb-24 sm:pb-32 md:pb-48 px-4 sm:px-6 bg-white dark:bg-neutral-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-20 items-center">
          {/* Left: Typography */}
          <div className="space-y-8">
            <div>
              <p className="text-sm sm:text-base tracking-widest uppercase font-light text-neutral-500 dark:text-neutral-400 mb-6">
                Transformation digitale
              </p>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-light leading-tight text-primary-800 dark:text-white mb-4">
                Ingénierie
                <span className="block text-accent-500 dark:text-accent-400">& Expertise</span>
              </h1>
            </div>
            
            <div className="border-l-2 border-accent-500 dark:border-accent-400 pl-6 sm:pl-8">
              <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 font-light leading-relaxed max-w-lg">
                FISAFI accompagne les entreprises dans leurs projets technologiques les plus ambitieux avec excellence et innovation.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <a
                href="#services"
                className="px-8 py-4 bg-primary-700 dark:bg-accent-500 text-white text-sm tracking-widest uppercase hover:bg-primary-800 dark:hover:bg-accent-600 active:bg-primary-900 dark:active:bg-accent-700 transition text-center min-h-12 flex items-center justify-center rounded-lg font-medium"
              >
                Découvrir
              </a>
              <a
                href="#contact"
                className="px-8 py-4 border-2 border-primary-700 dark:border-accent-500 text-primary-700 dark:text-accent-400 text-sm tracking-widest uppercase hover:bg-primary-50 dark:hover:bg-neutral-800 active:bg-primary-100 dark:active:bg-neutral-700 transition text-center min-h-12 flex items-center justify-center rounded-lg font-medium"
              >
                Contact
              </a>
            </div>
          </div>

          {/* Right: Visual accent */}
          <div className="hidden md:flex items-end justify-end">
            <div className="w-full h-96 bg-gradient-to-br from-primary-50 to-accent-50 dark:from-neutral-800 dark:to-neutral-700 rounded-2xl opacity-60"></div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="flex justify-center mt-20">
        <div className="animate-bounce">
          <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </section>
  );
}
