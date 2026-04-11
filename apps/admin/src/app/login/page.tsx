import { LoginPage } from '@admin/modules/auth/pages';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Login() {
  const accessToken = (await cookies()).get('access_token')?.value;

  if (accessToken) {
    redirect('/');
  }

  return <LoginPage />;
}
