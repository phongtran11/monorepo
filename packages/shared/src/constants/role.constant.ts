/**
 * User roles defined in the system.
 */
export const Role = {
  /** End-user who can browse products and place orders */
  CUSTOMER: 1,
  /** Staff member who manages orders and content */
  STAFF: 2,
  /** Administrator with full system access */
  ADMIN: 3,
} as const;

/**
 * Type representing the available user roles.
 */
export type Role = (typeof Role)[keyof typeof Role];

/**
 * Human-readable labels for each role, keyed by role value.
 */
export const ROLE_LABELS: Record<number, string> = {
  [Role.CUSTOMER]: 'User',
  [Role.STAFF]: 'Staff',
  [Role.ADMIN]: 'Super Admin',
};
