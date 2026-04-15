'use server';

import { withRevalidate } from '@admin/lib/action-utils';
import { apis } from '@admin/lib/api';
import { API_ENDPOINTS } from '@admin/lib/constants';

export async function bulkDeleteCategoryAction(ids: string[]) {
  return withRevalidate('/categories', () =>
    apis.delete<null, { ids: string[] }>(
      `${API_ENDPOINTS.CATEGORIES.BASE}/bulk`,
      { data: { ids } },
    ),
  );
}
