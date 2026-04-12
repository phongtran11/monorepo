'use server';

import { apis } from '@admin/lib/api';
import { API_ENDPOINTS } from '@admin/lib/constants';
import { revalidatePath } from 'next/cache';

import { CategorySchema } from '../schemas/category.schema';
import { Category } from '../types/category.type';

export async function updateCategoryAction(id: string, data: CategorySchema) {
  const payload = {
    name: data.name,
    displayOrder: data.displayOrder,
    parentId: data.parentId || null,
    imageId: data.imageId || undefined,
  };

  const result = await apis.patch<Category, typeof payload>(
    `${API_ENDPOINTS.CATEGORIES.BASE}/${id}`,
    { data: payload },
  );

  if (result.success) {
    revalidatePath('/categories');
  }

  return result;
}
