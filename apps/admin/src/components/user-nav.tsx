'use client';

import { Avatar, AvatarFallback } from '@admin/components/ui/avatar';
import { Button } from '@admin/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@admin/components/ui/dropdown-menu';
import { logoutAction } from '@admin/modules/auth/actions/logout.action';
import { useUser } from '@admin/modules/auth/context/user.context';
import { LogOut } from 'lucide-react';

export function UserNav() {
  const { user } = useUser();

  // Derive a display name from the email prefix when no full name is available
  const displayName = user?.email.split('@')[0] ?? '—';
  const email = user?.email ?? '';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative size-9 rounded-full p-0">
          <Avatar className="size-9">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span className="text-sm font-medium">{displayName}</span>
          <span className="text-muted-foreground text-xs font-normal">
            {email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={logoutAction}>
            <LogOut data-icon="inline-start" />
            Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
