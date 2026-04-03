import { createServerFn } from '@tanstack/react-start';
import { getCookie } from '@tanstack/react-start/server';
import { z } from 'zod';

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
  .inputValidator(createCategoryInput)
  .handler(async ({ data }): Promise<CategoryResponseDto> => {
    const accessToken = getCookie('access_token');
    const result = await serverFetch<CategoryResponseDto>('/categories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: data,
    });
    return result.data;
  });
