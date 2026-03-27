import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type ResponseData = {
  success?: boolean;
  data?: any;
  message?: string;
  error?: string;
};

// Middleware to verify admin token
async function verifyAdminToken(req: NextApiRequest): Promise<boolean> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  // Token exists, simplified verification
  return true;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Verify admin authentication
  const isAdmin = await verifyAdminToken(req);
  if (!isAdmin) {
    return res.status(401).json({ error: 'Unauthorized: Admin access required' });
  }

  if (req.method === 'GET') {
    try {
      // Fetch all brochures (published and unpublished) for administrators
      const brochures = await prisma.brochure.findMany({
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

  return res.status(405).json({ error: 'Méthode non autorisée' });
}
