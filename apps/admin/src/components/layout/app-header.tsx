import React from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { ChevronsUpDown, LogOut, Moon, Sun, User } from 'lucide-react';

import { Avatar, AvatarFallback } from '@admin/components/ui/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@admin/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@admin/components/ui/dropdown-menu';
import { Separator } from '@admin/components/ui/separator';
import { SidebarTrigger, useSidebar } from '@admin/components/ui/sidebar';

import type { UserProfile } from '@admin/features/auth/session.type';

interface BreadcrumbSegment {
  label: string;
  href: string;
}

function buildBreadcrumbs(pathname: string): BreadcrumbSegment[] {
  if (pathname === '/') return [{ label: 'Dashboard', href: '/' }];

  const segments = pathname.split('/').filter(Boolean);
  const crumbs: BreadcrumbSegment[] = [{ label: 'Dashboard', href: '/' }];

  let accumulated = '';
  for (const seg of segments) {
    accumulated += `/${seg}`;
    crumbs.push({
      label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
      href: accumulated,
    });
  }

  return crumbs;
}

function ThemeToggle() {
  const toggleTheme = () => {
    const root = document.documentElement;
    const isDark = root.classList.contains('dark');
    const next = isDark ? 'light' : 'dark';
    root.classList.remove('light', 'dark');
    root.classList.add(next);
    root.setAttribute('data-theme', next);
    root.style.colorScheme = next;
    localStorage.setItem('theme', next);
  };

  return (
    <button
      onClick={toggleTheme}
      className="hover:bg-sidebar-accent text-sidebar-foreground flex size-8 items-center justify-center rounded-md transition-colors"
      aria-label="Toggle theme"
    >
      <Sun className="size-4 dark:hidden" />
      <Moon className="hidden size-4 dark:block" />
    </button>
  );
}

interface AppHeaderProps {
  user: UserProfile;
}

export function AppHeader({ user }: AppHeaderProps) {
  const { location } = useRouterState();
  const { isMobile } = useSidebar();
  const breadcrumbs = buildBreadcrumbs(location.pathname);

  const initials = user.email.slice(0, 2).toUpperCase();

  return (
    <header className="bg-background flex h-12 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      <Breadcrumb className="flex-1">
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.href}>
                <BreadcrumbItem
                  className={
                    isMobile && index < breadcrumbs.length - 1
                      ? 'hidden'
                      : undefined
                  }
                >
                  {isLast ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link to={crumb.href}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-1">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="hover:bg-sidebar-accent flex items-center gap-2 rounded-md p-1.5 transition-colors">
              <Avatar className="size-7">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <ChevronsUpDown className="size-3.5 opacity-50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium">{user.email}</p>
                <p className="text-muted-foreground text-xs">
                  Role {user.role}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <User className="mr-2 size-4" />
                Tài khoản
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 size-4" />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
