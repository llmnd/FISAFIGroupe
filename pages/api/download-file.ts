import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url, filename } = req.query;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    if (!filename || typeof filename !== 'string') {
      return res.status(400).json({ error: 'Filename parameter is required' });
    }

    // Add download parameter to Cloudinary URL to force download
    const downloadUrl = url.includes('?') 
      ? `${url}&fl_attachment:${filename}` 
      : `${url}?fl_attachment:${filename}`;

    // Redirect to Cloudinary with download headers
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.redirect(downloadUrl);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to process download',
    });
  }
}
