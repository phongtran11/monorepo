import { serverFetch } from '@admin/lib/server/fetch';
import type { UserProfile } from '@admin/features/auth/session.type';

export interface TokenData {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
}

/**
 * Fetches the user profile using the provided access token.
 * Returns null if the token is invalid or expired.
 */
export async function fetchProfile(
  accessToken: string,
): Promise<UserProfile | null> {
  try {
    const result = await serverFetch<UserProfile>('/auth/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return result.data;
  } catch {
    return null;
  }
}

/**
 * Attempts a silent token refresh using the provided refresh token.
 * Returns new token data on success, or null if the refresh token is
 * invalid or expired.
 */
export async function silentRefresh(
  refreshToken: string,
): Promise<TokenData | null> {
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
