import { prisma } from './lib/db';

async function seedFormations() {
  try {
    console.log('🌱 Seeding formations...');

    const formations = [
      {
        name: 'Administration Réseaux & Télécoms',
        slug: 'administration-reseaux-telecoms',
        duration: '5 jours',
        level: 'Intermédiaire',
        description: 'Conception, installation, maintenance et sécurisation des infrastructures réseaux et télécom.',
        content: 'Formation complète sur les réseaux et télécommunications',
        objectives: 'Maîtriser l\'administration des réseaux d\'entreprise',
        price: 2500,
        maxParticipants: 20,
        published: true,
      },
      {
        name: 'Infrastructure IT & Virtualisation',
        slug: 'infrastructure-it-virtualisation',
        duration: '5 jours',
        level: 'Intermédiaire',
        description: 'Déploiement de serveurs, gestion des données, virtualisation et cloud computing.',
        content: 'Formation sur l\'infrastructure IT moderne',
        objectives: 'Déployer et gérer une infrastructure IT scalable',
        price: 2800,
        maxParticipants: 20,
        published: true,
      },
      {
        name: 'Cybersécurité & Digital Trust',
        slug: 'cybersecurite-digital-trust',
        duration: '6 jours',
        level: 'Avancé',
        description: 'Sécurité informatique, protection des données, audit de sécurité et conformité.',
        content: 'Formation avancée en cybersécurité',
        objectives: 'Mettre en place une stratégie de sécurité informatique',
        price: 3200,
        maxParticipants: 15,
        published: true,
      },
      {
        name: 'Certification Professionnelle',
        slug: 'certification-professionnelle',
        duration: '3 semaines',
        level: 'Avancé',
        description: 'Préparation aux certifications reconnues internationales (Cisco, CompTIA, Microsoft, etc.).',
        content: 'Préparation intensive aux certifications',
        objectives: 'Réussir une certification professionnelle reconnue',
        price: 4000,
        maxParticipants: 12,
        published: true,
      },
    ];

    for (const formation of formations) {
      const existing = await prisma.formation.findUnique({
        where: { slug: formation.slug },
      });

      if (!existing) {
        const created = await prisma.formation.create({
          data: formation,
        });
        console.log(`✅ Created formation: ${created.name} (ID: ${created.id})`);
      } else {
        console.log(`⏭️  Formation already exists: ${formation.name}`);
      }
    }

    // Seed sessions for each formation
    console.log('🌱 Seeding sessions...');
    
    const formationSlugs = formations.map(f => f.slug);
    const allFormations = await prisma.formation.findMany({
      where: { slug: { in: formationSlugs } },
    });

    for (const formation of allFormations) {
      // Check if sessions already exist
      const existingSessionsCount = await prisma.sessionFormation.count({
        where: { formationId: formation.id },
      });

      if (existingSessionsCount === 0) {
        // Create 2 sessions for each formation
        const now = new Date();
        const sessions = [
          {
            formationId: formation.id,
            startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
            endDate: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
            location: 'Paris',
            capacity: formation.maxParticipants,
            available: formation.maxParticipants,
            status: 'ouverte',
          },
          {
            formationId: formation.id,
            startDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            endDate: new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000), // 35 days from now
            location: 'Lyon',
            capacity: formation.maxParticipants,
            available: formation.maxParticipants,
            status: 'ouverte',
          },
        ];

        for (const session of sessions) {
          const createdSession = await prisma.sessionFormation.create({
            data: session,
          });
          console.log(`✅ Created session for ${formation.name}: ${createdSession.startDate.toLocaleDateString('fr-FR')} at ${session.location}`);
        }
      } else {
        console.log(`⏭️  Sessions already exist for ${formation.name}`);
      }
    }

    console.log('🌱 Seeding completed!');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedFormations();
