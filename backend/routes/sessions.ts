import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/db';
import { getSessionLifecycleStatus } from '../lib/sessionAvailability';

export async function sessionRoutes(app: FastifyInstance) {
  // Get all available sessions
  app.get('/sessions', async (request, reply) => {
    try {
      const sessions = await prisma.sessionFormation.findMany({
        where: { status: { not: 'annulée' } },
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
        registrationDeadline: session.registrationDeadline,
        location: session.location,
        capacity: session.capacity,
        available: session.available,
        status: getSessionLifecycleStatus(session),
        registrationOpen: getSessionLifecycleStatus(session) === 'ouverte',
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
          registrationDeadline: session.registrationDeadline,
          location: session.location,
          capacity: session.capacity,
          available: session.available,
          status: getSessionLifecycleStatus(session),
          registrationOpen: getSessionLifecycleStatus(session) === 'ouverte',
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
          status: { not: 'annulée' },
        },
        orderBy: { startDate: 'asc' },
      });

      const formattedSessions = sessions.map((session) => ({
        id: session.id,
        formationId: session.formationId,
        startDate: session.startDate,
        endDate: session.endDate,
        registrationDeadline: session.registrationDeadline,
        location: session.location,
        capacity: session.capacity,
        available: session.available,
        status: getSessionLifecycleStatus(session),
        registrationOpen: getSessionLifecycleStatus(session) === 'ouverte',
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

  // Create session (protected)
  app.post('/sessions', async (request, reply) => {
    try {
      await request.jwtVerify();

      const { formationId, startDate, endDate, registrationDeadline, location, capacity } = request.body as {
        formationId: number;
        startDate: string;
        endDate: string;
        registrationDeadline: string;
        location: string;
        capacity: number;
      };
      const parsedStartDate = new Date(startDate);
      const parsedEndDate = new Date(endDate);
      const parsedRegistrationDeadline = new Date(registrationDeadline);
      if (
        !Number.isSafeInteger(formationId) ||
        !Number.isFinite(parsedStartDate.getTime()) ||
        !Number.isFinite(parsedEndDate.getTime()) ||
        !Number.isFinite(parsedRegistrationDeadline.getTime()) ||
        parsedEndDate < parsedStartDate ||
        parsedRegistrationDeadline >= parsedStartDate
      ) {
        return reply.status(400).send({
          success: false,
          error: "La date limite d'inscription doit précéder le début de la session, et la date de fin doit être après son début.",
        });
      }

      const created = await prisma.sessionFormation.create({
        data: {
          formationId,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          registrationDeadline: parsedRegistrationDeadline,
          location,
          capacity,
          available: capacity,
          status: 'ouverte',
        },
        include: { formation: true },
      });

      return reply.send({ success: true, data: created });
    } catch (error) {
      console.error('Create session error:', error);
      return reply.status(500).send({ success: false, error: 'Failed to create session' });
    }
  });

  // Update session (protected)
  app.put('/sessions/:id', async (request, reply) => {
    try {
      await request.jwtVerify();

      const { id } = request.params as { id: string };
      const { startDate, endDate, registrationDeadline, location, capacity, available, status } = request.body as {
        startDate?: string;
        endDate?: string;
        registrationDeadline?: string;
        location?: string;
        capacity?: number;
        available?: number;
        status?: string;
      };
      if (startDate || endDate || registrationDeadline) {
        const existing = await prisma.sessionFormation.findUnique({
          where: { id: parseInt(id) || 0 },
        });
        if (!existing) {
          return reply.code(404).send({ success: false, error: 'Session not found' });
        }
        const nextStart = startDate ? new Date(startDate) : existing.startDate;
        const nextEnd = endDate ? new Date(endDate) : existing.endDate;
        const nextDeadline = registrationDeadline
          ? new Date(registrationDeadline)
          : existing.registrationDeadline;
        if (
          !Number.isFinite(nextStart.getTime()) ||
          !Number.isFinite(nextEnd.getTime()) ||
          !Number.isFinite(nextDeadline.getTime()) ||
          nextEnd < nextStart ||
          nextDeadline >= nextStart
        ) {
          return reply.code(400).send({
            success: false,
            error: "La date limite d'inscription doit précéder le début de la session, et la date de fin doit être après son début.",
          });
        }
      }

      const session = await prisma.sessionFormation.update({
        where: { id: parseInt(id) || 0 },
        data: {
          ...(startDate && { startDate: new Date(startDate) }),
          ...(endDate && { endDate: new Date(endDate) }),
          ...(registrationDeadline && { registrationDeadline: new Date(registrationDeadline) }),
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
