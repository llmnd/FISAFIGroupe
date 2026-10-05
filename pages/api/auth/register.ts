import type { NextApiRequest, NextApiResponse } from 'next';
import { setAuthCookie } from '@/lib/authCookie';

type ResponseData = {
  success?: boolean;
  data?: any;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

  try {
    const response = await fetch(`${backendUrl.replace(/\/$/, '')}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    const token = data?.data?.token;
    if (typeof token === 'string' && token.length > 0) {
      setAuthCookie(req, res, token);
      delete data.data.token;
    }

    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Register API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to register',
    });
  }
}
