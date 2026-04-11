import { AppHeader } from '@admin/components/app-header';
import { AppSidebar } from '@admin/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@admin/components/ui/sidebar';
import { TooltipProvider } from '@admin/components/ui/tooltip';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <main className="flex-1 p-4">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
