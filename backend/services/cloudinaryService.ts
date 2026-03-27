const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || '';

// Validate configuration
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
  console.warn(
    'Warning: Cloudinary environment variables not configured. ' +
    'Set CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET in .env.local'
  );
}

export interface CloudinaryUploadResponse {
  public_id: string;
  url: string;
  secure_url: string;
  resource_type: string;
  size?: number;
  bytes?: number;
  format: string;
}

export class CloudinaryService {
  /**
   * Upload a file to Cloudinary
   * @param fileBuffer Buffer of the file to upload
   * @param fileName Name of the file
   * @param folder Cloudinary folder (e.g., 'brochures', 'articles')
   * @returns Upload response with URL
   */
  static async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    folder: 'brochures' | 'articles' | 'images' = 'brochures'
  ): Promise<CloudinaryUploadResponse> {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      throw new Error(
        'Cloudinary configuration missing. ' +
        'Set CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET in environment variables.'
      );
    }

    const formData = new FormData();
    
    // Convert Buffer to Uint8Array for compatibility
    const uint8Array = new Uint8Array(fileBuffer);
    formData.append('file', new Blob([uint8Array], { type: 'application/pdf' }), fileName);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', `fisafi/${folder}`);
    formData.append('resource_type', 'auto');

    try {
      const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;
      console.log('Uploading to Cloudinary:', { uploadUrl, fileName, folder });
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData as any,
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Cloudinary response error:', { status: response.status, error });
        throw new Error(`Cloudinary upload failed (${response.status}): ${error}`);
      }

      const data = (await response.json()) as CloudinaryUploadResponse;
      console.log('Cloudinary upload success:', { publicId: data.public_id, url: data.secure_url });
      return data;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Cloudinary upload error:', errorMsg);
      throw error;
    }
  }

  /**
   * Delete a file from Cloudinary
   * @param publicId Public ID of the file to delete
   */
  static async deleteFile(publicId: string): Promise<void> {
    // Note: Deletion requires admin API key (not public)
    // For now, we'll use the public upload preset
    // In production, you'd want to use a server-side API with admin credentials
    console.log(`File deletion for ${publicId} would require admin authentication`);
  }

  /**
   * Generate a signed URL (already handled by Cloudinary secure_url)
   */
  static getSecureUrl(publicId: string): string {
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}`;
  }
}
