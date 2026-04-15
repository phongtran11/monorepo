'use server';

import { withRevalidate } from '@admin/lib/action-utils';
import { apis } from '@admin/lib/api';
import { API_ENDPOINTS } from '@admin/lib/constants';

import { CategorySchema } from '../schemas/category.schema';
import { Category } from '../types/category.type';

export async function createCategoryAction(data: CategorySchema) {
  return withRevalidate('/categories', () =>
    apis.post<Category, CategorySchema>(API_ENDPOINTS.CATEGORIES.BASE, {
      data: {
        ...data,
        parentId: data.parentId || null,
        imageId: data.imageId || null,
      },
    }),
  );
}
