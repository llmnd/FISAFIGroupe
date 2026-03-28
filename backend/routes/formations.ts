// backend/routes/formations.ts
import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/db';

export async function formationRoutes(app: FastifyInstance) {
  // Get all published formations
  app.get('/formations', async (request, reply) => {
    try {
      const { page, limit } = request.query as {
        page?: string;
        limit?: string;
      };

      const pageNum = parseInt(page || '1') || 1;
      const limitNum = parseInt(limit || '10') || 10;
      const skip = (pageNum - 1) * limitNum;

      const [formations, total] = await Promise.all([
        prisma.formation.findMany({
          where: { published: true },
          skip,
          take: limitNum,
          include: {
            sessions: {
              where: {
                status: { in: ['ouverte', 'complète'] },
              },
            },
          },
        }),
        prisma.formation.count({ where: { published: true } }),
      ]);

      return reply.send({
        success: true,
        data: {
          formations,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error) {
      console.error('Get formations error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch formations',
      });
    }
  });

  // Get formation by ID or slug
  app.get('/formations/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const formation = await prisma.formation.findFirst({
        where: {
          OR: [
            { id: parseInt(id) || 0 },
            { slug: id },
          ],
          published: true,
        },
        include: {
          sessions: {
            where: { status: { in: ['ouverte', 'complète'] } },
            orderBy: { startDate: 'asc' },
          },
        },
      });

      if (!formation) {
        return reply.status(404).send({
          success: false,
          error: 'Formation not found',
        });
      }

      return reply.send({
        success: true,
        data: formation,
      });
    } catch (error) {
      console.error('Get formation error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch formation',
      });
    }
  });

  // Create formation (protected)
  app.post('/formations', async (request, reply) => {
    try {
      await request.jwtVerify();

      const { name, duration, level, description, content, objectives, price, maxParticipants } = request.body as any;

      const formation = await prisma.formation.create({
        data: {
          name,
          slug: name.toLowerCase().replace(/\s+/g, '-'),
          duration,
          level,
          description,
          content,
          objectives,
          price: price ? parseFloat(price) : null,
          maxParticipants: maxParticipants || 20,
          published: false,
        },
      });

      return reply.status(201).send({
        success: true,
        data: formation,
        message: 'Formation created successfully',
      });
    } catch (error) {
      console.error('Create formation error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to create formation',
      });
    }
  });

  // Update formation (protected)
  app.patch('/formations/:id', async (request, reply) => {
    try {
      await request.jwtVerify();

      const { id } = request.params as { id: string };
      const updates = request.body as any;

      const formation = await prisma.formation.update({
        where: { id: parseInt(id) },
        data: updates,
      });

      return reply.send({
        success: true,
        data: formation,
        message: 'Formation updated successfully',
      });
    } catch (error) {
      console.error('Update formation error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to update formation',
      });
    }
  });

  // Create inscription to formation (public)
  app.post('/inscriptions-formations', async (request, reply) => {
    try {
      const { firstName, lastName, email, phone, formationId, message } = request.body as any;

      // Validate required fields
      if (!firstName || !lastName || !email || !phone || !formationId) {
        return reply.status(400).send({
          success: false,
          error: 'Missing required fields: firstName, lastName, email, phone, formationId',
        });
      }

      // Verify formation exists
      const formation = await prisma.formation.findUnique({
        where: { id: parseInt(formationId) },
      });

      if (!formation) {
        return reply.status(404).send({
          success: false,
          error: 'Formation not found',
        });
      }

      // Get or create a pending session for this formation
      let session = await prisma.sessionFormation.findFirst({
        where: {
          formationId: parseInt(formationId),
          status: 'ouverte',
        },
      });

      if (!session) {
        session = await prisma.sessionFormation.create({
          data: {
            formationId: parseInt(formationId),
            startDate: new Date(),
            endDate: new Date(),
            location: 'À déterminer',
            capacity: 100,
            available: 100,
            status: 'ouverte',
          },
        });
      }

      // Check if email already registered for this formation
      const existingInscription = await prisma.inscriptionFormation.findFirst({
        where: {
          formationId: parseInt(formationId),
          email,
        },
      });

      if (existingInscription) {
        return reply.status(400).send({
          success: false,
          error: 'Email already registered for this formation',
        });
      }

      // Create inscription
      const inscription = await prisma.inscriptionFormation.create({
        data: {
          formationId: parseInt(formationId),
          sessionId: session.id,
          firstName,
          lastName,
          email,
          phone,
          status: 'liste_attente',
        },
        include: {
          formation: { select: { name: true } },
          session: { select: { startDate: true, location: true } },
        },
      });

      return reply.status(201).send({
        success: true,
        data: inscription,
        message: 'Inscription successfully created. We will contact you soon.',
      });
    } catch (error) {
      console.error('Create inscription error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to create inscription',
      });
    }
  });

  // Get all inscriptions (protected - admin only)
  app.get('/inscriptions-formations', async (request, reply) => {
    try {
      await request.jwtVerify();

      const inscriptions = await prisma.inscriptionFormation.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          formation: { select: { id: true, name: true } },
          session: { select: { id: true, startDate: true, location: true } },
        },
      });

      return reply.send({
        success: true,
        data: inscriptions,
      });
    } catch (error) {
      console.error('Get inscriptions error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch inscriptions',
      });
    }
  });

  // Get inscriptions for current user (protected)
  app.get('/my-inscriptions', async (request, reply) => {
    try {
      await request.jwtVerify();
      const user = request.user as any;

      const inscriptions = await prisma.inscriptionFormation.findMany({
        where: { email: user.email },
        orderBy: { createdAt: 'desc' },
        include: {
          formation: { select: { id: true, name: true, description: true } },
          session: { select: { id: true, startDate: true, endDate: true, location: true } },
        },
      });

      return reply.send({
        success: true,
        data: inscriptions,
      });
    } catch (error) {
      console.error('Get my inscriptions error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch inscriptions',
      });
    }
  });
}
