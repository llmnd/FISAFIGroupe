// backend/routes/articles.ts
import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/db';

export async function articleRoutes(app: FastifyInstance) {
  // Get all published articles
  app.get('/articles', async (request, reply) => {
    try {
      const { page, limit, category } = request.query as {
        page?: string;
        limit?: string;
        category?: string;
      };

      const pageNum = parseInt(page || '1') || 1;
      const limitNum = parseInt(limit || '10') || 10;
      const skip = (pageNum - 1) * limitNum;

      const where: any = { published: true };
      if (category) where.category = category;

      const [articles, total] = await Promise.all([
        prisma.article.findMany({
          where,
          orderBy: { publishedAt: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.article.count({ where }),
      ]);

      return reply.send({
        success: true,
        data: {
          articles,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error) {
      console.error('Get articles error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch articles',
      });
    }
  });

  // Get all articles for admin management (protected)
  app.get('/articles/manage', async (request, reply) => {
    try {
      await request.jwtVerify();

      const articles = await prisma.article.findMany({
        orderBy: [
          { publishedAt: 'desc' },
          { createdAt: 'desc' }
        ],
      });

      return reply.send({
        success: true,
        data: articles,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Error fetching articles for admin:', {
        errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return reply.status(500).send({
        success: false,
        error: errorMessage || 'Failed to fetch articles',
      });
    }
  });

  // Get article by ID or slug
  app.get('/articles/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const article = await prisma.article.findFirst({
        where: {
          OR: [
            { id: parseInt(id) || 0 },
            { slug: id },
          ],
          published: true,
        },
      });

      if (!article) {
        return reply.status(404).send({
          success: false,
          error: 'Article not found',
        });
      }

      return reply.send({
        success: true,
        data: article,
      });
    } catch (error) {
      console.error('Get article error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch article',
      });
    }
  });

  // Create article (protected)
  app.post('/articles', async (request, reply) => {
    try {
      await request.jwtVerify();

      const { title, category, excerpt, content, image, author } = request.body as any;

      const article = await prisma.article.create({
        data: {
          title,
          slug: title.toLowerCase().replace(/\s+/g, '-'),
          category,
          excerpt,
          content,
          image,
          author,
          published: false,
        },
      });

      return reply.status(201).send({
        success: true,
        data: article,
        message: 'Article created successfully',
      });
    } catch (error) {
      console.error('Create article error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return reply.status(500).send({
        success: false,
        error: errorMessage || 'Failed to create article',
      });
    }
  });

  // Update article (protected)
  app.put('/articles/:id', async (request, reply) => {
    try {
      await request.jwtVerify();

      const { id } = request.params as { id: string };
      const updates = request.body as any;

      // If publishing, set publishedAt to now
      if (updates.published === true) {
        updates.publishedAt = new Date();
      }
      // If unpublishing, clear publishedAt
      else if (updates.published === false) {
        updates.publishedAt = null;
      }

      const article = await prisma.article.update({
        where: { id: parseInt(id) },
        data: updates,
      });

      return reply.send({
        success: true,
        data: article,
        message: 'Article updated successfully',
      });
    } catch (error) {
      console.error('Update article error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to update article',
      });
    }
  });

  // Delete article (protected)
  app.delete('/articles/:id', async (request, reply) => {
    try {
      await request.jwtVerify();

      const { id } = request.params as { id: string };

      await prisma.article.delete({
        where: { id: parseInt(id) },
      });

      return reply.send({
        success: true,
        message: 'Article deleted successfully',
      });
    } catch (error) {
      console.error('Delete article error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to delete article',
      });
    }
  });
}
