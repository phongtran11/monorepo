import { Suspense } from 'react';

import { AdminShell } from '../_components';

export default function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh flex-col">
          <header className="sticky top-0 z-40 flex h-14 w-full items-center border-b bg-background/95 px-6 backdrop-blur">
            <div className="flex flex-1 items-center gap-4">
              <h1 className="text-lg font-semibold tracking-tight">
                Admin Dashboard
              </h1>
            </div>
            <div className="size-6 animate-pulse rounded-full bg-muted" />
          </header>
          <main className="flex-1">{children}</main>
        </div>
      }
    >
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
