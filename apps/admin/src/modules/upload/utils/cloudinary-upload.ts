import { getUploadSignatureAction, registerUploadAction } from '../actions';

/**
 * Uploads a file to Cloudinary via the 2-step signed upload flow:
 * 1. Fetch a short-lived upload signature from the backend (api_secret never leaves server)
 * 2. Upload directly from the browser to Cloudinary using the signed params
 * 3. Register the uploaded asset with the backend to receive an imageId
 *
 * Returns `{ imageId, previewUrl }` on success, or `null` on any failure.
 */
export async function uploadToCloudinary(
  file: File,
): Promise<{ imageId: string; previewUrl: string } | null> {
  // Step 1: fetch signed upload params from the backend
  const signResult = await getUploadSignatureAction();

  if (!signResult.success || !signResult.data) return null;

  const { signature, timestamp, apiKey, folder, cloudName } = signResult.data;
  const imageUploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  // Step 2: upload directly from the browser to Cloudinary using signed params
  const cloudinaryForm = new FormData();
  cloudinaryForm.append('file', file);
  cloudinaryForm.append('signature', signature);
  cloudinaryForm.append('timestamp', String(timestamp));
  cloudinaryForm.append('api_key', apiKey);
  cloudinaryForm.append('folder', folder);

  const cloudRes = await fetch(imageUploadUrl, {
    method: 'POST',
    body: cloudinaryForm,
  });

  if (!cloudRes.ok) return null;

  const { public_id, secure_url } = (await cloudRes.json()) as {
    public_id: string;
    secure_url: string;
  };

  // Step 3: register with the backend to get an imageId
  const result = await registerUploadAction(public_id, secure_url);
  if (!result.success || !result.data) return null;

  return { imageId: result.data.id, previewUrl: secure_url };
}
