import { prisma } from '../lib/db';

export class SessionService {
  static async getAll(formationId?: number) {
    try {
      const where: any = {};
      if (formationId) {
        where.formationId = formationId;
      }

      return await prisma.sessionFormation.findMany({
        where,
        orderBy: { startDate: 'asc' },
        include: {
          formation: {
            select: { name: true, duration: true, level: true },
          },
        },
      });
    } catch (error) {
      console.error('Error in SessionService.getAll:', error);
      throw error;
    }
  }

  static async getById(id: number) {
    try {
      return await prisma.sessionFormation.findUnique({
        where: { id },
        include: {
          formation: true,
          inscriptions: true,
        },
      });
    } catch (error) {
      console.error('Error in SessionService.getById:', error);
      throw error;
    }
  }

  static async create(data: {
    formationId: number;
    startDate: Date;
    endDate: Date;
    location: string;
    capacity?: number;
  }) {
    try {
      // Vérifie que la formation existe
      const formation = await prisma.formation.findUnique({
        where: { id: data.formationId },
      });

      if (!formation) {
        throw new Error('Formation not found');
      }

      return await prisma.sessionFormation.create({
        data: {
          ...data,
          capacity: data.capacity || 20,
          available: data.capacity || 20,
        },
        include: {
          formation: {
            select: { name: true, duration: true },
          },
        },
      });
    } catch (error) {
      console.error('Error in SessionService.create:', error);
      throw error;
    }
  }

  static async update(id: number, data: any) {
    try {
      return await prisma.sessionFormation.update({
        where: { id },
        data,
      });
    } catch (error) {
      console.error('Error in SessionService.update:', error);
      throw error;
    }
  }

  static async delete(id: number) {
    try {
      return await prisma.sessionFormation.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error in SessionService.delete:', error);
      throw error;
    }
  }
}
