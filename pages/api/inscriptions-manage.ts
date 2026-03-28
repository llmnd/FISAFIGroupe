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
  // GET - Récupérer les inscriptions en attente ou filtrées
  if (req.method === 'GET') {
    try {
      const { status, sessionId } = req.query;

      const where: any = {};
      if (status) {
        where.status = status;
      }
      if (sessionId) {
        where.sessionId = parseInt(sessionId as string);
      }

      const inscriptions = await prisma.inscriptionFormation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          formation: { select: { id: true, name: true, slug: true } },
          session: { select: { id: true, startDate: true, location: true, capacity: true, available: true } },
        },
      });

      return res.status(200).json({
        success: true,
        data: inscriptions,
      });
    } catch (error) {
      console.error('Error fetching inscriptions:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Error fetching inscriptions',
        data: []
      });
    }
  }

  // PATCH - Accepter ou rejeter une inscription
  if (req.method === 'PATCH') {
    try {
      const { id, action } = req.body; // action: "accept" | "reject"

      if (!id || !action) {
        return res.status(400).json({ error: 'ID and action required' });
      }

      if (!['accept', 'reject'].includes(action)) {
        return res.status(400).json({ error: 'Action must be accept or reject' });
      }

      const inscription = await prisma.inscriptionFormation.findUnique({
        where: { id: parseInt(id) },
        include: { session: true },
      });

      if (!inscription) {
        return res.status(404).json({ error: 'Inscription not found' });
      }

      let newStatus = action === 'accept' ? 'confirme' : 'annule';

      // Si on accepte et c'était en attente, décrémenter la disponibilité
      if (action === 'accept' && inscription.status === 'liste_attente' && inscription.session) {
        await prisma.sessionFormation.update({
          where: { id: inscription.session.id },
          data: {
            available: {
              decrement: 1,
            },
          },
        });

        // Vérifier si la session est maintenant complète
        const updatedSession = await prisma.sessionFormation.findUnique({
          where: { id: inscription.session.id },
        });

        if (updatedSession && updatedSession.available <= 0) {
          await prisma.sessionFormation.update({
            where: { id: inscription.session.id },
            data: { status: 'complète' },
          });
        }
      }

      // Si on rejette et c'était confirmé, incrémenter la disponibilité
      if (action === 'reject' && inscription.status === 'confirme' && inscription.session) {
        await prisma.sessionFormation.update({
          where: { id: inscription.session.id },
          data: {
            available: {
              increment: 1,
            },
          },
        });

        // Vérifier si la session peut réouvrir
        const updatedSession = await prisma.sessionFormation.findUnique({
          where: { id: inscription.session.id },
        });

        if (updatedSession && updatedSession.available > 0 && updatedSession.status === 'complète') {
          await prisma.sessionFormation.update({
            where: { id: inscription.session.id },
            data: { status: 'ouverte' },
          });
        }
      }

      const updatedInscription = await prisma.inscriptionFormation.update({
        where: { id: parseInt(id) },
        data: { status: newStatus },
        include: {
          formation: { select: { name: true } },
          session: { select: { startDate: true, location: true } },
        },
      });

      return res.status(200).json({
        success: true,
        data: updatedInscription,
        message: action === 'accept' ? 'Inscription acceptée' : 'Inscription rejetée',
      });
    } catch (error) {
      console.error('Error updating inscription:', error);
      return res.status(500).json({
        success: false,
        error: 'Error updating inscription',
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
