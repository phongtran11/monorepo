# Shared Package — CLAUDE.md

Context for the shared package (`packages/shared`).

## Purpose

Contains cross-app constants, types, and helpers used by both `api` and `web`.

## What Belongs Here

- Constants shared across apps (account statuses, roles, permissions)
- Type definitions derived from constants using `as const` + `typeof`
- Helper functions used by both apps (slugify, number formatting)
- Barrel exports for clean imports

## Constant Pattern

```typescript
export const AccountStatus = {
  INACTIVE: 1,
  ACTIVE: 2,
  BANNED: 3,
} as const;
export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];
```

## Key Reference

- Role constants: `src/constants/role.constant.ts`
- Import as: `@lam-thinh-ecommerce/shared`
