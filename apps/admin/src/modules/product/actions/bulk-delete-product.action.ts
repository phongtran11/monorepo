'use server';

import { withRevalidate } from '@admin/lib/action-utils';
import { apis } from '@admin/lib/api';
import { API_ENDPOINTS } from '@admin/lib/constants';

export async function bulkDeleteProductAction(ids: string[]) {
  return withRevalidate('/products', () =>
    apis.delete<null, { ids: string[] }>(
      `${API_ENDPOINTS.PRODUCTS.BASE}/bulk`,
      { data: { ids } },
    ),
  );
}
