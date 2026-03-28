import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/db';

export async function seedRoutes(app: FastifyInstance) {
  // POST - Run seed to create demo sessions
  app.post('/seed-sessions', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      console.log('🌱 Starting seed for sessions...');

      // Get all formations
      const formations = await prisma.formation.findMany({
        where: { published: true },
      });

      console.log(`Found ${formations.length} formations`);

      let sessionsCreated = 0;

      for (const formation of formations) {
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
            sessionsCreated++;
          }
        } else {
          console.log(`⏭️  Sessions already exist for ${formation.name}`);
        }
      }

      console.log(`🌱 Seed completed! Created ${sessionsCreated} sessions`);
      
      return reply.send({
        success: true,
        message: `Seed completed! Created ${sessionsCreated} sessions`,
        sessionsCreated,
      });
    } catch (error: any) {
      console.error('❌ Seed error:', error);
      return reply.code(500).send({
        success: false,
        error: error.message,
      });
    }
  });
}
