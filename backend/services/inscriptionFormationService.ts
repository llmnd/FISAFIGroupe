import { prisma } from '../lib/db';

export class InscriptionFormationService {
  static async getAll(sessionId?: number) {
    try {
      const where: any = {};
      if (sessionId) {
        where.sessionId = sessionId;
      }

      return await prisma.inscriptionFormation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          formation: { select: { name: true } },
          session: { select: { startDate: true, location: true } },
        },
      });
    } catch (error) {
      console.error('Error in InscriptionFormationService.getAll:', error);
      throw error;
    }
  }

  static async getById(id: number) {
    try {
      return await prisma.inscriptionFormation.findUnique({
        where: { id },
        include: {
          formation: true,
          session: true,
        },
      });
    } catch (error) {
      console.error('Error in InscriptionFormationService.getById:', error);
      throw error;
    }
  }

  static async create(data: {
    sessionId: number;
    formationId: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company?: string;
  }) {
    try {
      // Vérifie que la session existe
      const session = await prisma.sessionFormation.findUnique({
        where: { id: data.sessionId },
      });

      if (!session) {
        throw new Error('Session not found');
      }

      // Vérifie si email est déjà inscrit
      const existing = await prisma.inscriptionFormation.findUnique({
        where: {
          sessionId_email: {
            sessionId: data.sessionId,
            email: data.email,
          },
        },
      });

      if (existing) {
        throw new Error('Email already registered for this session');
      }

      // Détermine le statut basé sur la disponibilité
      const status = session.available > 0 ? 'confirme' : 'liste_attente';

      const inscription = await prisma.inscriptionFormation.create({
        data: {
          ...data,
          status,
        },
        include: {
          formation: { select: { name: true } },
          session: { select: { startDate: true, location: true } },
        },
      });

      // Décrémente la disponibilité si confirmé
      if (status === 'confirme') {
        const updatedSession = await prisma.sessionFormation.update({
          where: { id: data.sessionId },
          data: {
            available: {
              decrement: 1,
            },
            ...(session.available - 1 <= 0 && { status: 'complète' }),
          },
        });
      }

      return inscription;
    } catch (error) {
      console.error('Error in InscriptionFormationService.create:', error);
      throw error;
    }
  }

  static async update(id: number, data: any) {
    try {
      return await prisma.inscriptionFormation.update({
        where: { id },
        data,
      });
    } catch (error) {
      console.error('Error in InscriptionFormationService.update:', error);
      throw error;
    }
  }

  static async delete(id: number) {
    try {
      return await prisma.inscriptionFormation.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error in InscriptionFormationService.delete:', error);
      throw error;
    }
  }
}
