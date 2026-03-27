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
  if (req.method === 'GET') {
    try {
      const { category, limit = 10, offset = 0 } = req.query;

      const where: any = { published: true };
      if (category && category !== 'tous') {
        where.category = category;
      }

      const articles = await prisma.article.findMany({
        where,
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        orderBy: { publishedAt: 'desc' },
      });

      const total = await prisma.article.count({ where });

      return res.status(200).json({
        success: true,
        data: { articles, total },
      });
    } catch (error) {
      console.error('Error fetching articles:', error);
      return res.status(500).json({ error: 'Erreur lors de la récupération des articles' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { title, category, excerpt, content, image, author } = req.body;

      if (!title || !category || !excerpt || !content) {
        return res.status(400).json({ error: 'Champs obligatoires manquants' });
      }

      // Génère un slug à partir du titre
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50);

      const article = await prisma.article.create({
        data: {
          title,
          slug,
          category,
          excerpt,
          content,
          image: image || null,
          author: author || null,
          published: false,
        },
      });

      return res.status(201).json({
        success: true,
        data: article,
        message: 'Article créé avec succès',
      });
    } catch (error) {
      console.error('Error creating article:', error);
      return res.status(500).json({ error: 'Erreur lors de la création de l\'article' });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
}
