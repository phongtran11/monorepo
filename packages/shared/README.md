# @lam-thinh-ecommerce/shared

Shared TypeScript constants, types, and helper functions used across the `api` and `admin` packages. Built with rolldown and published as ES modules.

## Installation

This package is consumed internally via the pnpm workspace — no separate install needed.

```typescript
import {
  Role,
  AccountStatus,
  Permission,
  formatVND,
  slugify,
} from '@lam-thinh-ecommerce/shared';
```

## Scripts

```bash
pnpm dev:shared    # Build in watch mode
pnpm build:shared  # Build once (output to dist/)
pnpm check         # Prettier + ESLint fix (run from repo root)
```

## API Reference

### Constants

#### `Role`

```typescript
const Role = {
  CUSTOMER: 1,
  STAFF: 2,
  ADMIN: 3,
} as const;

const ROLE_LABELS = {
  1: 'User',
  2: 'Staff',
  3: 'Super Admin',
};
```

#### `AccountStatus`

```typescript
const AccountStatus = {
  INACTIVE: 1, // Pending email verification
  ACTIVE: 2,
  BANNED: 3, // Blocked by admin
} as const;
```

#### `Permission`

Individual permission flags assigned to roles:

```
READ_USERS, CREATE_USER, UPDATE_USER, DELETE_USER
READ_ORDERS, UPDATE_ORDER
CREATE_CATEGORY, READ_CATEGORIES, UPDATE_CATEGORY, DELETE_CATEGORY
CREATE_PRODUCT, READ_PRODUCTS, UPDATE_PRODUCT, DELETE_PRODUCT
MANAGE_SYSTEM
```

#### `RolePermissionsMap`

Maps each `Role` to its permitted `Permission[]`:

| Role       | Permissions                                  |
| ---------- | -------------------------------------------- |
| `ADMIN`    | All permissions                              |
| `STAFF`    | All except user management + `MANAGE_SYSTEM` |
| `CUSTOMER` | `READ_CATEGORIES`, `READ_PRODUCTS`           |

#### `ProductStatus`

```typescript
const ProductStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
} as const;
```

---

### Types

#### `ApiResponse<T>`

Standard envelope returned by every API endpoint:

```typescript
interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  error: string | null;
}
```

#### `TokenPair` / `LoginResponse`

```typescript
interface TokenPair {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
}

type LoginResponse = TokenPair;
```

---

### Helpers

#### `formatYearMonth(date?: Date): string`

Returns a `'YYYY-MM'` string. Used for Cloudinary folder paths (`uploads/<resource>/YYYY-MM`).

```typescript
formatYearMonth();              // '2026-04'
formatYearMonth(new Date(...)); // '2025-12'
```

#### `slugify(text: string): string`

Converts a string to a URL-safe slug. Handles Vietnamese diacritics.

```typescript
slugify('Áo thun nam'); // 'ao-thun-nam'
slugify('Hello World'); // 'hello-world'
```

#### `formatCurrency(amount, currency?, locale?): string`

Locale-aware currency formatter. Defaults to VND / `vi-VN`.

```typescript
formatCurrency(150000); // '150.000 ₫'
formatCurrency(19.99, 'USD', 'en-US'); // '$19.99'
```

#### `formatVND(amount: number): string`

Shorthand for `formatCurrency(amount, 'VND', 'vi-VN')`.

```typescript
formatVND(250000); // '250.000 ₫'
```

## Build

Uses **rolldown** (ES module output) and **dts-bundle-generator** for the `.d.ts` bundle. Output goes to `dist/`.
