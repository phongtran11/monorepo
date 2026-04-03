import { createServerFn } from '@tanstack/react-start';
import { getCookie } from '@tanstack/react-start/server';
import { z } from 'zod';

import type { TempUploadResponse } from '../category.type';

const API_BASE_URL = 'https://monorepo-production-3759.up.railway.app/api/v1';

const uploadTempInput = z.object({
  fileName: z.string(),
  fileType: z.string(),
  fileData: z.string(), // base64 encoded
});

/**
 * Uploads a file to the temp storage. Requires authentication.
 * Accepts base64-encoded file data and reconstructs a multipart/form-data request.
 */
export const uploadTempAction = createServerFn({ method: 'POST' })
  .inputValidator(uploadTempInput)
  .handler(async ({ data }): Promise<TempUploadResponse> => {
    const accessToken = getCookie('access_token');

    const buffer = Buffer.from(data.fileData, 'base64');
    const blob = new Blob([buffer], { type: data.fileType });
    const formData = new FormData();
    formData.append('file', blob, data.fileName);

    const response = await fetch(`${API_BASE_URL}/upload/temp`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    const json = await response.json();

    if (!response.ok || !json.success) {
      throw new Error(json.message ?? 'Upload failed');
    }

    return json.data as TempUploadResponse;
  });
