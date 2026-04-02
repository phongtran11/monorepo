'use client';

import {
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@web/components';
import { getInitials } from '@web/lib/helper/string.helper';
import { ROLE_LABELS } from '@lam-thinh-ecommerce/shared';
import { LogOut, Shield, User } from 'lucide-react';
import { useTransition } from 'react';

import { logoutAction, type UserProfile } from '../action';

type AdminHeaderProps = {
  user: UserProfile;
};

export function AdminHeader({ user }: AdminHeaderProps) {
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logoutAction();
    });
  }

  const roleLabel = ROLE_LABELS[user.role] ?? 'Unknown';
  const initials = getInitials(user.email);

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center border-b bg-background/95 px-6 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex flex-1 items-center gap-4">
        <h1 className="text-lg font-semibold tracking-tight">
          Admin Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar size="sm">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium leading-none">{user.email}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {roleLabel}
              </p>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" sideOffset={8} className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium leading-none">
                    {user.email}
                  </p>
                  <p className="text-xs text-muted-foreground">{roleLabel}</p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem>
                <User className="mr-2 size-4" />
                <span>Thông tin cá nhân</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Shield className="mr-2 size-4" />
                <span>Quyền hạn</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              variant="destructive"
              disabled={isPending}
              onClick={handleLogout}
            >
              <LogOut className="mr-2 size-4" />
              <span>{isPending ? 'Đang đăng xuất...' : 'Đăng xuất'}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
