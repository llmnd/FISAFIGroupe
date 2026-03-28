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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL;
    
    if (!backendUrl) {
      console.error('❌ Backend URL not configured', {
        NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
        BACKEND_URL: process.env.BACKEND_URL,
      });
      return res.status(500).json({ error: 'Backend URL not configured' });
    }

    const url = `${backendUrl}/api/articles/manage`;
    console.log('📤 Proxying to:', url);

    // Proxy request to backend
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': req.headers.authorization || '',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Backend error:', {
        status: response.status,
        error: data.error || 'Backend error',
        url,
      });
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
    console.error('❌ Proxy error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Proxy error',
    });
  }
}
