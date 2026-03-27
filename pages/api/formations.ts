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
      const { limit = 10, offset = 0 } = req.query;

      const formations = await prisma.formation.findMany({
        where: { published: true },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        orderBy: { createdAt: 'desc' },
        include: {
          sessions: {
            where: {
              status: { in: ['ouverte', 'complète'] },
            },
            orderBy: { startDate: 'asc' },
          },
        },
      });

      const total = await prisma.formation.count({ where: { published: true } });

      return res.status(200).json({
        success: true,
        data: { formations, total },
      });
    } catch (error) {
      console.error('Error fetching formations:', error);
      return res.status(500).json({ error: 'Erreur lors de la récupération des formations' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, duration, level, description, content, objectives, price, maxParticipants } = req.body;

      if (!name || !duration || !level || !description) {
        return res.status(400).json({ error: 'Champs obligatoires manquants' });
      }

      // Génère un slug
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50);

      const formation = await prisma.formation.create({
        data: {
          name,
          slug,
          duration,
          level,
          description,
          content: content || null,
          objectives: objectives || null,
          price: price ? parseFloat(price) : null,
          maxParticipants: maxParticipants || 20,
          published: false,
        },
      });

      return res.status(201).json({
        success: true,
        data: formation,
        message: 'Formation créée avec succès',
      });
    } catch (error) {
      console.error('Error creating formation:', error);
      return res.status(500).json({ error: 'Erreur lors de la création de la formation' });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
}
