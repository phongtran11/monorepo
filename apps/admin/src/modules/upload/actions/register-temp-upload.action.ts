'use server';

import { apis } from '@admin/lib/api';
import { API_ENDPOINTS } from '@admin/lib/constants';

import { TempUploadData } from './upload-temp.action';

/**
 * Registers a Cloudinary asset uploaded directly from the browser as a temp upload.
 * Called after a successful browser-to-Cloudinary upload to obtain a tempId.
 */
export async function registerTempUploadAction(
  publicId: string,
  secureUrl: string,
) {
  return apis.post<TempUploadData>(API_ENDPOINTS.UPLOAD.REGISTER, {
    data: { publicId, secureUrl },
  });
}
