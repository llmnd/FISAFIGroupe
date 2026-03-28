import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
  success?: boolean;
  data?: any;
  message?: string;
  error?: string;
  pagination?: any;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) {
    return res.status(500).json({ error: 'Backend URL not configured' });
  }

  if (req.method === 'GET') {
    try {
      // Build query string from request params
      const { category, limit, offset, page } = req.query;
      const queryParams = new URLSearchParams();
      if (category && category !== 'tous') queryParams.append('category', category as string);
      if (limit) queryParams.append('limit', limit as string);
      if (offset) queryParams.append('offset', offset as string);
      if (page) queryParams.append('page', page as string);

      // Proxy GET request to backend
      const response = await fetch(`${backendUrl}/api/articles?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: data.error || 'Backend error',
        });
      }

      return res.status(200).json({
        success: true,
        data: data.data,
      });
    } catch (error) {
      console.error('Proxy error:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Proxy error',
      });
    }
  }

  if (req.method === 'POST') {
    try {
      // Proxy POST request to backend
      const response = await fetch(`${backendUrl}/api/articles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization || '',
        },
        body: JSON.stringify(req.body),
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: data.error || 'Backend error',
        });
      }

      return res.status(response.status).json({
        success: true,
        data: data.data,
        message: data.message,
      });
    } catch (error) {
      console.error('Proxy error:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Proxy error',
      });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
}
