import { prisma } from '../lib/db';

export class FormationService {
  static async getAll(limit = 10, offset = 0) {
    try {
      const [formations, total] = await Promise.all([
        prisma.formation.findMany({
          where: { published: true },
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
          include: {
            sessions: {
              where: {
                status: { in: ['ouverte', 'complète'] },
              },
              orderBy: { startDate: 'asc' },
            },
          },
        }),
        prisma.formation.count({ where: { published: true } }),
      ]);

      return { formations, total };
    } catch (error) {
      console.error('Error in FormationService.getAll:', error);
      throw error;
    }
  }

  static async getById(id: number) {
    try {
      return await prisma.formation.findUnique({
        where: { id },
        include: {
          sessions: {
            orderBy: { startDate: 'asc' },
          },
        },
      });
    } catch (error) {
      console.error('Error in FormationService.getById:', error);
      throw error;
    }
  }

  static async create(data: {
    name: string;
    duration: string;
    level: string;
    description: string;
    content?: string;
    objectives?: string;
    price?: number;
    maxParticipants?: number;
  }) {
    try {
      const slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50);

      return await prisma.formation.create({
        data: {
          ...data,
          slug,
          published: false,
        },
      });
    } catch (error) {
      console.error('Error in FormationService.create:', error);
      throw error;
    }
  }

  static async update(id: number, data: any) {
    try {
      return await prisma.formation.update({
        where: { id },
        data,
      });
    } catch (error) {
      console.error('Error in FormationService.update:', error);
      throw error;
    }
  }

  static async delete(id: number) {
    try {
      return await prisma.formation.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error in FormationService.delete:', error);
      throw error;
    }
  }
}
