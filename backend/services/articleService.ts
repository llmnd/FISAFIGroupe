import { prisma } from '../lib/db';

export class ArticleService {
  static async getAll(category?: string, limit = 10, offset = 0) {
    try {
      const where: any = { published: true };
      if (category && category !== 'tous') {
        where.category = category;
      }

      const [articles, total] = await Promise.all([
        prisma.article.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { publishedAt: 'desc' },
        }),
        prisma.article.count({ where }),
      ]);

      return { articles, total };
    } catch (error) {
      console.error('Error in ArticleService.getAll:', error);
      throw error;
    }
  }

  static async getById(id: number) {
    try {
      return await prisma.article.findUnique({
        where: { id },
      });
    } catch (error) {
      console.error('Error in ArticleService.getById:', error);
      throw error;
    }
  }

  static async create(data: {
    title: string;
    category: string;
    excerpt: string;
    content: string;
    image?: string;
    author?: string;
  }) {
    try {
      // Génère un slug à partir du titre
      const slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50);

      return await prisma.article.create({
        data: {
          ...data,
          slug,
          published: false,
        },
      });
    } catch (error) {
      console.error('Error in ArticleService.create:', error);
      throw error;
    }
  }

  static async update(
    id: number,
    data: {
      title?: string;
      category?: string;
      excerpt?: string;
      content?: string;
      image?: string;
      author?: string;
      published?: boolean;
      publishedAt?: Date;
    }
  ) {
    try {
      return await prisma.article.update({
        where: { id },
        data: {
          ...data,
          ...(data.published && data.publishedAt === undefined && {
            publishedAt: new Date(),
          }),
        },
      });
    } catch (error) {
      console.error('Error in ArticleService.update:', error);
      throw error;
    }
  }

  static async delete(id: number) {
    try {
      return await prisma.article.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error in ArticleService.delete:', error);
      throw error;
    }
  }
}
