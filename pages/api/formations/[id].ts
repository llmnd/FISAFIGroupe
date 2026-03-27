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
  const formationId = parseInt(id as string);

  if (req.method === 'GET') {
    try {
      const formation = await prisma.formation.findUnique({
        where: { id: formationId },
        include: {
          sessions: {
            orderBy: { startDate: 'asc' },
          },
        },
      });

      if (!formation) {
        return res.status(404).json({ error: 'Formation non trouvée' });
      }

      return res.status(200).json({
        success: true,
        data: formation,
      });
    } catch (error) {
      console.error('Error fetching formation:', error);
      return res.status(500).json({ error: 'Erreur lors de la récupération de la formation' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { name, duration, level, description, content, objectives, price, maxParticipants, published } = req.body;

      const formation = await prisma.formation.update({
        where: { id: formationId },
        data: {
          ...(name && { name }),
          ...(duration && { duration }),
          ...(level && { level }),
          ...(description && { description }),
          ...(content !== undefined && { content }),
          ...(objectives !== undefined && { objectives }),
          ...(price !== undefined && { price: price ? parseFloat(price) : null }),
          ...(maxParticipants && { maxParticipants }),
          ...(published !== undefined && { published }),
        },
      });

      return res.status(200).json({
        success: true,
        data: formation,
        message: 'Formation mise à jour avec succès',
      });
    } catch (error) {
      console.error('Error updating formation:', error);
      return res.status(500).json({ error: 'Erreur lors de la mise à jour de la formation' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.formation.delete({
        where: { id: formationId },
      });

      return res.status(200).json({
        success: true,
        message: 'Formation supprimée avec succès',
      });
    } catch (error) {
      console.error('Error deleting formation:', error);
      return res.status(500).json({ error: 'Erreur lors de la suppression de la formation' });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
}
