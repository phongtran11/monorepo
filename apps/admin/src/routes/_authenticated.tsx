import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

import { AppHeader } from '@admin/components/layout/app-header';
import { AppSidebar } from '@admin/components/layout/app-sidebar';
import { SidebarInset, SidebarProvider } from '@admin/components/ui/sidebar';
import { getSessionAction } from '@admin/features/auth/get-session.action';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const session = await getSessionAction();

    if (!session) {
      throw redirect({ to: '/auth/login' });
    }

    return { user: session.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader user={user} />
        <main className="flex flex-1 flex-col gap-4 p-4">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
