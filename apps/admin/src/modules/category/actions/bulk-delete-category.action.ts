'use server';

import { apis } from '@admin/lib/api';
import { API_ENDPOINTS } from '@admin/lib/constants';
import { revalidatePath } from 'next/cache';

export async function bulkDeleteCategoryAction(ids: string[]) {
  const result = await apis.delete<null, { ids: string[] }>(
    `${API_ENDPOINTS.CATEGORIES.BASE}/bulk`,
    { data: { ids } },
  );

  if (result.success) {
    revalidatePath('/categories');
  }

  return result;
}
