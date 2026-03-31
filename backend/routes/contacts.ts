import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/db';

export async function contactsRoutes(app: FastifyInstance) {
  // Public: submit a contact message
  app.post('/inscriptions', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { name, email, phone, subject, message } = request.body as any;
      if (!name || !email || !subject || !message) {
        return reply.code(400).send({ success: false, error: 'Missing fields' });
      }

      const created = await prisma.inscription.create({ data: { name, email, phone, subject, message } });

      return reply.code(201).send({ success: true, data: created, message: 'Message received' });
    } catch (error: any) {
      console.error('Create contact error:', error);
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  // Admin: list contact messages
  app.get('/inscriptions', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      const user = request.user as any;
      // verify role from DB if role not present
      const dbUser = user?.id ? await prisma.user.findUnique({ where: { id: user.id } }) : null;
      if (!dbUser || dbUser.role !== 'admin') return reply.code(403).send({ success: false, error: 'Forbidden' });

      const list = await prisma.inscription.findMany({ orderBy: { createdAt: 'desc' } });
      return reply.send({ success: true, data: list });
    } catch (error: any) {
      console.error('List contacts error:', error);
      if (error.name === 'UnauthorizedError') return reply.code(401).send({ success: false, error: 'Unauthorized' });
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  // Admin: mark message as read
  app.patch('/inscriptions/:id/read', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      const user = request.user as any;
      const dbUser = user?.id ? await prisma.user.findUnique({ where: { id: user.id } }) : null;
      if (!dbUser || dbUser.role !== 'admin') return reply.code(403).send({ success: false, error: 'Forbidden' });

      const { id } = request.params as any;
      const updated = await prisma.inscription.update({ where: { id: parseInt(id) }, data: { status: 'read' } });
      return reply.send({ success: true, data: updated });
    } catch (error: any) {
      console.error('Mark read error:', error);
      return reply.code(500).send({ success: false, error: error.message });
    }
  });
}
