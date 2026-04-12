'use server';

import { apis } from '@admin/lib/api';
import { API_ENDPOINTS } from '@admin/lib/constants';
import { revalidatePath } from 'next/cache';

export async function deleteCategoryAction(id: string) {
  const result = await apis.delete<null>(
    `${API_ENDPOINTS.CATEGORIES.BASE}/${id}`,
  );

  if (result.success) {
    revalidatePath('/categories');
  }

  return result;
}
