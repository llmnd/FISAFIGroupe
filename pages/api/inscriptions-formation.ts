import type { NextApiRequest, NextApiResponse } from 'next';
import { UserProfile } from '@prisma/client';
import { prisma } from '@/backend/lib/db';
import { getRequestAuthorization } from '@/lib/authCookie';
import { authenticateMarketUser, MarketAuthError } from '@/lib/marketAuth';

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
      const { sessionId, formationId, firstName, lastName, email, phone, company } = req.body ?? {};
      const parsedSessionId = Number(sessionId);
      const parsedFormationId = Number(formationId);
      if (
        !Number.isSafeInteger(parsedSessionId) || parsedSessionId < 1 ||
        !Number.isSafeInteger(parsedFormationId) || parsedFormationId < 1 ||
        typeof firstName !== 'string' || !firstName.trim() ||
        typeof lastName !== 'string' || !lastName.trim() ||
        typeof email !== 'string' || !email.trim() ||
        typeof phone !== 'string' || !phone.trim() ||
        (company !== undefined && company !== null && typeof company !== 'string')
      ) {
        return res.status(400).json({ error: 'Champs obligatoires manquants' });
      }

      const authorization = getRequestAuthorization(req);
      let authenticatedAccount: Awaited<ReturnType<typeof authenticateMarketUser>> | null = null;
      if (authorization?.startsWith('Bearer ')) {
        authenticatedAccount = await authenticateMarketUser(req);
        if (authenticatedAccount.email.trim().toLowerCase() !== email.trim().toLowerCase()) {
          return res.status(403).json({ error: 'L’adresse de l’inscription doit correspondre à celle de votre compte.' });
        }
      }

      // Vérifie que la session existe
      const session = await prisma.sessionFormation.findUnique({
        where: { id: parsedSessionId },
      });

      if (!session) {
        return res.status(404).json({ error: 'Session non trouvée' });
      }
      if (
        session.formationId !== parsedFormationId ||
        session.status !== 'ouverte' ||
        session.startDate.getTime() <= Date.now()
      ) {
        return res.status(400).json({ error: 'Cette session n’est pas disponible pour cette formation.' });
      }

      // Vérifie si email est déjà inscrit à cette session
      const existing = await prisma.inscriptionFormation.findUnique({
        where: {
          sessionId_email: {
            sessionId: parsedSessionId,
            email: email.trim(),
          },
        },
      });

      if (existing) {
        return res.status(400).json({ error: 'Cet email est déjà inscrit à cette session' });
      }

      // Vérifie la disponibilité
      const result = await prisma.$transaction(async (transaction) => {
        let status = session.available > 0 ? 'confirme' : 'liste_attente';
        let inscription = await transaction.inscriptionFormation.create({
          data: {
            sessionId: parsedSessionId,
            formationId: parsedFormationId,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            company: typeof company === 'string' && company.trim() ? company.trim() : null,
            status,
          },
          include: {
            formation: { select: { name: true } },
            session: { select: { startDate: true, location: true } },
          },
        });

        if (status === 'confirme') {
          const reserved = await transaction.sessionFormation.updateMany({
            where: { id: parsedSessionId, available: { gt: 0 } },
            data: { available: { decrement: 1 } },
          });
          if (reserved.count === 0) {
            status = 'liste_attente';
            inscription = await transaction.inscriptionFormation.update({
              where: { id: inscription.id },
              data: { status },
              include: {
                formation: { select: { name: true } },
                session: { select: { startDate: true, location: true } },
              },
            });
          } else {
            await transaction.sessionFormation.updateMany({
              where: { id: parsedSessionId, available: 0 },
              data: { status: 'complète' },
            });
          }
        }

        if (authenticatedAccount) {
          const account = await transaction.user.findUnique({
            where: { id: authenticatedAccount.id },
            select: { profiles: true },
          });
          if (!account) throw new Error('Le compte authentifié n’existe plus.');
          if (!account.profiles.includes(UserProfile.TRAINING_PARTICIPANT)) {
            await transaction.user.update({
              where: { id: authenticatedAccount.id },
              data: { profiles: { push: UserProfile.TRAINING_PARTICIPANT } },
            });
          }
        }

        return { inscription, status };
      });
      const { inscription, status } = result;

      return res.status(201).json({
        success: true,
        data: inscription,
        message: `Inscription ${status === 'confirme' ? 'confirmée' : 'ajoutée à la liste d\'attente'} avec succès`,
      });
    } catch (error) {
      if (error instanceof MarketAuthError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Error creating inscription:', error);
      return res.status(500).json({ error: 'Erreur lors de l\'inscription' });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
}
