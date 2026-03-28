import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
  success?: boolean;
  data?: any;
  message?: string;
  error?: string;
};

/**
 * GET /api/fetch-articles-admin - Fetch articles for admin dashboard
 * This replaces the problematic /api/articles/manage endpoint
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get backend URL from multiple sources
    const backendUrl = 
      process.env.NEXT_PUBLIC_BACKEND_URL || 
      process.env.BACKEND_URL ||
      'https://fisafi-backend.onrender.com';

    if (!backendUrl) {
      console.error('❌ [fetch-articles-admin] No backend URL configured');
      return res.status(500).json({ 
        success: false,
        error: 'Backend not configured',
        data: []
      });
    }

    const apiUrl = `${backendUrl}/api/articles/manage`;
    console.log('📤 [fetch-articles-admin] Proxying to:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': req.headers.authorization || '',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ [fetch-articles-admin] Backend error:', {
        status: response.status,
        statusText: response.statusText,
        error: data.error || 'Backend error',
        url: apiUrl,
      });
      return res.status(response.status).json({
        success: false,
        error: data.error || 'Backend error',
        data: []
      });
    }

    console.log('✅ [fetch-articles-admin] Success, returning', Array.isArray(data.data) ? data.data.length : '0', 'articles');
    
    return res.status(200).json({
      success: true,
      data: Array.isArray(data.data) ? data.data : []
    });
  } catch (error) {
    console.error('❌ [fetch-articles-admin] Fetch error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Proxy error',
      data: []
    });
  }
}
