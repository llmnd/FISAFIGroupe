// backend/routes/brochures.ts
import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/db';
import { CloudinaryService } from '../services/cloudinaryService';

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

  // Get all brochures for admin (admin only)
  app.get('/brochures/manage', async (request, reply) => {
    try {
      await request.jwtVerify();

      const brochures = await prisma.brochure.findMany({
        orderBy: { createdAt: 'desc' },
      });

      return reply.send({
        success: true,
        data: brochures,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Error fetching brochures for admin:', {
        errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return reply.status(500).send({
        success: false,
        error: errorMessage || 'Failed to fetch brochures',
      });
    }
  });

  // Download brochure - MUST come before /brochures/:id
  app.get<{ Params: { id: string } }>(
    '/brochures/:id/download',
    async (request, reply) => {
      try {
        const { id } = request.params;
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

        // Check if published (public access) or user is authenticated admin
        if (!brochure.published) {
          try {
            await request.jwtVerify();
            const user = await prisma.user.findUnique({
              where: { id: (request.user as any).id },
            });
            if (!user || user.role !== 'admin') {
              return reply.status(403).send({
                success: false,
                error: 'Not authorized to download this brochure',
              });
            }
          } catch {
            return reply.status(403).send({
              success: false,
              error: 'Only published brochures can be downloaded',
            });
          }
        }

        // Redirect to Cloudinary with download disposition headers
        reply.header('Content-Disposition', `attachment; filename="${brochure.name}"`);
        
        // Fetch and stream file from Cloudinary
        const fileResponse = await fetch(brochure.fileUrl);
        if (!fileResponse.ok) {
          throw new Error(`Cloudinary returned ${fileResponse.status}`);
        }

        const contentType = fileResponse.headers.get('content-type') || 'application/octet-stream';
        const contentLength = fileResponse.headers.get('content-length');
        
        reply.type(contentType);
        if (contentLength) {
          reply.header('Content-Length', contentLength);
        }
        
        // Stream the response
        if (fileResponse.body) {
          return reply.send(fileResponse.body);
        }
        
        throw new Error('No response body from Cloudinary');
      } catch (error) {
        console.error('Error downloading brochure:', error);
        return reply.status(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to download brochure',
        });
      }
    }
  );

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

      const dataToUpdate: any = {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(type && { type }),
      };

      // If publishing, set publishedAt to now
      if (published === true) {
        dataToUpdate.published = true;
        dataToUpdate.publishedAt = new Date();
      }
      // If unpublishing, clear publishedAt
      else if (published === false) {
        dataToUpdate.published = false;
        dataToUpdate.publishedAt = null;
      }

      const updatedBrochure = await prisma.brochure.update({
        where: { id: brochureId },
        data: dataToUpdate,
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

        if (!user || user.role !== 'admin') {
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
        const uploadResponse = await CloudinaryService.uploadFile(
          Buffer.from(fileBuffer, 'base64'),
          fileName,
          folder as 'brochures' | 'articles' | 'images'
        );
        const url = uploadResponse.secure_url || uploadResponse.url;

        console.log('📤 Cloudinary upload success:', { url });

        // Save to database
        const brochure = await prisma.brochure.create({
          data: {
            name: fileName,
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

