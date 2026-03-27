export default function News() {
  const newsItems = [
    {
      category: 'Articles techniques',
      description: 'Contenus approfondis sur nos domaines d\'expertise',
    },
    {
      category: 'Innovations',
      description: 'Découvrez nos dernières solutions et projets',
    },
    {
      category: 'Événements',
      description: 'Participation et sponsoring de conférences et salons',
    },
    {
      category: 'Veille sectorielle',
      description: 'Restez informé des tendances de l\'industrie',
    },
  ];

  return (
    <section id="news" className="py-16 sm:py-20 md:py-32 px-4 sm:px-6 bg-neutral-50">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-neutral-900 mb-8 sm:mb-12 md:mb-16">
          Actualités & Publications
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
          {newsItems.map((item, index) => (
            <div
              key={index}
              className="p-6 sm:p-8 border border-neutral-200 hover:border-neutral-900 hover:shadow-sm transition group cursor-pointer active:bg-neutral-100"
            >
              <h3 className="text-lg sm:text-xl font-light text-neutral-900 mb-2 sm:mb-3 group-hover:text-neutral-700 transition">
                ✅ {item.category}
              </h3>
              <p className="text-sm sm:text-base text-neutral-600 font-light leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
