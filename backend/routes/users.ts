// backend/routes/users.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/db';

export async function usersRoutes(app: FastifyInstance) {
  // Get all users (admin only)
  app.get('/users', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          active: true,
          createdAt: true,
        },
      });

      return reply.send(users);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // Get user by ID
  app.get('/users/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();

      const { id } = request.params as { id: string };

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          active: true,
          createdAt: true,
        },
      });

      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      return reply.send(user);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // Update user
  app.put('/users/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();

      const { id } = request.params as { id: string };
      const { email, firstName, lastName } = request.body as any;

      const user = await prisma.user.update({
        where: { id },
        data: {
          email,
          firstName,
          lastName,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          active: true,
          createdAt: true,
        },
      });

      return reply.send(user);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // Delete user
  app.delete('/users/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();

      const { id } = request.params as { id: string };

      await prisma.user.delete({
        where: { id },
      });

      return reply.send({ message: 'User deleted' });
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // Toggle user active status
  app.patch('/users/:id/toggle-active', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();

      const { id } = request.params as { id: string };

      const user = await prisma.user.findUnique({
        where: { id },
        select: { active: true },
      });

      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { active: !user.active },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          active: true,
          createdAt: true,
        },
      });

      return reply.send(updatedUser);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });
}
