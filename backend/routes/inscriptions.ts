// backend/routes/inscriptions.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/db';

export async function inscriptionsRoutes(app: FastifyInstance) {
  // Test endpoint (no auth)
  app.get('/inscriptions-test', async (request: FastifyRequest, reply: FastifyReply) => {
    console.log("GET /inscriptions-test - No auth required");
    const count = await prisma.inscriptionFormation.count();
    return reply.send({
      success: true,
      message: 'Test endpoint working',
      totalInscriptions: count,
    });
  });

  // GET - List inscriptions (admin only) with optional filters
  app.get('/inscriptions-manage', async (request: FastifyRequest, reply: FastifyReply) => {
    console.log("GET /inscriptions-manage - Auth header:", request.headers.authorization ? "present" : "missing");
    try {
      await request.jwtVerify();
      console.log("JWT verified successfully");

      const { status, sessionId } = request.query as {
        status?: string;
        sessionId?: string;
      };

      const where: any = {};
      if (status && status !== 'all') {
        where.status = status;
      }
      if (sessionId) {
        const parsed = parseInt(sessionId);
        if (!isNaN(parsed)) {
          where.sessionId = parsed;
        }
      }

      const inscriptions = await prisma.inscriptionFormation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          formation: { select: { id: true, name: true, slug: true } },
          session: { select: { id: true, startDate: true, location: true, capacity: true, available: true } },
        },
      });

      return reply.send({
        success: true,
        data: inscriptions,
      });
    } catch (error: any) {
      console.error('Get inscriptions error:', error.message, error.code);
      if (error.name === 'UnauthorizedError' || error.code === 'FST_JWT_NO_AUTHORIZATION_FOR_ROUTE') {
        return reply.code(401).send({ success: false, error: 'Unauthorized' });
      }
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  // PATCH - Accept or reject an inscription
  app.patch('/inscriptions-manage', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      console.log("PATCH /inscriptions-manage - Request body:", request.body);
      await request.jwtVerify();

      const { id, action } = request.body as {
        id?: number;
        action?: string;
      };

      console.log("Received id:", id, "action:", action);

      if (id === undefined || id === null || !action) {
        console.error("Missing id or action. id=", id, "action=", action);
        return reply.code(400).send({
          success: false,
          error: 'Missing id or action',
          received: { id, action },
        });
      }

      if (!['accept', 'reject'].includes(action)) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid action. Must be "accept" or "reject"',
        });
      }

      // Get the inscription
      const inscription = await prisma.inscriptionFormation.findUnique({
        where: { id },
        include: { session: true },
      });

      if (!inscription) {
        return reply.code(404).send({
          success: false,
          error: 'Inscription not found',
        });
      }

      if (!inscription.session) {
        return reply.code(400).send({
          success: false,
          error: 'Session not found for this inscription',
        });
      }

      let updatedInscription: any;
      let updatedSession: any;

      if (action === 'accept') {
        // If inscription is on waitlist or pending, move to confirmed and decrement available
        if (inscription.status === 'liste_attente' || inscription.status === 'demande_en_attente') {
          console.log(`Accepting inscription ${id} with status ${inscription.status}`);
          // Decrement available capacity
          const newAvailable = Math.max(0, inscription.session.available - 1);
          const newStatus = newAvailable === 0 ? 'complète' : inscription.session.status;

          updatedSession = await prisma.sessionFormation.update({
            where: { id: inscription.session.id },
            data: {
              available: newAvailable,
              status: newStatus,
            },
          });

          updatedInscription = await prisma.inscriptionFormation.update({
            where: { id },
            data: { status: 'confirme' },
            include: {
              formation: { select: { id: true, name: true, slug: true } },
              session: { select: { id: true, startDate: true, location: true, capacity: true, available: true } },
            },
          });
        } else {
          return reply.code(400).send({
            success: false,
            error: `Can only accept inscriptions with liste_attente or demande_en_attente status. Current: ${inscription.status}`,
          });
        }
      } else if (action === 'reject') {
        // If inscription is confirmed, increment available and update session status
        if (inscription.status === 'confirme') {
          console.log(`Rejecting confirmed inscription ${id}`);
          const newAvailable = inscription.session.available + 1;
          const newStatus = inscription.session.status === 'complète' && newAvailable > 0 ? 'ouverte' : inscription.session.status;

          updatedSession = await prisma.sessionFormation.update({
            where: { id: inscription.session.id },
            data: {
              available: newAvailable,
              status: newStatus,
            },
          });

          updatedInscription = await prisma.inscriptionFormation.update({
            where: { id },
            data: { status: 'annule' },
            include: {
              formation: { select: { id: true, name: true, slug: true } },
              session: { select: { id: true, startDate: true, location: true, capacity: true, available: true } },
            },
          });
        } else if (inscription.status === 'liste_attente' || inscription.status === 'demande_en_attente') {
          console.log(`Rejecting waitlist inscription ${id} with status ${inscription.status}`);
          // Just mark as cancelled without changing capacity
          updatedInscription = await prisma.inscriptionFormation.update({
            where: { id },
            data: { status: 'annule' },
            include: {
              formation: { select: { id: true, name: true, slug: true } },
              session: { select: { id: true, startDate: true, location: true, capacity: true, available: true } },
            },
          });
        } else {
          return reply.code(400).send({
            success: false,
            error: `Can only reject inscriptions with confirme, liste_attente or demande_en_attente status. Current: ${inscription.status}`,
          });
        }
      }

      return reply.send({
        success: true,
        data: updatedInscription,
        message: action === 'accept' ? 'Inscription accepted' : 'Inscription rejected',
      });
    } catch (error: any) {
      console.error('Update inscription error:', error);
      if (error.name === 'UnauthorizedError' || error.code === 'FST_JWT_NO_AUTHORIZATION_FOR_ROUTE') {
        return reply.code(401).send({ success: false, error: 'Unauthorized' });
      }
      return reply.code(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // DELETE - allow a user to cancel their own inscription
  app.delete('/inscriptions/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      const user = request.user as any;
      const { id } = request.params as { id: string };

      const inscriptionId = parseInt(id) || 0;
      const inscription = await prisma.inscriptionFormation.findUnique({ where: { id: inscriptionId }, include: { session: true } });
      if (!inscription) {
        return reply.code(404).send({ success: false, error: 'Inscription not found' });
      }

      // Only the owner (email) can cancel their inscription
      if (inscription.email !== user.email) {
        return reply.code(403).send({ success: false, error: 'Forbidden' });
      }

      // If inscription was confirmed, free a spot on the session
      if (inscription.status === 'confirme' && inscription.session) {
        const newAvailable = inscription.session.available + 1;
        const newStatus = inscription.session.status === 'complète' && newAvailable > 0 ? 'ouverte' : inscription.session.status;
        await prisma.sessionFormation.update({ where: { id: inscription.session.id }, data: { available: newAvailable, status: newStatus } });
      }

      // Mark inscription as cancelled
      const updated = await prisma.inscriptionFormation.update({ where: { id: inscriptionId }, data: { status: 'annule' } });

      return reply.send({ success: true, data: updated, message: 'Inscription cancelled' });
    } catch (error: any) {
      console.error('Delete inscription error:', error);
      if (error.name === 'UnauthorizedError') return reply.code(401).send({ success: false, error: 'Unauthorized' });
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  // DELETE (admin) - permanently remove inscriptions that are cancelled/rejected
  app.delete('/inscriptions-manage/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      const tokenPayload = request.user as any;
      // Fetch full user record from DB to check role (tokens do not include role)
      const dbUser = tokenPayload?.id ? await prisma.user.findUnique({ where: { id: tokenPayload.id } }) : null;
      if (!dbUser || dbUser.role !== 'admin') {
        return reply.code(403).send({ success: false, error: 'Forbidden' });
      }

      const { id } = request.params as { id: string };
      const inscriptionId = parseInt(id) || 0;

      const inscription = await prisma.inscriptionFormation.findUnique({ where: { id: inscriptionId } });
      if (!inscription) {
        return reply.code(404).send({ success: false, error: 'Inscription not found' });
      }

      // Only allow permanent deletion for inscriptions that are cancelled or not confirmed
      // (safe to remove from DB when they haven't consumed a confirmed spot)
      const allowedStatuses = ['annule', 'liste_attente', 'demande_en_attente'];
      if (!allowedStatuses.includes(inscription.status)) {
        return reply.code(400).send({ success: false, error: `Can only delete inscriptions with status: ${allowedStatuses.join(', ')}` });
      }

      await prisma.inscriptionFormation.delete({ where: { id: inscriptionId } });

      return reply.send({ success: true, message: 'Inscription permanently deleted' });
    } catch (error: any) {
      console.error('Admin delete inscription error:', error);
      if (error.name === 'UnauthorizedError') return reply.code(401).send({ success: false, error: 'Unauthorized' });
      return reply.code(500).send({ success: false, error: error.message });
    }
  });
}
