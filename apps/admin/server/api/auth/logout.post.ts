import {
  clearAuthCookies,
  getApiBaseUrl,
  getRefreshToken,
} from '~~/server/utils/auth';
import type { ApiResponse } from '~~/types/api';

export default defineEventHandler(async (event) => {
  try {
    const refreshToken = getRefreshToken(event);
    const apiBaseUrl = getApiBaseUrl();

    if (!refreshToken) {
      clearAuthCookies(event);
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    await $fetch<ApiResponse>(`${apiBaseUrl}/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    });
  } catch {
    // Ignore errors - we want to clear cookies regardless
  } finally {
    clearAuthCookies(event);
  }
});
