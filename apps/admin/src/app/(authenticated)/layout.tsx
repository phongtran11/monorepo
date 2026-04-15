import { AppHeader } from '@admin/components/app-header';
import { AppSidebar } from '@admin/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@admin/components/ui/sidebar';
import { Toaster } from '@admin/components/ui/sonner';
import { TooltipProvider } from '@admin/components/ui/tooltip';
import { apis } from '@admin/lib/api';
import { API_ENDPOINTS } from '@admin/lib/constants';
import { UserProvider } from '@admin/modules/auth/context/user.context';
import { UserProfile } from '@admin/modules/auth/types/user-profile.type';

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await apis.get<UserProfile>(API_ENDPOINTS.AUTH.PROFILE);
  const user = result.success && result.data ? result.data : null;

  return (
    <UserProvider user={user}>
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <AppHeader />
            <div className="flex-1 p-4">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
      <Toaster richColors position="top-right" />
    </UserProvider>
  );
}
