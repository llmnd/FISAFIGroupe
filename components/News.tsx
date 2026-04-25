"use client";

import Image from "next/image";

interface NewsItem {
  category: string;
  description: string;
  img: string;
}

const newsItems: NewsItem[] = [
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

export default function News() {
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
              className="relative overflow-hidden rounded-lg min-h-[280px] group cursor-pointer border border-neutral-200 hover:border-neutral-900 hover:shadow-sm transition"
              style={{ contain: "layout style paint" }}
            >
              {/* Image optimisée avec lazy loading */}
              <Image
                src={item.img}
                alt={item.category}
                fill
                loading="lazy"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover w-full h-full"
                unoptimized={false}
              />
              
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70 pointer-events-none" />
              
              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
                <h3 className="text-lg sm:text-xl font-light text-white mb-2 sm:mb-3 group-hover:text-neutral-100 transition">
                  ✅ {item.category}
                </h3>
                <p className="text-sm sm:text-base text-white/90 font-light leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
