'use server';

import { fetcher } from '@web/lib/fetcher';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export type UserProfile = {
  id: string;
  email: string;
  role: number;
  status: number;
  permissions: string[];
};

export async function getProfileAction(): Promise<UserProfile | null> {
  try {
    const accessToken = (await cookies()).get('access_token')?.value;
    const result = await fetcher.get<UserProfile>('/auth/profile', {
      token: accessToken,
    });

    return result.data;
  } catch {
    return null;
  }
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refresh_token')?.value;

  if (refreshToken) {
    try {
      await fetcher.post('/auth/logout', {
        token: refreshToken,
      });
    } catch (error) {
      console.log('Logout failed:', error);
    }
  }

  cookieStore.delete('access_token');
  cookieStore.delete('refresh_token');

  redirect('/admin/login');
}
