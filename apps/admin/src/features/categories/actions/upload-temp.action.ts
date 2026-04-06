import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { authMiddleware } from '@admin/lib/server/middleware/auth.middleware';

import type { TempUploadResponse } from '../category.type';
import { serverFetch } from '@admin/lib/server/fetch';

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
  .middleware([authMiddleware])
  .inputValidator(uploadTempInput)
  .handler(async ({ context, data }): Promise<TempUploadResponse> => {
    const buffer = Buffer.from(data.fileData, 'base64');
    const blob = new Blob([buffer], { type: data.fileType });
    const formData = new FormData();
    formData.append('file', blob, data.fileName);

    const response = await serverFetch<TempUploadResponse>(`/upload/temp`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${context.accessToken}`,
      },
      body: formData,
    });

    return response.data;
  });
