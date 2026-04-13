'use server';

import { apis } from '@admin/lib/api';
import { API_ENDPOINTS } from '@admin/lib/constants';

export type UploadSignature = {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  tags: string;
};

/**
 * Fetches a short-lived Cloudinary upload signature from the API.
 * The browser uses this to upload a file directly to Cloudinary without routing through Next.js.
 */
export async function getUploadSignatureAction() {
  return apis.get<UploadSignature>(API_ENDPOINTS.UPLOAD.SIGN);
}
