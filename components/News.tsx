export default function News() {
  const newsItems = [
    {
      category: 'Articles techniques',
      description: 'Contenus approfondis sur nos domaines d\'expertise',
      img: '/20.jpeg',
    },
    {
      category: 'Innovations',
      description: 'Découvrez nos dernières solutions et projets',
      img: '/21.jpeg',
    },
    {
      category: 'Événements',
      description: 'Participation et sponsoring de conférences et salons',
      img: '/20.jpeg',
    },
    {
      category: 'Veille sectorielle',
      description: 'Restez informé des tendances de l\'industrie',
      img: '/20.jpeg',
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
              style={{
                backgroundImage: `url(${item.img})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                minHeight: '280px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
            >
              {/* Overlay gradient */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.7))',
                pointerEvents: 'none',
                borderRadius: 'inherit',
              }} />
              <h3 className="text-lg sm:text-xl font-light text-neutral-900 mb-2 sm:mb-3 group-hover:text-neutral-700 transition" style={{ position: 'relative', zIndex: 1, color: '#fff' }}>
                ✅ {item.category}
              </h3>
              <p className="text-sm sm:text-base text-neutral-600 font-light leading-relaxed" style={{ position: 'relative', zIndex: 1, color: '#fff' }}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
