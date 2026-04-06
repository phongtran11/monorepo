import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { authMiddleware } from '@admin/lib/server/middleware/auth.middleware';
import { serverFetch } from '@admin/lib/server/fetch';

import type { CategoryResponseDto } from '../category.type';

const updateCategoryInput = z.object({
  id: z.string(),
  name: z.string(),
  displayOrder: z.number(),
  parentId: z.string().nullable().optional(),
  imageId: z.string().nullable().optional(),
});

/**
 * Updates an existing category by ID. Requires authentication.
 */
export const updateCategoryAction = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(updateCategoryInput)
  .handler(async ({ context, data }): Promise<CategoryResponseDto> => {
    const { id, ...body } = data;
    const result = await serverFetch<CategoryResponseDto>(`/categories/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${context.accessToken}` },
      body,
    });
    return result.data;
  });
