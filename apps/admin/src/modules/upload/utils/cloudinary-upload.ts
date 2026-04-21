import { registerUploadAction } from '../actions';

/**
 * Uploads a file to Cloudinary via the 2-step unsigned preset flow:
 * 1. Upload directly from the browser to Cloudinary using an unsigned preset
 * 2. Register the uploaded asset with the backend to receive an imageId
 *
 * Returns `{ imageId, previewUrl }` on success, or `null` on any failure.
 */
export async function uploadToCloudinary(
  file: File,
): Promise<{ imageId: string; previewUrl: string } | null> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    return null;
  }

  // Step 1: upload directly from the browser to Cloudinary via unsigned preset
  const cloudinaryForm = new FormData();
  cloudinaryForm.append('file', file);
  cloudinaryForm.append('upload_preset', uploadPreset);

  const cloudRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: cloudinaryForm },
  );

  if (!cloudRes.ok) return null;

  const { public_id, secure_url } = (await cloudRes.json()) as {
    public_id: string;
    secure_url: string;
  };

  // Step 2: register with the backend to get an imageId
  const result = await registerUploadAction(public_id, secure_url);
  if (!result.success || !result.data) return null;

  return { imageId: result.data.id, previewUrl: secure_url };
}
