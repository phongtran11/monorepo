'use server';

import { apis } from '@admin/lib/api';
import { API_ENDPOINTS } from '@admin/lib/constants';

export type TempUploadData = {
  tempId: string;
  tempUrl: string;
  expiresIn: number;
};

/**
 * Uploads a file to the temporary Cloudinary folder.
 * Returns a tempId (used to attach the image to an entity) and a tempUrl (for preview).
 */
export async function uploadTempAction(formData: FormData) {
  return apis.post<TempUploadData>(API_ENDPOINTS.UPLOAD.TEMP, {
    data: formData,
  });
}
