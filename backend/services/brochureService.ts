import { prisma } from '../lib/db';

export class BrochureService {
  static async getAll() {
    try {
      return await prisma.brochure.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error in BrochureService.getAll:', error);
      throw error;
    }
  }

  static async getById(id: number) {
    try {
      return await prisma.brochure.findUnique({
        where: { id },
      });
    } catch (error) {
      console.error('Error in BrochureService.getById:', error);
      throw error;
    }
  }

  static async create(data: {
    name: string;
    description?: string;
    fileUrl: string;
    fileSize?: string;
    type?: string;
  }) {
    try {
      return await prisma.brochure.create({
        data: {
          ...data,
          type: data.type || 'PDF',
          published: false,
        },
      });
    } catch (error) {
      console.error('Error in BrochureService.create:', error);
      throw error;
    }
  }

  static async update(id: number, data: any) {
    try {
      return await prisma.brochure.update({
        where: { id },
        data,
      });
    } catch (error) {
      console.error('Error in BrochureService.update:', error);
      throw error;
    }
  }

  static async delete(id: number) {
    try {
      return await prisma.brochure.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error in BrochureService.delete:', error);
      throw error;
    }
  }
}
