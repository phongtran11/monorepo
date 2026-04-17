'use server';

import { withRevalidate } from '@admin/lib/action-utils';
import { apis } from '@admin/lib/api';
import { API_ENDPOINTS } from '@admin/lib/constants';
import { toNullableField } from '@lam-thinh-ecommerce/shared';

import { CategorySchema } from '../schemas/category.schema';
import { Category } from '../types/category.type';

export async function updateCategoryAction(id: string, data: CategorySchema) {
  return withRevalidate('/categories', () =>
    apis.patch<Category, CategorySchema>(
      `${API_ENDPOINTS.CATEGORIES.BASE}/${id}`,
      {
        data: {
          ...data,
          parentId: toNullableField(data.parentId),
          imageId: toNullableField(data.imageId),
        },
      },
    ),
  );
}
