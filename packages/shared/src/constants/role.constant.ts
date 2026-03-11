export const Role = {
  CUSTOMER: 1,
  STAFF: 2,
  ADMIN: 3,
} as const;

export type Role = (typeof Role)[keyof typeof Role];
