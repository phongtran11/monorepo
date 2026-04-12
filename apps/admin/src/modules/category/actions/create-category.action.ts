'use server';

import { apis } from '@admin/lib/api';
import { API_ENDPOINTS } from '@admin/lib/constants';
import { revalidatePath } from 'next/cache';

import { CategorySchema } from '../schemas/category.schema';
import { Category } from '../types/category.type';

export async function createCategoryAction(data: CategorySchema) {
  const payload = {
    name: data.name,
    displayOrder: data.displayOrder,
    parentId: data.parentId || null,
    imageId: data.imageId || undefined,
  };

  const result = await apis.post<Category, typeof payload>(
    API_ENDPOINTS.CATEGORIES.BASE,
    { data: payload },
  );

  if (result.success) {
    revalidatePath('/categories');
  }

  return result;
}
