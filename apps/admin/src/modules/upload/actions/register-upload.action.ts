'use server';

import { apis } from '@admin/lib/api';
import { API_ENDPOINTS } from '@admin/lib/constants';

export type RegisterUploadData = {
  id: string;
  secureUrl: string;
};

/**
 * Registers a Cloudinary asset that was uploaded directly from the browser.
 * The backend verifies the asset exists and saves it as a pending image record.
 * Returns an imageId to be held in form state until the form is submitted.
 */
export async function registerUploadAction(
  publicId: string,
  secureUrl: string,
) {
  return apis.post<RegisterUploadData>(API_ENDPOINTS.UPLOAD.REGISTER, {
    data: { publicId, secureUrl },
  });
}
