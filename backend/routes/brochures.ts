// backend/routes/brochures.ts
import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/db';
import { uploadFileToCloudinary } from '../services/cloudinaryService';

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

  // Upload brochure (admin only)
  app.post(
    '/brochures/upload',
    async (request, reply) => {
      try {
        await request.jwtVerify();

        const { fileName, fileBuffer, folder = 'brochures' } = request.body as any;

        if (!fileName || !fileBuffer) {
          return reply.status(400).send({
            success: false,
            error: 'fileName and fileBuffer are required',
          });
        }

        // Verify user is admin
        const user = await prisma.user.findUnique({
          where: { id: (request.user as any).id },
        });

        if (!user || !user.isAdmin) {
          return reply.status(403).send({
            success: false,
            error: 'Only admins can upload brochures',
          });
        }

        console.log('🔍 Upload request received on backend:', {
          fileName,
          hasBuffer: !!fileBuffer,
          cloudinaryEnv: {
            hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
            hasPreset: !!process.env.CLOUDINARY_UPLOAD_PRESET,
          },
        });

        // Upload to Cloudinary
        const url = await uploadFileToCloudinary(
          Buffer.from(fileBuffer, 'base64'),
          fileName,
          folder
        );

        console.log('📤 Cloudinary upload success:', { url });

        // Save to database
        const brochure = await prisma.brochure.create({
          data: {
            name: fileName.replace(/\.[^/.]+$/, ''),
            fileUrl: url,
            published: false,
            type: 'document',
          },
        });

        return reply.send({
          success: true,
          data: brochure,
          message: 'Brochure uploaded successfully',
        });
      } catch (error) {
        console.error('❌ Error uploading brochure:', error);
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to upload brochure',
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    }
  );
}
