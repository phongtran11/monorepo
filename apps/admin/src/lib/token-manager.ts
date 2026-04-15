import { ApiResponse, TokenPair } from '@lam-thinh-ecommerce/shared';
import { cookies } from 'next/headers';

import { API_ENDPOINTS, COOKIES } from './constants';
import { env } from './env';
import { Logger } from './logger';
import { buildUrl } from './utils';

class TokenManager {
  private readonly logger = new Logger('TokenManager');
  private readonly apiUrl = env.API_URL;

  constructor() {}

  async getAccessToken() {
    try {
      const cookieStore = await cookies();
      return cookieStore.get(COOKIES.ACCESS_TOKEN)?.value;
    } catch {
      return null;
    }
  }

  async getRefreshToken() {
    try {
      const cookieStore = await cookies();
      return cookieStore.get(COOKIES.REFRESH_TOKEN)?.value;
    } catch {
      return null;
    }
  }

  async setTokens(tokens: TokenPair) {
    try {
      const cookieStore = await cookies();
      const baseCookie = {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
      };

      cookieStore.set(COOKIES.ACCESS_TOKEN, tokens.accessToken, {
        ...baseCookie,
        maxAge: tokens.accessTokenExpiresIn,
      });
      cookieStore.set(COOKIES.REFRESH_TOKEN, tokens.refreshToken, {
        ...baseCookie,
        maxAge: tokens.refreshTokenExpiresIn,
      });
      this.logger.info('Tokens successfully saved to cookies');
    } catch (e) {
      this.logger.error('Failed to set cookies during token refresh: %o', e);
    }
  }

  async clearTokens() {
    try {
      const cookieStore = await cookies();
      cookieStore.delete(COOKIES.ACCESS_TOKEN);
      cookieStore.delete(COOKIES.REFRESH_TOKEN);
      this.logger.info('Tokens successfully cleared from cookies');
    } catch (e) {
      this.logger.error('Failed to clear cookies: %o', e);
    }
  }

  async refreshTokens(): Promise<boolean> {
    const refreshToken = await this.getRefreshToken();
    this.logger.info(
      'Starting silent token refresh with refresh token: %s',
      refreshToken,
    );

    if (!refreshToken) {
      this.logger.warn('No refresh token found for silent refresh');
      return false;
    }

    try {
      const url = buildUrl(this.apiUrl, API_ENDPOINTS.AUTH.REFRESH);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${refreshToken}`,
        },
      });

      if (!response.ok) {
        this.logger.error(
          'Refresh token request failed with status: %d',
          response.status,
        );
        await this.clearTokens();
        return false;
      }

      const result = (await response.json()) as ApiResponse<TokenPair>;
      if (result.success && result.data) {
        await this.setTokens(result.data);
        return true;
      }

      await this.clearTokens();
      return false;
    } catch (e) {
      this.logger.error('Token refresh network error: %o', e);
      return false;
    }
  }
}

export const tokenManager = new TokenManager();
