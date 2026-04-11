'use server';

import { apis } from '@admin/lib/api';
import { LoginResponse } from '@lam-thinh-ecommerce/shared';
import { redirect } from 'next/navigation';

import { LoginSchema } from '../schemas/login.schema';

export async function loginAction(data: LoginSchema) {
  const result = await apis.post<LoginResponse, LoginSchema>('/auth/login', {
    data,
  });

  if (!result.success || !result.data) {
    return result;
  }

  // Safely use TokenManager to enforce clean single-responsibility
  await apis.setTokens(result.data);

  redirect('/');
}
