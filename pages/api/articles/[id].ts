import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type ResponseData = {
  success?: boolean;
  data?: any;
  message?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const { id } = req.query;
  const articleId = parseInt(id as string);

  if (req.method === 'GET') {
    try {
      const article = await prisma.article.findUnique({
        where: { id: articleId },
      });

      if (!article) {
        return res.status(404).json({ error: 'Article non trouvé' });
      }

      return res.status(200).json({
        success: true,
        data: article,
      });
    } catch (error) {
      console.error('Error fetching article:', error);
      return res.status(500).json({ error: 'Erreur lors de la récupération de l\'article' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { title, category, excerpt, content, image, author, published, publishedAt } = req.body;

      const article = await prisma.article.update({
        where: { id: articleId },
        data: {
          ...(title && { title }),
          ...(category && { category }),
          ...(excerpt && { excerpt }),
          ...(content && { content }),
          ...(image !== undefined && { image }),
          ...(author !== undefined && { author }),
          ...(published !== undefined && { published }),
          ...(published && publishedAt === undefined && { publishedAt: new Date() }),
          ...(publishedAt && { publishedAt: new Date(publishedAt) }),
        },
      });

      return res.status(200).json({
        success: true,
        data: article,
        message: 'Article mis à jour avec succès',
      });
    } catch (error) {
      console.error('Error updating article:', error);
      return res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'article' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.article.delete({
        where: { id: articleId },
      });

      return res.status(200).json({
        success: true,
        message: 'Article supprimé avec succès',
      });
    } catch (error) {
      console.error('Error deleting article:', error);
      return res.status(500).json({ error: 'Erreur lors de la suppression de l\'article' });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
}
