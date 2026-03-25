import { fetcher } from '@web/lib/fetcher';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

type RefreshTokenResponse = {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
};

export async function authAdminProxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/admin')) return NextResponse.next();
  if (pathname === '/admin/login') return NextResponse.next();

  return checkAuthentication(request);
}

async function checkAuthentication(
  request: NextRequest,
): Promise<NextResponse> {
  const loginUrl = new URL('/admin/login', request.url);
  const accessToken = request.cookies.get('access_token')?.value;

  if (accessToken) return NextResponse.next();

  const refreshToken = request.cookies.get('refresh_token')?.value;

  if (!refreshToken) return NextResponse.redirect(loginUrl);

  const refreshResult = await refreshAccessToken(refreshToken);

  if (!refreshResult) return NextResponse.redirect(loginUrl);

  const response = NextResponse.next();
  response.cookies.set('access_token', refreshResult.accessToken, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: refreshResult.accessTokenExpiresIn,
  });
  response.cookies.set('refresh_token', refreshResult.refreshToken, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: refreshResult.refreshTokenExpiresIn,
  });
  return response;
}

async function refreshAccessToken(
  refreshToken: string,
): Promise<RefreshTokenResponse | null> {
  try {
    const result = await fetcher.get<RefreshTokenResponse>('/auth/refresh', {
      token: refreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken } = result.data;

    if (accessToken && newRefreshToken) {
      return result.data;
    }

    return null;
  } catch {
    return null;
  }
}
