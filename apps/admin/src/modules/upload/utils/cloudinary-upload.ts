import {
  getUploadSignatureAction,
  registerTempUploadAction,
} from '../actions';

/**
 * Uploads a file to Cloudinary via the 3-step flow:
 * 1. Get a short-lived signed URL from the backend
 * 2. Upload directly from the browser to Cloudinary
 * 3. Register the temp asset with the backend to receive a tempId
 *
 * Returns `{ tempId, tempUrl }` on success, or `null` on any failure.
 */
export async function uploadToCloudinary(
  file: File,
): Promise<{ tempId: string; tempUrl: string } | null> {
  // Step 1: get a short-lived Cloudinary signature
  const sigResult = await getUploadSignatureAction();
  if (!sigResult.success || !sigResult.data) return null;

  const { signature, timestamp, apiKey, cloudName, folder, tags } =
    sigResult.data;

  // Step 2: upload directly from the browser to Cloudinary
  const cloudinaryForm = new FormData();
  cloudinaryForm.append('file', file);
  cloudinaryForm.append('api_key', apiKey);
  cloudinaryForm.append('timestamp', String(timestamp));
  cloudinaryForm.append('signature', signature);
  cloudinaryForm.append('folder', folder);
  cloudinaryForm.append('tags', tags);

  const cloudRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: cloudinaryForm },
  );

  if (!cloudRes.ok) return null;

  const { public_id, secure_url } = (await cloudRes.json()) as {
    public_id: string;
    secure_url: string;
  };

  // Step 3: register with the backend to get a tempId
  const result = await registerTempUploadAction(public_id, secure_url);
  if (!result.success || !result.data) return null;

  return { tempId: result.data.tempId, tempUrl: result.data.tempUrl };
}
