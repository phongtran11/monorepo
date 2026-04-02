import {
  clearAuthCookies,
  getAccessToken,
  getApiBaseUrl,
  getRefreshToken,
  setAuthCookies,
} from '~~/server/utils/auth';
import type { ApiResponse, TokenPair } from '~~/types/api';

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path');
  const method = event.method;
  const query = getQuery(event);
  const accessToken = getAccessToken(event);
  const apiBaseUrl = getApiBaseUrl();
  const targetUrl = `${apiBaseUrl}/${path}`;

  const headers: Record<string, string> = {};
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const body = ['GET', 'HEAD'].includes(method)
    ? undefined
    : await readBody(event);

  try {
    return await $fetch(targetUrl, {
      method,
      headers,
      body,
      query,
    });
  } catch (error: unknown) {
    const err = error as { statusCode?: number };

    // Attempt token refresh on 401
    if (err.statusCode === 401) {
      const refreshToken = getRefreshToken(event);
      if (!refreshToken) {
        clearAuthCookies(event);
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
      }

      try {
        const refreshResponse = await $fetch<ApiResponse<TokenPair>>(
          `${apiBaseUrl}/auth/refresh`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          },
        );

        setAuthCookies(event, refreshResponse.data);

        // Retry original request with new token
        return await $fetch(targetUrl, {
          method,
          headers: {
            Authorization: `Bearer ${refreshResponse.data.accessToken}`,
          },
          body,
          query,
        });
      } catch {
        clearAuthCookies(event);
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
      }
    }

    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: 'API request failed',
    });
  }
});
