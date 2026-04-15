'use client';

import { Permission } from '@lam-thinh-ecommerce/shared';
import { createContext, use } from 'react';

import { UserProfile } from '../types/user-profile.type';

interface UserContextValue {
  user: UserProfile | null;
}

const UserContext = createContext<UserContextValue | null>(null);

interface UserProviderProps {
  user: UserProfile | null;
  children: React.ReactNode;
}

/**
 * Provides the authenticated user's profile to the component tree.
 * Should be rendered once in the authenticated layout after fetching
 * the profile server-side.
 */
export function UserProvider({ user, children }: UserProviderProps) {
  return <UserContext value={{ user }}>{children}</UserContext>;
}

/**
 * Returns the authenticated user's profile from context.
 * Must be used inside <UserProvider>.
 */
export function useUser(): UserContextValue {
  const ctx = use(UserContext);
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>');
  return ctx;
}

/**
 * Returns true if the current user has the given permission.
 * Returns false when the user is not loaded or the permission is absent.
 */
export function usePermission(permission: Permission): boolean {
  const { user } = useUser();
  return user?.permissions.includes(permission) ?? false;
}
