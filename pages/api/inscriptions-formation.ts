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
      const { sessionId } = req.query;

      const where: any = {};
      if (sessionId) {
        where.sessionId = parseInt(sessionId as string);
      }

      const inscriptions = await prisma.inscriptionFormation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          formation: { select: { name: true } },
          session: { select: { startDate: true, location: true } },
        },
      });

      return res.status(200).json({
        success: true,
        data: inscriptions,
      });
    } catch (error) {
      console.error('Error fetching inscriptions:', error);
      return res.status(500).json({ error: 'Erreur lors de la récupération des inscriptions' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { sessionId, formationId, firstName, lastName, email, phone, company } = req.body;

      if (!sessionId || !formationId || !firstName || !lastName || !email || !phone) {
        return res.status(400).json({ error: 'Champs obligatoires manquants' });
      }

      // Vérifie que la session existe
      const session = await prisma.sessionFormation.findUnique({
        where: { id: parseInt(sessionId) },
      });

      if (!session) {
        return res.status(404).json({ error: 'Session non trouvée' });
      }

      // Vérifie si email est déjà inscrit à cette session
      const existing = await prisma.inscriptionFormation.findUnique({
        where: {
          sessionId_email: {
            sessionId: parseInt(sessionId),
            email,
          },
        },
      });

      if (existing) {
        return res.status(400).json({ error: 'Cet email est déjà inscrit à cette session' });
      }

      // Vérifie la disponibilité
      let status = 'confirme';
      if (session.available <= 0) {
        status = 'liste_attente';
      }

      const inscription = await prisma.inscriptionFormation.create({
        data: {
          sessionId: parseInt(sessionId),
          formationId: parseInt(formationId),
          firstName,
          lastName,
          email,
          phone,
          company: company || null,
          status,
        },
        include: {
          formation: { select: { name: true } },
          session: { select: { startDate: true, location: true } },
        },
      });

      // Décrémente la disponibilité si confirmé
      if (status === 'confirme') {
        await prisma.sessionFormation.update({
          where: { id: parseInt(sessionId) },
          data: {
            available: {
              decrement: 1,
            },
          },
        });

        // Met à jour le statut si plus de place disponible
        if (session.available - 1 <= 0) {
          await prisma.sessionFormation.update({
            where: { id: parseInt(sessionId) },
            data: { status: 'complète' },
          });
        }
      }

      return res.status(201).json({
        success: true,
        data: inscription,
        message: `Inscription ${status === 'confirme' ? 'confirmée' : 'ajoutée à la liste d\'attente'} avec succès`,
      });
    } catch (error) {
      console.error('Error creating inscription:', error);
      return res.status(500).json({ error: 'Erreur lors de l\'inscription' });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
}
