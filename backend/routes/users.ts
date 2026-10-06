// backend/routes/users.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/db';

async function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<boolean> {
  try {
    await request.jwtVerify();
  } catch {
    reply.code(401).send({ error: 'Authentication required' });
    return false;
  }

  const userId = (request.user as { id?: string } | undefined)?.id;
  const actor = userId
    ? await prisma.user.findUnique({ where: { id: userId }, select: { role: true, active: true } })
    : null;
  if (!actor?.active) {
    reply.code(401).send({ error: 'Authentication required' });
    return false;
  }
  if (actor.role !== 'admin') {
    reply.code(403).send({ error: 'Administrator access required' });
    return false;
  }
  return true;
}

export async function usersRoutes(app: FastifyInstance) {
  // Get all users (admin only)
  app.get('/users', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!await requireAdmin(request, reply)) return;
      
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          employeeRole: true,
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
      if (!await requireAdmin(request, reply)) return;

      const { id } = request.params as { id: string };

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          employeeRole: true,
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
      if (!await requireAdmin(request, reply)) return;

      const { id } = request.params as { id: string };
      const { email, firstName, lastName, phone, employeeRole } = request.body as {
        email?: string;
        firstName?: string;
        lastName?: string;
        phone?: string | null;
        employeeRole?: string | null;
      };
      const allowedEmployeeRoles = ['manager', 'seller', 'cashier', 'stock', 'accountant'];
      if (
        employeeRole !== undefined &&
        employeeRole !== null &&
        !allowedEmployeeRoles.includes(employeeRole)
      ) {
        return reply.code(400).send({ error: 'Invalid employee role' });
      }

      const user = await prisma.user.update({
        where: { id },
        data: {
          email,
          firstName,
          lastName,
          ...(phone !== undefined ? { phone } : {}),
          ...(employeeRole !== undefined ? { employeeRole } : {}),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          employeeRole: true,
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
      if (!await requireAdmin(request, reply)) return;

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
      if (!await requireAdmin(request, reply)) return;

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
          employeeRole: true,
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
