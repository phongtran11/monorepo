'use server';

import { withRevalidate } from '@admin/lib/action-utils';
import { apis } from '@admin/lib/api';
import { API_ENDPOINTS } from '@admin/lib/constants';
import { generatePath } from '@admin/lib/routes';

import { CategorySchema } from '../schemas/category.schema';
import { Category } from '../types/category.type';

export async function updateCategoryAction(
  id: string,
  data: Partial<CategorySchema>,
) {
  return withRevalidate('/categories', () =>
    apis.patch<Category, Partial<CategorySchema>>(
      generatePath(API_ENDPOINTS.CATEGORIES.UPDATE, { id }),
      {
        data,
      },
    ),
  );
}
