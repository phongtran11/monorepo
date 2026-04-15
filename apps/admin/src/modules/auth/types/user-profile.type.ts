import { AccountStatus, Permission, Role } from '@lam-thinh-ecommerce/shared';

/**
 * User profile as returned by GET /auth/profile.
 * Mirrors the API's ProfileDto plus the resolved permissions array.
 */
export interface UserProfile {
  id: string;
  email: string;
  role: Role;
  status: AccountStatus;
  permissions: Permission[];
}
