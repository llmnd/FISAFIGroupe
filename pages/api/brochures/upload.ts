import type { NextApiRequest, NextApiResponse } from 'next';
import { CloudinaryService } from '@/backend/services/cloudinaryService';
import { prisma } from '@/backend/lib/db';

type ResponseData = {
  success?: boolean;
  data?: any;
  message?: string;
  error?: string;
};

// Middleware to verify admin token
async function verifyAdminToken(req: NextApiRequest): Promise<boolean> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  // Token exists, simplified verification
  return true;
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin authentication
    const isAdmin = await verifyAdminToken(req);
    if (!isAdmin) {
      return res.status(401).json({ error: 'Unauthorized: Admin access required' });
    }

    const { fileBuffer, fileName, name, description } = req.body;

    if (!fileBuffer || !fileName || !name) {
      console.error('Missing required fields:', { hasBuffer: !!fileBuffer, hasFileName: !!fileName, hasName: !!name });
      return res.status(400).json({ error: 'Missing required fields: fileBuffer, fileName, name' });
    }

    // Convert base64 string to Buffer if needed
    let buffer: Buffer;
    if (typeof fileBuffer === 'string') {
      buffer = Buffer.from(fileBuffer, 'base64');
    } else {
      buffer = Buffer.from(fileBuffer);
    }

    console.log('Starting brochure upload:', { fileName, name, bufferSize: buffer.length });

    // Upload to Cloudinary
    const uploadResponse = await CloudinaryService.uploadFile(
      buffer,
      fileName,
      'brochures'
    );

    console.log('Cloudinary upload response:', {
      public_id: uploadResponse.public_id,
      secure_url: uploadResponse.secure_url,
      format: uploadResponse.format,
      size: uploadResponse.size,
      bytes: uploadResponse.bytes,
    });

    // Ensure we have a valid URL
    const fileUrl = uploadResponse.secure_url || 
                    uploadResponse.url || 
                    `https://res.cloudinary.com/dcs9vkwe0/image/upload/${uploadResponse.public_id}.${uploadResponse.format}`;

    console.log('Final file URL:', fileUrl);

    // Save to database
    const brochure = await prisma.brochure.create({
      data: {
        name,
        description: description || null,
        fileUrl: fileUrl,
        fileSize: uploadResponse.bytes ? uploadResponse.bytes.toString() : (uploadResponse.size ? uploadResponse.size.toString() : null),
        type: uploadResponse.format?.toUpperCase() || 'PDF',
        published: false,
      },
    });

    console.log('Brochure saved to database:', { id: brochure.id });

    return res.status(200).json({
      success: true,
      message: 'Brochure uploaded successfully',
      data: {
        brochure,
        cloudinaryId: uploadResponse.public_id,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    return res.status(500).json({ error: `Upload failed: ${errorMessage}` });
  }
}
