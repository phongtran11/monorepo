import { createServerFn } from '@tanstack/react-start';
import { setCookie } from '@tanstack/react-start/server';

import { serverFetch } from '@admin/lib/server/fetch';
import { loginSchema } from './login.schema';

interface LoginData {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
  user: {
    id: string;
    email: string;
    role: number;
    status: number;
  };
}

export const loginAction = createServerFn({ method: 'POST' })
  .inputValidator(loginSchema)
  .handler(async ({ data }) => {
    const result = await serverFetch<LoginData>('/auth/login', {
      method: 'POST',
      body: data,
    });

    const {
      accessToken,
      accessTokenExpiresIn,
      refreshToken,
      refreshTokenExpiresIn,
      user,
    } = result.data;

    const cookieBase = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    setCookie('access_token', accessToken, {
      ...cookieBase,
      maxAge: accessTokenExpiresIn,
    });

    setCookie('refresh_token', refreshToken, {
      ...cookieBase,
      maxAge: refreshTokenExpiresIn,
    });

    return { user };
  });
