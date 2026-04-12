'use server';

import { apis } from '@admin/lib/api';
import { API_ENDPOINTS } from '@admin/lib/constants';

/**
 * Cancels a temporary upload — deletes the asset from Cloudinary and clears the Redis key.
 * Call this when the user closes a form without submitting or replaces a staged image.
 */
export async function cancelUploadAction(tempId: string) {
  return apis.delete(API_ENDPOINTS.UPLOAD.CANCEL(tempId));
}
