/**
 * Status of an account in the system.
 */
export const AccountStatus = {
  /** Require email verification (Customer) or password setup (Staff) */
  INACTIVE: 1,
  /** Fully verified and ready */
  ACTIVE: 2,
  /** Blocked by Admin */
  BANNED: 3,
} as const;

/**
 * Type representing the possible status values of an account.
 */
export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];
