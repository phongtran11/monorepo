import { SidebarTrigger } from '@admin/components/ui/sidebar';

import { UserNav } from './user-nav';

export function AppHeader() {
  return (
    <header className="bg-background sticky top-0 z-10 flex h-14 items-center gap-3 border-b px-4">
      <SidebarTrigger />

      <div className="ml-auto flex items-center gap-3">
        <UserNav name="Admin User" email="admin@lamthinh.dev" />
      </div>
    </header>
  );
}
