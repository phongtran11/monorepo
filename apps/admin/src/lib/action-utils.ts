'server only';

import { ApiResponse } from '@lam-thinh-ecommerce/shared';
import { revalidatePath } from 'next/cache';

/**
 * Calls `fn`, then revalidates `path` on success.
 * Eliminates the boilerplate repeated in every server action.
 */
export async function withRevalidate<T>(
  path: string,
  fn: () => Promise<ApiResponse<T>>,
): Promise<ApiResponse<T>> {
  const result = await fn();
  if (result.success) revalidatePath(path);
  return result;
}
