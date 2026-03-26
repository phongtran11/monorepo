import {
  clearAuthCookies,
  getApiBaseUrl,
  getRefreshToken,
  setAuthCookies,
} from '~~/server/utils/auth';
import type { ApiResponse, TokenPair } from '~~/types/api';

export default defineEventHandler(async (event) => {
  const refreshToken = getRefreshToken(event);

  if (!refreshToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No refresh token',
    });
  }

  const apiBaseUrl = getApiBaseUrl();

  try {
    const response = await $fetch<ApiResponse<TokenPair>>(
      `${apiBaseUrl}/auth/refresh`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      },
    );

    setAuthCookies(event, response.data);

    return { success: true };
  } catch {
    clearAuthCookies(event);
    throw createError({
      statusCode: 401,
      statusMessage: 'Token refresh failed',
    });
  }
});
