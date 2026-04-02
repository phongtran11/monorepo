import type { LoginInput } from '~/utils';
import { getApiBaseUrl, setAuthCookies } from '~~/server/utils/auth';
import type { ApiResponse, LoginResponse } from '~~/types/api';

export default defineEventHandler(async (event) => {
  const body = await readBody<LoginInput>(event);
  const apiBaseUrl = getApiBaseUrl();

  try {
    const response = await $fetch<ApiResponse<LoginResponse>>(
      `${apiBaseUrl}/auth/login`,
      {
        method: 'POST',
        body,
      },
    );

    setAuthCookies(event, response.data);

    return {
      success: true,
    };
  } catch (error: unknown) {
    const err = error as { statusCode?: number; data?: { message?: string } };
    throw createError({
      statusCode: err.statusCode || 401,
      statusMessage: err.data?.message || 'Invalid credentials',
    });
  }
});
