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
      const { formationId } = req.query;
      const where: any = {};

      if (formationId) {
        where.formationId = parseInt(formationId as string);
      }

      const sessions = await prisma.sessionFormation.findMany({
        where,
        orderBy: { startDate: 'asc' },
        include: {
          formation: {
            select: { name: true, duration: true, level: true },
          },
        },
      });

      return res.status(200).json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return res.status(500).json({ error: 'Erreur lors de la récupération des sessions' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { formationId, startDate, endDate, location, capacity } = req.body;

      if (!formationId || !startDate || !endDate || !location) {
        return res.status(400).json({ error: 'Champs obligatoires manquants' });
      }

      // Vérifie que la formation existe
      const formation = await prisma.formation.findUnique({
        where: { id: parseInt(formationId) },
      });

      if (!formation) {
        return res.status(404).json({ error: 'Formation non trouvée' });
      }

      const session = await prisma.sessionFormation.create({
        data: {
          formationId: parseInt(formationId),
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          location,
          capacity: capacity || 20,
          available: capacity || 20,
        },
        include: {
          formation: {
            select: { name: true, duration: true },
          },
        },
      });

      return res.status(201).json({
        success: true,
        data: session,
        message: 'Session créée avec succès',
      });
    } catch (error) {
      console.error('Error creating session:', error);
      return res.status(500).json({ error: 'Erreur lors de la création de la session' });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
}
