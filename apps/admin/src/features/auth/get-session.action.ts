import { createServerFn } from '@tanstack/react-start';
import { getCookie, setCookie } from '@tanstack/react-start/server';

import { logger } from '@admin/lib/server/logger';
import { fetchProfile, silentRefresh } from '@admin/lib/server/auth';
import type { Session } from './session.type';

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

/**
 * Returns the current session by validating the access token cookie.
 * If the access token is missing or expired, attempts a silent refresh
 * using the refresh token cookie and updates cookies with the new tokens.
 * Returns `null` if no valid session can be established.
 */
export const getSessionAction = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Session | null> => {
    const accessToken = getCookie('access_token');
    const refreshToken = getCookie('refresh_token');

    if (accessToken) {
      const user = await fetchProfile(accessToken);
      if (user) return { user };
    }

    if (!refreshToken) return null;

    logger.debug('Access token missing or expired — attempting silent refresh');

    const tokens = await silentRefresh(refreshToken);

    if (!tokens) {
      logger.warn('Silent refresh failed — refresh token invalid or expired');
      return null;
    }

    setCookie('access_token', tokens.accessToken, {
      ...cookieBase,
      maxAge: tokens.accessTokenExpiresIn,
    });
    setCookie('refresh_token', tokens.refreshToken, {
      ...cookieBase,
      maxAge: tokens.refreshTokenExpiresIn,
    });

    const user = await fetchProfile(tokens.accessToken);

    if (!user) {
      logger.warn('Profile fetch failed after successful token refresh');
      return null;
    }

    logger.debug({ userId: user.id }, 'Silent refresh successful');
    return { user };
  },
);
