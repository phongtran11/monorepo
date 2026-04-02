import type { H3Event } from 'h3';

import type { TokenPair } from '~~/types/api';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export function getAccessToken(event: H3Event): string | undefined {
  return getCookie(event, ACCESS_TOKEN_KEY);
}

export function getRefreshToken(event: H3Event): string | undefined {
  return getCookie(event, REFRESH_TOKEN_KEY);
}

export function setAuthCookies(event: H3Event, tokens: TokenPair) {
  setCookie(event, ACCESS_TOKEN_KEY, tokens.accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: tokens.accessTokenExpiresIn,
  });

  setCookie(event, REFRESH_TOKEN_KEY, tokens.refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: tokens.refreshTokenExpiresIn,
  });
}

export function clearAuthCookies(event: H3Event) {
  deleteCookie(event, ACCESS_TOKEN_KEY, COOKIE_OPTIONS);
  deleteCookie(event, REFRESH_TOKEN_KEY, COOKIE_OPTIONS);
}

export function getApiBaseUrl() {
  const config = useRuntimeConfig();
  return config.apiBaseUrl as string;
}
