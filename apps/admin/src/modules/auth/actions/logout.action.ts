'use server';

import { apis } from '@admin/lib/api';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function logoutAction() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refresh_token')?.value;

  if (refreshToken) {
    // Apis handles setting the access token natively, but if your backend needs the
    // refresh token to revoke it, we can pass it here.
    await apis.post('/auth/logout', {
      headers: { Authorization: `Bearer ${refreshToken}` },
    });
  }

  // Apis perfectly handles cookie cleaning
  await apis.clearTokens();

  redirect('/login');
}
