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
  const brochureId = parseInt(id as string);

  if (req.method === 'GET') {
    try {
      const brochure = await prisma.brochure.findUnique({
        where: { id: brochureId },
      });

      if (!brochure) {
        return res.status(404).json({ error: 'Brochure non trouvée' });
      }

      return res.status(200).json({
        success: true,
        data: brochure,
      });
    } catch (error) {
      console.error('Error fetching brochure:', error);
      return res.status(500).json({ error: 'Erreur lors de la récupération de la brochure' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { name, description, fileUrl, fileSize, type, published } = req.body;

      const brochure = await prisma.brochure.update({
        where: { id: brochureId },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(fileUrl && { fileUrl }),
          ...(fileSize !== undefined && { fileSize }),
          ...(type && { type }),
          ...(published !== undefined && { published }),
        },
      });

      return res.status(200).json({
        success: true,
        data: brochure,
        message: 'Brochure mise à jour avec succès',
      });
    } catch (error) {
      console.error('Error updating brochure:', error);
      return res.status(500).json({ error: 'Erreur lors de la mise à jour de la brochure' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.brochure.delete({
        where: { id: brochureId },
      });

      return res.status(200).json({
        success: true,
        message: 'Brochure supprimée avec succès',
      });
    } catch (error) {
      console.error('Error deleting brochure:', error);
      return res.status(500).json({ error: 'Erreur lors de la suppression de la brochure' });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
}
