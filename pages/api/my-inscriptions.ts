import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

// Reuse PrismaClient across lambda invocations to avoid exhausting DB connections
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const prisma: PrismaClient = global.__prisma ?? new PrismaClient();
if (!global.__prisma) global.__prisma = prisma;

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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userEmail = req.headers['x-user-email'] as string;
    
    if (!userEmail) {
      return res.status(400).json({ error: 'User email not provided' });
    }

    const inscriptions = await prisma.inscriptionFormation.findMany({
      where: {
        email: userEmail,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        formation: { select: { name: true, slug: true } },
        session: { select: { startDate: true, location: true } },
      },
    });

    return res.status(200).json({
      success: true,
      data: inscriptions,
    });
  } catch (error) {
    console.error('Error fetching user inscriptions:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Error fetching your inscriptions',
      data: []
    });
  }
}
