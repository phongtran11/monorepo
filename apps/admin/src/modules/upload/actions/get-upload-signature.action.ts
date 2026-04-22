'use server';

import { apis } from '@admin/lib/api';
import { API_ENDPOINTS } from '@admin/lib/constants';

export type UploadSignatureData = {
  cloudName: string;
  signature: string;
  timestamp: number;
  apiKey: string;
  folder: string;
};

/**
 * Fetches a short-lived Cloudinary upload signature from the backend.
 * Use the returned params to perform a signed direct browser upload.
 * The api_secret is never exposed to the client.
 */
export async function getUploadSignatureAction() {
  return apis.get<UploadSignatureData>(API_ENDPOINTS.UPLOAD.SIGN);
}
