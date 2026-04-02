'use server';

import { ApiError, fetcher } from '@web/lib/fetcher';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { loginSchema } from './login.schema';

export type LoginState = {
  error?: string;
};

type TokenResponse = {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
};

export async function loginAction(data: {
  email: string;
  password: string;
}): Promise<LoginState> {
  const parsed = loginSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const result = await fetcher.post<TokenResponse>('/auth/login', {
      body: parsed.data,
    });

    const {
      accessToken,
      accessTokenExpiresIn,
      refreshToken,
      refreshTokenExpiresIn,
    } = result.data;

    const cookieStore = await cookies();

    cookieStore.set('access_token', accessToken, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: accessTokenExpiresIn,
    });

    cookieStore.set('refresh_token', refreshToken, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: refreshTokenExpiresIn,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        error: error.message || 'Email hoặc mật khẩu không chính xác.',
      };
    }

    return {
      error: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
    };
  }

  redirect('/admin/dashboard');
}
