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
    // Try multiple backend URLs
    const backendUrls = [
      process.env.NEXT_PUBLIC_BACKEND_URL,
      process.env.BACKEND_URL,
      'https://fisafi-backend.onrender.com', // Default if deployed on Render
      'http://localhost:3001', // Fallback for local testing
    ].filter(Boolean) as string[];

    if (backendUrls.length === 0) {
      console.error('❌ No backend URLs configured');
      return res.status(500).json({ error: 'Backend URL not configured' });
    }

    let lastError: any = null;
    const url = `${backendUrls[0]}/api/articles/manage`;
    console.log('📤 Proxying articles/manage to:', url);

    try {
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
    } catch (fetchError) {
      console.error('❌ Fetch error:', fetchError);
      lastError = fetchError;
      throw fetchError;
    }
  } catch (error) {
    console.error('❌ Proxy error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Proxy error',
    });
  }
}
