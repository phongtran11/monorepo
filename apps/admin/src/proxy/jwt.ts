import { AccountStatus, Role } from '@lam-thinh-ecommerce/shared';

/**
 * Decoded payload of the JWT access token.
 * Mirrors the JwtPayload interface in apps/api.
 */
export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  status: AccountStatus;
  exp: number;
  iat: number;
}

/**
 * Decodes the payload of a JWT without verifying its signature.
 * Safe for use in Edge middleware — the API is the authoritative verifier.
 *
 * @param token - The raw JWT string.
 * @returns The decoded payload, or null if malformed.
 */
export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Base64url → Base64 → JSON
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64)) as JwtPayload;
  } catch {
    return null;
  }
}
