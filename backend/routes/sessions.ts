import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/db';

export async function sessionRoutes(app: FastifyInstance) {
  // Get all available sessions
  app.get('/sessions', async (request, reply) => {
    try {
      const sessions = await prisma.sessionFormation.findMany({
        where: {
          status: { in: ['ouverte', 'complète'] },
        },
        include: {
          formation: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
        orderBy: { startDate: 'asc' },
      });

      // Flat map sessions with formation title
      const formattedSessions = sessions.map((session) => ({
        id: session.id,
        formationId: session.formationId,
        formationTitle: session.formation?.name || 'Formation',
        startDate: session.startDate,
        endDate: session.endDate,
        location: session.location,
        capacity: session.capacity,
        available: session.available,
        status: session.status,
      }));

      return reply.send({
        success: true,
        data: formattedSessions,
      });
    } catch (error) {
      console.error('Get sessions error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch sessions',
      });
    }
  });

  // Get session by ID
  app.get('/sessions/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const session = await prisma.sessionFormation.findUnique({
        where: { id: parseInt(id) || 0 },
        include: {
          formation: true,
        },
      });

      if (!session) {
        return reply.status(404).send({
          success: false,
          error: 'Session not found',
        });
      }

      return reply.send({
        success: true,
        data: {
          id: session.id,
          formationId: session.formationId,
          formationTitle: session.formation?.name || 'Formation',
          startDate: session.startDate,
          endDate: session.endDate,
          location: session.location,
          capacity: session.capacity,
          available: session.available,
          status: session.status,
          formation: session.formation,
        },
      });
    } catch (error) {
      console.error('Get session error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch session',
      });
    }
  });

  // Get sessions by formation ID
  app.get('/formations/:formationId/sessions', async (request, reply) => {
    try {
      const { formationId } = request.params as { formationId: string };

      const sessions = await prisma.sessionFormation.findMany({
        where: {
          formationId: parseInt(formationId) || 0,
          status: { in: ['ouverte', 'complète'] },
        },
        orderBy: { startDate: 'asc' },
      });

      const formattedSessions = sessions.map((session) => ({
        id: session.id,
        formationId: session.formationId,
        startDate: session.startDate,
        endDate: session.endDate,
        location: session.location,
        capacity: session.capacity,
        available: session.available,
        status: session.status,
      }));

      return reply.send({
        success: true,
        data: formattedSessions,
      });
    } catch (error) {
      console.error('Get formation sessions error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch sessions',
      });
    }
  });

  // Update session (protected)
  app.put('/sessions/:id', async (request, reply) => {
    try {
      await request.jwtVerify();

      const { id } = request.params as { id: string };
      const { startDate, endDate, location, capacity, available, status } = request.body as {
        startDate?: string;
        endDate?: string;
        location?: string;
        capacity?: number;
        available?: number;
        status?: string;
      };

      const session = await prisma.sessionFormation.update({
        where: { id: parseInt(id) || 0 },
        data: {
          ...(startDate && { startDate: new Date(startDate) }),
          ...(endDate && { endDate: new Date(endDate) }),
          ...(location && { location }),
          ...(capacity && { capacity }),
          ...(available !== undefined && { available }),
          ...(status && { status }),
        },
        include: { formation: true },
      });

      return reply.send({
        success: true,
        data: session,
      });
    } catch (error) {
      console.error('Update session error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to update session',
      });
    }
  });

  // Delete session (protected)
  app.delete('/sessions/:id', async (request, reply) => {
    try {
      await request.jwtVerify();

      const { id } = request.params as { id: string };

      await prisma.sessionFormation.delete({
        where: { id: parseInt(id) || 0 },
      });

      return reply.send({
        success: true,
        message: 'Session deleted successfully',
      });
    } catch (error) {
      console.error('Delete session error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to delete session',
      });
    }
  });
}
