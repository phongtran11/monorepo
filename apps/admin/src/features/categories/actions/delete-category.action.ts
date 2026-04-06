import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { authMiddleware } from '@admin/lib/server/middleware/auth.middleware';
import { serverFetch } from '@admin/lib/server/fetch';

/**
 * Deletes a category by ID. Requires authentication.
 */
export const deleteCategoryAction = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ context, data }): Promise<void> => {
    await serverFetch(`/categories/${data.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${context.accessToken}` },
    });
  });
