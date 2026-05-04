'use server';

import { withRevalidate } from '@admin/lib/action-utils';
import { apis } from '@admin/lib/api';
import { API_ENDPOINTS } from '@admin/lib/constants';
import { generatePath } from '@admin/lib/routes';

export async function deleteCategoryAction(id: string) {
  return withRevalidate('/categories', () =>
    apis.delete<null>(generatePath(API_ENDPOINTS.CATEGORIES.DELETE, { id })),
  );
}
