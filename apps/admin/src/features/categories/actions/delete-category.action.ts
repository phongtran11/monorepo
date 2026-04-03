import { createServerFn } from '@tanstack/react-start';
import { getCookie } from '@tanstack/react-start/server';
import { z } from 'zod';

import { serverFetch } from '@admin/lib/server/fetch';

/**
 * Deletes a category by ID. Requires authentication.
 */
export const deleteCategoryAction = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }): Promise<void> => {
    const accessToken = getCookie('access_token');
    await serverFetch(`/categories/${data.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  });
