import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { authMiddleware } from '@admin/lib/server/middleware/auth.middleware';
import { serverFetch } from '@admin/lib/server/fetch';

/**
 * Cancels a temporary upload by its temp ID. Requires authentication.
 */
export const cancelUploadAction = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(z.object({ tempId: z.string() }))
  .handler(async ({ context, data }): Promise<void> => {
    await serverFetch(`/upload/cancel/${data.tempId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${context.accessToken}` },
    });
  });
