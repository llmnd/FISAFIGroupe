import type { NextApiRequest, NextApiResponse } from 'next';

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
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) {
    return res.status(500).json({ error: 'Backend URL not configured' });
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const response = await fetch(`${backendUrl}/api/articles/${id}`, {
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

  if (req.method === 'PUT') {
    try {
      const response = await fetch(`${backendUrl}/api/articles/${id}`, {
        method: 'PUT',
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

      return res.status(200).json({
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

  if (req.method === 'DELETE') {
    try {
      const response = await fetch(`${backendUrl}/api/articles/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': req.headers.authorization || '',
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
