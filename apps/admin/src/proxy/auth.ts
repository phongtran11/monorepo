import {
  ADMIN_ALLOWED_ROLES,
  API_ENDPOINTS,
  COOKIES,
} from '@admin/lib/constants';
import { env } from '@admin/lib/env';
import {
  AccountStatus,
  ApiResponse,
  RolePermissionsMap,
  TokenPair,
} from '@lam-thinh-ecommerce/shared';
import { NextRequest, NextResponse } from 'next/server';

import { decodeJwtPayload } from './jwt';
import { ROUTES } from '@admin/lib/routes';

async function refreshTokens(refreshToken: string): Promise<TokenPair | null> {
  try {
    const response = await fetch(
      `${env.API_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${refreshToken}`,
        },
      },
    );

    if (!response.ok) return null;

    const result = (await response.json()) as ApiResponse<TokenPair>;
    if (result.success && result.data) return result.data;
    return null;
  } catch {
    return null;
  }
}

function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = new URL('/login', request.url);
  const res = NextResponse.redirect(loginUrl);

  // Clear stale cookies so the login page starts fresh
  res.cookies.delete(COOKIES.ACCESS_TOKEN);
  res.cookies.delete(COOKIES.REFRESH_TOKEN);

  return res;
}

function hasRouteAccess(
  pathname: string,
  role: (typeof ADMIN_ALLOWED_ROLES)[number],
): boolean {
  const userPermissions = RolePermissionsMap[role];

  for (const route of ROUTES) {
    if (pathname.startsWith(route.path)) {
      return route.permissions.every((p) => userPermissions.includes(p));
    }
  }

  // No specific rule → allowed for any admin/staff
  return true;
}

export async function handleAuth(
  request: NextRequest,
): Promise<NextResponse | null> {
  const accessToken = request.cookies.get(COOKIES.ACCESS_TOKEN)?.value;
  const refreshToken = request.cookies.get(COOKIES.REFRESH_TOKEN)?.value;
  const { pathname } = request.nextUrl;

  // ── No tokens at all ────────────────────────────────────────────────────────
  if (!accessToken && !refreshToken) {
    return pathname === '/login' ? null : redirectToLogin(request);
  }

  // ── No access token but refresh token present → try silent refresh ──────────
  if (!accessToken && refreshToken) {
    const tokens = await refreshTokens(refreshToken);

    if (!tokens) {
      return redirectToLogin(request);
    }

    const payload = decodeJwtPayload(tokens.accessToken);

    if (!payload || !ADMIN_ALLOWED_ROLES.includes(payload.role)) {
      return redirectToLogin(request);
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-role', String(payload.role));
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    const baseCookie = {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    response.cookies.set(COOKIES.ACCESS_TOKEN, tokens.accessToken, {
      ...baseCookie,
      maxAge: tokens.accessTokenExpiresIn,
    });
    response.cookies.set(COOKIES.REFRESH_TOKEN, tokens.refreshToken, {
      ...baseCookie,
      maxAge: tokens.refreshTokenExpiresIn,
    });

    return response;
  }

  // ── Access token present → validate role, status, and route permissions ──────
  if (accessToken) {
    const payload = decodeJwtPayload(accessToken);

    // Malformed token
    if (!payload) {
      return redirectToLogin(request);
    }

    // Banned accounts cannot access anything
    if (payload.status === AccountStatus.BANNED) {
      return redirectToLogin(request);
    }

    // Only ADMIN and STAFF may use the admin dashboard
    if (!ADMIN_ALLOWED_ROLES.includes(payload.role)) {
      return redirectToLogin(request);
    }

    // Fine-grained route permission check
    if (!hasRouteAccess(pathname, payload.role)) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Forward the decoded role to the page via request header so pages don't
    // need to re-decode the JWT cookie themselves.
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-role', String(payload.role));
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  return null;
}
