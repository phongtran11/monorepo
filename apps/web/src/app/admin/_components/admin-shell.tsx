import { redirect } from 'next/navigation';

import { getProfileAction } from '../action';
import { AdminHeader } from './admin-header';

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const user = await getProfileAction();

  if (!user) {
    redirect('/admin/login');
  }

  return (
    <div className="flex min-h-svh flex-col">
      <AdminHeader user={user} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
