'use server';

import { apis } from '@admin/lib/api';
import { API_ENDPOINTS, COOKIES } from '@admin/lib/constants';
import { tokenManager } from '@admin/lib/token-manager';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function logoutAction() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(COOKIES.REFRESH_TOKEN)?.value;

  if (refreshToken) {
    // Apis handles setting the access token natively, but if your backend needs the
    // refresh token to revoke it, we can pass it here.
    await apis.post(API_ENDPOINTS.AUTH.LOGOUT, {
      headers: { Authorization: `Bearer ${refreshToken}` },
    });
  }

  // Apis perfectly handles cookie cleaning
  await tokenManager.clearTokens();

  redirect('/login');
}
