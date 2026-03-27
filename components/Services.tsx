export default function Services() {
  const services = [
    {
      title: 'Ingénierie',
      items: [
        'Études techniques (télécoms, réseaux, infrastructures)',
        'Conception et déploiement',
      ],
    },
    {
      title: 'Expertise & Conseil',
      items: [
        'Audit technique',
        'Assistance à maîtrise d\'ouvrage',
        'Stratégie et transformation digitale',
      ],
    },
    {
      title: 'Formation',
      items: [
        'Formations techniques spécialisées',
        'Certifications professionnelles',
        'Formations sur mesure',
      ],
    },
    {
      title: 'Import – Export & Négoce',
      items: [
        'Fourniture d\'équipements techniques',
        'Commerce général',
        'Solutions d\'approvisionnement international',
      ],
    },
  ];

  return (
    <section id="services" className="py-16 sm:py-20 md:py-32 px-4 sm:px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-neutral-900 mb-8 sm:mb-12 md:mb-16">
          Nos services
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10 md:gap-12 lg:gap-16">
          {services.map((service, index) => (
            <div key={index} className="border-l-2 border-neutral-900 pl-4 sm:pl-6 md:pl-8">
              <h3 className="text-xl sm:text-2xl font-light text-neutral-900 mb-4 sm:mb-6">{service.title}</h3>
              <ul className="space-y-3 sm:space-y-4">
                {service.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="text-sm sm:text-base text-neutral-600 font-light relative pr-2">
                    <span className="absolute -left-5 sm:-left-6 md:-left-8 top-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
