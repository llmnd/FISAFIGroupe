import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * GET /api/admin/articles - Get articles for admin (backup endpoint)
 * This is a simpler, more reliable endpoint
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://fisafi-backend.onrender.com';

    const response = await fetch(`${backendUrl}/api/articles/manage`, {
      method: 'GET',
      headers: {
        'Authorization': token || '',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    return res.json({
      success: true,
      data: data.data || []
    });
  } catch (error) {
    console.error('Error in /api/admin/articles:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error',
      data: []
    });
  }
}
