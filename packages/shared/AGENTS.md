# Shared Package — CLAUDE.md

Context for the shared package (`packages/shared`).

## Purpose

Contains cross-app constants, types, and helpers used by both `api` and `admin`.

## What Belongs Here

- Constants shared across apps (account statuses, roles, permissions, product statuses)
- Type definitions derived from constants using `as const` + `typeof`
- Helper functions used by both apps (slugify, number formatting, date, patch)
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

## Exported Constants

### Role (`src/constants/role.constant.ts`)

```typescript
Role = { CUSTOMER: 1, STAFF: 2, ADMIN: 3 };
ROLE_LABELS = { 1: 'User', 2: 'Staff', 3: 'Super Admin' };
```

### AccountStatus (`src/constants/account-status.constant.ts`)

```typescript
AccountStatus = { INACTIVE: 1, ACTIVE: 2, BANNED: 3 };
// INACTIVE = requires verification, BANNED = blocked by admin
```

### Permission (`src/constants/permission.constant.ts`)

```typescript
Permission = {
  READ_USERS,
  CREATE_USER,
  UPDATE_USER,
  DELETE_USER,
  READ_ORDERS,
  UPDATE_ORDER,
  CREATE_CATEGORY,
  READ_CATEGORIES,
  UPDATE_CATEGORY,
  DELETE_CATEGORY,
  CREATE_PRODUCT,
  READ_PRODUCTS,
  UPDATE_PRODUCT,
  DELETE_PRODUCT,
  MANAGE_SYSTEM,
};
// Values are 'read:users', 'create:category', etc.
```

### ProductStatus (`src/constants/product-status.constant.ts`)

```typescript
ProductStatus = { DRAFT: 'draft', ACTIVE: 'active', ARCHIVED: 'archived' };
```

### RolePermissionsMap (`src/constants/role-permission-mapping.constant.ts`)

Maps each `Role` to its allowed `Permission[]`:

- `ADMIN` — all permissions
- `STAFF` — all except user management and `MANAGE_SYSTEM`
- `CUSTOMER` — `READ_CATEGORIES`, `READ_PRODUCTS` only

Used in admin middleware to check route access.

## Exported Types

### API types (`src/types/api/api.type.ts`)

```typescript
type TokenPair = {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
};

type ApiResponse<T = unknown> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  error: string | null;
};
```

## Exported Helpers

### `formatYearMonth(date?)` (`src/helpers/date.helper.ts`)

Returns `'YYYY-MM'` string. Used by the API for Cloudinary permanent folder paths (`uploads/<resource>/YYYY-MM`).

### `slugify(text)` (`src/helpers/slug.helper.ts`)

Converts text to a URL-safe slug. Handles Vietnamese characters (đ, diacritics).

### `formatCurrency(amount, currency?, locale?)` / `formatVND(amount)` (`src/helpers/number.helper.ts`)

Formats numbers as localized currency strings. Defaults to VND / vi-VN.
