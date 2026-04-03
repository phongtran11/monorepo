import { createServerFn } from '@tanstack/react-start';

import { serverFetch } from '@admin/lib/server/fetch';

import type { CategoryResponseDto } from '../category.type';

/**
 * Fetches all categories. No auth required.
 */
export const getCategoriesAction = createServerFn({ method: 'GET' }).handler(
  async (): Promise<CategoryResponseDto[]> => {
    const result = await serverFetch<CategoryResponseDto[]>('/categories');
    return result.data;
  },
);
