import { createServerFn } from '@tanstack/react-start';
import { getCookie, setCookie } from '@tanstack/react-start/server';

import { logger } from '@admin/lib/server/logger';
import { serverFetch } from '@admin/lib/server/fetch';
import type { Session, UserProfile } from './session.type';

interface TokenData {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
}

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

async function fetchProfile(accessToken: string): Promise<UserProfile | null> {
  try {
    const result = await serverFetch<UserProfile>('/auth/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return result.data;
  } catch {
    return null;
  }
}

async function silentRefresh(refreshToken: string): Promise<TokenData | null> {
  try {
    const result = await serverFetch<TokenData>('/auth/refresh', {
      method: 'POST',
      headers: { Authorization: `Bearer ${refreshToken}` },
    });
    return result.data;
  } catch {
    return null;
  }
}

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

    logger.info('Access token missing or expired — attempting silent refresh');

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

    logger.info({ userId: user.id }, 'Silent refresh successful');
    return { user };
  },
);
