'use client';

import React from 'react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@admin/components/ui/breadcrumb';
import { SidebarTrigger } from '@admin/components/ui/sidebar';
import { getBreadcrumbs } from '@admin/lib/routes';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { UserNav } from './user-nav';

export function AppHeader() {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <header className="bg-background sticky top-0 z-10 flex h-auto min-h-14 flex-col items-center justify-between gap-2 border-b px-4 py-2 sm:flex-row sm:py-0">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return !isLast ? (
                <React.Fragment key={item.href ?? item.label}>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link
                        href={item.href ?? '#'}
                        className="flex items-center gap-1"
                      >
                        {item.icon && <item.icon className="size-4" />}
                        {item.label}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </React.Fragment>
              ) : (
                <BreadcrumbItem key={item.href ?? item.label}>
                  <BreadcrumbPage className="flex items-center gap-1">
                    {item.icon && <item.icon className="size-4" />}
                    {item.label}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-3">
        <UserNav />
      </div>
    </header>
  );
}
