import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/backend/lib/db';
import { authenticateMarketUser, MarketAuthError, type MarketUser } from '@/lib/marketAuth';

type ResponseData = {
  success?: boolean;
  data?: unknown[];
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

  let account: MarketUser;
  try {
    account = await authenticateMarketUser(req);
  } catch (error) {
    if (error instanceof MarketAuthError) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    console.error('[Inscriptions/Auth] Could not verify account session:', error);
    return res.status(502).json({ success: false, error: 'Impossible de vérifier votre compte.' });
  }

  try {
    const inscriptions = await prisma.inscriptionFormation.findMany({
      where: { email: account.email },
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
    return res.status(503).json({
      success: false,
      error: 'Impossible de charger vos inscriptions pour le moment.',
    });
  }
}
