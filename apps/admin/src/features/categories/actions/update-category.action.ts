import { createServerFn } from '@tanstack/react-start';
import { getCookie } from '@tanstack/react-start/server';
import { z } from 'zod';

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
  .inputValidator(updateCategoryInput)
  .handler(async ({ data }): Promise<CategoryResponseDto> => {
    const { id, ...body } = data;
    const accessToken = getCookie('access_token');
    const result = await serverFetch<CategoryResponseDto>(`/categories/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}` },
      body,
    });
    return result.data;
  });
