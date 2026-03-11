export const AccountStatus = {
  INACTIVE: 1, // Require email verification (Customer) or password setup (Staff)
  ACTIVE: 2, // Fully verified and ready
  BANNED: 3, // Blocked by Admin
} as const;

export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];
