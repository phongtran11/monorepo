'use server';

import { withRevalidate } from '@admin/lib/action-utils';
import { apis } from '@admin/lib/api';
import { API_ENDPOINTS } from '@admin/lib/constants';

export async function deleteCategoryAction(id: string) {
  return withRevalidate('/categories', () =>
    apis.delete<null>(`${API_ENDPOINTS.CATEGORIES.BASE}/${id}`),
  );
}
