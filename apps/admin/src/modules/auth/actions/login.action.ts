'use server';

import { apis } from '@admin/lib/api';
import { API_ENDPOINTS } from '@admin/lib/constants';
import { tokenManager } from '@admin/lib/token-manager';
import { LoginResponse } from '@lam-thinh-ecommerce/shared';
import { redirect } from 'next/navigation';

import { LoginSchema } from '../schemas/login.schema';

export async function loginAction(data: LoginSchema) {
  const result = await apis.post<LoginResponse, LoginSchema>(
    API_ENDPOINTS.AUTH.LOGIN,
    {
      data,
    },
  );

  if (!result.success || !result.data) {
    return result;
  }

  // Safely use TokenManager to enforce clean single-responsibility
  await tokenManager.setTokens(result.data);

  redirect('/');
}
