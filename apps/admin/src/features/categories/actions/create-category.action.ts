import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { authMiddleware } from '@admin/lib/server/middleware/auth.middleware';
import { serverFetch } from '@admin/lib/server/fetch';

import type { CategoryResponseDto } from '../category.type';

const createCategoryInput = z.object({
  name: z.string(),
  displayOrder: z.number(),
  parentId: z.string().nullable().optional(),
  imageId: z.string().nullable().optional(),
});

/**
 * Creates a new category. Requires authentication.
 */
export const createCategoryAction = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(createCategoryInput)
  .handler(async ({ context, data }): Promise<CategoryResponseDto> => {
    const result = await serverFetch<CategoryResponseDto>('/categories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${context.accessToken}` },
      body: data,
    });
    return result.data;
  });
