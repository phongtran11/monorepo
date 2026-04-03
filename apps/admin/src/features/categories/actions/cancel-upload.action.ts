import { createServerFn } from '@tanstack/react-start';
import { getCookie } from '@tanstack/react-start/server';
import { z } from 'zod';

import { serverFetch } from '@admin/lib/server/fetch';

/**
 * Cancels a temporary upload by its temp ID. Requires authentication.
 */
export const cancelUploadAction = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ tempId: z.string() }))
  .handler(async ({ data }): Promise<void> => {
    const accessToken = getCookie('access_token');
    await serverFetch(`/upload/cancel/${data.tempId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  });
