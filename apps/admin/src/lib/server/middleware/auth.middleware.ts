import { createMiddleware } from '@tanstack/react-start';
import { getCookie, setCookie } from '@tanstack/react-start/server';
import { redirect } from '@tanstack/react-router';

import { logger } from '@admin/lib/server/logger';
import { silentRefresh } from '@admin/lib/server/auth';

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

/**
 * Per-action server middleware that guarantees a valid access token before
 * the handler runs.
 *
 * Flow:
 *  1. If `access_token` cookie exists → pass it through via context.
 *  2. If missing → attempt silent refresh using `refresh_token` cookie.
 *  3. On successful refresh → update both cookies and pass new token via context.
 *  4. On failure → throw redirect to /auth/login.
 *
 * Usage: add `.middleware([authMiddleware])` to any authenticated server function.
 * The handler receives `context.accessToken` guaranteed to be a fresh token.
 */
export const authMiddleware = createMiddleware().server(async ({ next }) => {
  let accessToken = getCookie('access_token');
  const refreshToken = getCookie('refresh_token');

  if (!accessToken) {
    if (!refreshToken) {
      throw redirect({ to: '/auth/login' });
    }

    logger.debug('Access token missing — attempting silent refresh');

    const tokens = await silentRefresh(refreshToken);

    if (!tokens) {
      logger.warn('Silent refresh failed — redirecting to login');
      throw redirect({ to: '/auth/login' });
    }

    setCookie('access_token', tokens.accessToken, {
      ...cookieBase,
      maxAge: tokens.accessTokenExpiresIn,
    });
    setCookie('refresh_token', tokens.refreshToken, {
      ...cookieBase,
      maxAge: tokens.refreshTokenExpiresIn,
    });

    accessToken = tokens.accessToken;
    logger.debug('Silent refresh successful');
  }

  return next({ context: { accessToken } });
});
