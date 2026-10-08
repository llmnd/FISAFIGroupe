import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { authorizeAdminRequest } from '@/lib/apiAdminAuth';

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
    if (!(await authorizeAdminRequest(req, res))) return;
    try {
      const { formationId, startDate, endDate, registrationDeadline, location, capacity } = req.body;

      if (!formationId || !startDate || !endDate || !registrationDeadline || !location) {
        return res.status(400).json({ error: 'Champs obligatoires manquants' });
      }
      const parsedStartDate = new Date(startDate);
      const parsedEndDate = new Date(endDate);
      const parsedRegistrationDeadline = new Date(registrationDeadline);
      if (
        !Number.isFinite(parsedStartDate.getTime()) ||
        !Number.isFinite(parsedEndDate.getTime()) ||
        !Number.isFinite(parsedRegistrationDeadline.getTime()) ||
        parsedEndDate < parsedStartDate ||
        parsedRegistrationDeadline >= parsedStartDate
      ) {
        return res.status(400).json({
          error: "La date limite d'inscription doit précéder le début de la session, et la date de fin doit être après son début.",
        });
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
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          registrationDeadline: parsedRegistrationDeadline,
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
