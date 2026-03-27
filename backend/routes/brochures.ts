// backend/routes/brochures.ts
import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/db';

export async function brochureRoutes(app: FastifyInstance) {
  // Get all brochures (published only)
  app.get('/brochures', async (request, reply) => {
    try {
      const brochures = await prisma.brochure.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send({
        success: true,
        data: brochures,
      });
    } catch (error) {
      console.error('Error fetching brochures:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch brochures',
      });
    }
  });

  // Get single brochure
  app.get('/brochures/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const brochureId = parseInt(id);

      const brochure = await prisma.brochure.findUnique({
        where: { id: brochureId },
      });

      if (!brochure) {
        return reply.status(404).send({
          success: false,
          error: 'Brochure not found',
        });
      }

      return reply.send({
        success: true,
        data: brochure,
      });
    } catch (error) {
      console.error('Error fetching brochure:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch brochure',
      });
    }
  });

  // Update brochure (publish/unpublish)
  app.put('/brochures/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const brochureId = parseInt(id);
      const { published, name, description, type } = request.body as any;

      const updatedBrochure = await prisma.brochure.update({
        where: { id: brochureId },
        data: {
          ...(published !== undefined && { published }),
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(type && { type }),
        },
      });

      return reply.send({
        success: true,
        data: updatedBrochure,
        message: 'Brochure updated successfully',
      });
    } catch (error) {
      console.error('Error updating brochure:', error);
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update brochure',
      });
    }
  });

  // Delete brochure
  app.delete<{ Params: { id: string } }>(
    '/brochures/:id',
    async (request, reply) => {
      try {
        const { id } = request.params;
        const brochureId = parseInt(id);

        await prisma.brochure.delete({
          where: { id: brochureId },
        });

        return reply.send({
          success: true,
          message: 'Brochure deleted successfully',
        });
      } catch (error) {
        console.error('Error deleting brochure:', error);
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to delete brochure',
        });
      }
    }
  );
}
