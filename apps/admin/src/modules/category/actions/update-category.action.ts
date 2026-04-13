'use server';

import { apis } from '@admin/lib/api';
import { API_ENDPOINTS } from '@admin/lib/constants';
import { revalidatePath } from 'next/cache';

import { CategorySchema } from '../schemas/category.schema';
import { Category } from '../types/category.type';

export async function updateCategoryAction(id: string, data: CategorySchema) {
  const result = await apis.patch<Category, CategorySchema>(
    `${API_ENDPOINTS.CATEGORIES.BASE}/${id}`,
    {
      data: {
        ...data,
        parentId: data.parentId || null,
        imageId: data.imageId || null,
      },
    },
  );

  if (result.success) {
    revalidatePath('/categories');
  }

  return result;
}
