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
      const brochures = await prisma.brochure.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({
        success: true,
        data: brochures,
      });
    } catch (error) {
      console.error('Error fetching brochures:', error);
      return res.status(500).json({ error: 'Erreur lors de la récupération des brochures' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, description, fileUrl, fileSize, type = 'PDF' } = req.body;

      if (!name || !fileUrl) {
        return res.status(400).json({ error: 'Champs obligatoires manquants' });
      }

      const brochure = await prisma.brochure.create({
        data: {
          name,
          description: description || null,
          fileUrl,
          fileSize: fileSize || null,
          type,
          published: false,
        },
      });

      return res.status(201).json({
        success: true,
        data: brochure,
        message: 'Brochure créée avec succès',
      });
    } catch (error) {
      console.error('Error creating brochure:', error);
      return res.status(500).json({ error: 'Erreur lors de la création de la brochure' });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
}
