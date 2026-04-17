# Plan: Fix Header Breadcrumb — Replace Custom Component with shadcn Breadcrumb

## Summary
The current `AppHeader` uses a hand-rolled `Breadcrumb` atom instead of the shadcn Breadcrumb component. The `getBreadcrumbs` helper in `src/lib/routes.ts` has two logic bugs: an off-by-one loop that produces duplicate items, and a dynamic-segment matcher that only handles numeric IDs (not UUIDs). This plan adds the shadcn Breadcrumb to `components/ui/`, fixes the route-building logic, and rewires the header to use the correct component.

## User Story
As an admin dashboard user, I want accurate, properly styled breadcrumbs in the header so that I always know where I am in the navigation hierarchy.

## Problem → Solution
- Off-by-one loop (`i <= segments.length`) re-pushes the last matched route, duplicating items.
- UUID-based dynamic routes (`/products/abc-uuid/edit`) never match because the guard uses `!isNaN(Number(...))`.
- No route entry exists for `/products/:id` (product detail page).
- The custom `atoms/breadcrumb.tsx` duplicates shadcn Breadcrumb functionality that should live in `components/ui/`.

→ Fix loop bounds, generalise dynamic-segment detection (any non-empty string is a `:id`), add missing route entry, create `components/ui/breadcrumb.tsx` following the shadcn/radix-vega pattern, and update `AppHeader`.

## Metadata
- **Complexity**: Small
- **Source PRD**: N/A
- **PRD Phase**: N/A
- **Estimated Files**: 4 modified + 1 created

---

## UX Design

### Before
```
┌──────────────────────────────────────────────┐
│  [≡]  Sản phẩm / Sản phẩm          [UserNav] │  ← duplicate segment on /products
│        OR                                     │
│  [≡]  Sản phẩm / Abc123-uuid        [UserNav] │  ← raw UUID shown, no label
└──────────────────────────────────────────────┘
```

### After
```
┌──────────────────────────────────────────────┐
│  [≡]  Trang chủ / Sản phẩm          [UserNav] │  ← correct, no duplicate
│        OR                                      │
│  [≡]  Trang chủ / Sản phẩm / Chi tiết [UserNav]│  ← UUID matched, label shown
│        OR                                      │
│  [≡]  Trang chủ / Sản phẩm / Chỉnh sửa [UserNav]│ ← edit route matched correctly
└──────────────────────────────────────────────┘
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| `/products` | "Sản phẩm / Sản phẩm" | "Trang chủ / Sản phẩm" | Loop off-by-one fixed |
| `/products/:uuid` | Shows raw UUID | "Sản phẩm / Chi tiết" | New route + UUID detection |
| `/products/:uuid/edit` | UUID not matched → fallback label | "Sản phẩm / Chỉnh sửa" | Generalised ID detection |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `apps/admin/src/lib/routes.ts` | all | Contains buggy `getBreadcrumbs` + ROUTES |
| P0 | `apps/admin/src/components/app-header.tsx` | all | Wires breadcrumb; needs import swap |
| P0 | `apps/admin/src/components/ui/separator.tsx` | all | Pattern for new shadcn ui component |
| P0 | `apps/admin/src/components/ui/button.tsx` | all | Pattern: uses `Slot` from `radix-ui`, `cn` |
| P1 | `apps/admin/src/components/atoms/breadcrumb.tsx` | all | Component being replaced |
| P1 | `apps/admin/src/components/atoms/index.ts` | all | Barrel — remove re-export after replacement |

## External Documentation
| Topic | Source | Key Takeaway |
|---|---|---|
| shadcn breadcrumb API | https://ui.shadcn.com/docs/components/breadcrumb | Sub-components: Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator |

---

## Patterns to Mirror

### SHADCN_UI_COMPONENT
```tsx
// SOURCE: apps/admin/src/components/ui/separator.tsx:1-27
'use client';

import { cn } from '@admin/lib/utils';
import { SomePrimitive } from 'radix-ui';
import * as React from 'react';

function ComponentName({ className, ...props }: React.ComponentProps<'element'>) {
  return (
    <element
      data-slot="component-name"
      className={cn('...base classes...', className)}
      {...props}
    />
  );
}

export { ComponentName };
```
Rules:
- `'use client'` at top
- Named function (not arrow)
- `data-slot` attribute on root element
- Uses `cn()` from `@admin/lib/utils`
- Named export at bottom

### SHADCN_UI_WITH_SLOT
```tsx
// SOURCE: apps/admin/src/components/ui/button.tsx:1-5, 43-54
import { Slot } from 'radix-ui';

function Button({ asChild = false, ...props }) {
  const Comp = asChild ? Slot.Root : 'button';
  return <Comp data-slot="button" className={cn(...)} {...props} />;
}
```
- Use `Slot.Root` from `radix-ui` (NOT `@radix-ui/react-slot`)

### ROUTE_PATTERN
```ts
// SOURCE: apps/admin/src/lib/routes.ts:15-38
export const ROUTES: RouteConfig[] = [
  { path: '/', label: 'Trang chủ', icon: Home, permissions: [] },
  { path: '/products', label: 'Sản phẩm', icon: Package, permissions: [...] },
  { path: '/products/create', label: 'Tạo mới', permissions: [...] },
  { path: '/products/:id', label: 'Chi tiết', permissions: [...] },    // NEW
  { path: '/products/:id/edit', label: 'Chỉnh sửa', permissions: [...] },
  { path: '/categories', label: 'Danh mục', icon: FolderTree, permissions: [...] },
];
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `apps/admin/src/components/ui/breadcrumb.tsx` | CREATE | shadcn Breadcrumb primitive following codebase pattern |
| `apps/admin/src/lib/routes.ts` | UPDATE | Fix loop off-by-one, fix UUID detection, add `/products/:id` route, remove console.logs |
| `apps/admin/src/components/app-header.tsx` | UPDATE | Use shadcn breadcrumb sub-components, remove console.log |
| `apps/admin/src/components/atoms/breadcrumb.tsx` | DELETE | Replaced by `components/ui/breadcrumb.tsx` |
| `apps/admin/src/components/atoms/index.ts` | UPDATE | Remove `export * from './breadcrumb'` |

## NOT Building
- Breadcrumb truncation / ellipsis for deeply nested paths
- Animated transitions between breadcrumb states
- Any change to sidebar or route permissions logic
- Unit tests (no test infrastructure for UI components in this project)

---

## Step-by-Step Tasks

### Task 1: Create `components/ui/breadcrumb.tsx` (shadcn pattern)
- **ACTION**: Create new file `apps/admin/src/components/ui/breadcrumb.tsx`
- **IMPLEMENT**:

```tsx
'use client';

import { cn } from '@admin/lib/utils';
import { ChevronRight } from 'lucide-react';
import { Slot } from 'radix-ui';
import * as React from 'react';

function Breadcrumb({ ...props }: React.ComponentProps<'nav'>) {
  return <nav data-slot="breadcrumb" aria-label="breadcrumb" {...props} />;
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<'ol'>) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        'flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground sm:gap-2.5',
        className,
      )}
      {...props}
    />
  );
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn('inline-flex items-center gap-1.5', className)}
      {...props}
    />
  );
}

function BreadcrumbLink({
  asChild,
  className,
  ...props
}: React.ComponentProps<'a'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'a';
  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn('hover:text-foreground transition-colors', className)}
      {...props}
    />
  );
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn('text-foreground font-medium', className)}
      {...props}
    />
  );
}

function BreadcrumbSeparator({ children, className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn('[&>svg]:size-3.5', className)}
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  );
}

export {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
};
```

- **MIRROR**: SHADCN_UI_WITH_SLOT
- **IMPORTS**: `cn` from `@admin/lib/utils`, `Slot` from `radix-ui`, `ChevronRight` from `lucide-react`
- **GOTCHA**: `Slot.Root` (not `Slot` directly) — mirrors exact usage in `button.tsx:53`
- **VALIDATE**: File exists; no TypeScript errors from imports

### Task 2: Fix `getBreadcrumbs` in `src/lib/routes.ts`
- **ACTION**: Fix three bugs + add missing route for `/products/:id`
- **IMPLEMENT**:

```ts
import { Permission } from '@lam-thinh-ecommerce/shared';
import { FolderTree, Home, Package } from 'lucide-react';

export interface RouteConfig {
  path: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  permissions: Permission[];
}

export const ROUTES: RouteConfig[] = [
  { path: '/', label: 'Trang chủ', icon: Home, permissions: [] },
  {
    path: '/products',
    label: 'Sản phẩm',
    icon: Package,
    permissions: [Permission.READ_PRODUCTS],
  },
  {
    path: '/products/create',
    label: 'Tạo mới',
    permissions: [Permission.CREATE_PRODUCT],
  },
  {
    path: '/products/:id',
    label: 'Chi tiết',
    permissions: [Permission.READ_PRODUCTS],
  },
  {
    path: '/products/:id/edit',
    label: 'Chỉnh sửa',
    permissions: [Permission.UPDATE_PRODUCT],
  },
  {
    path: '/categories',
    label: 'Danh mục',
    icon: FolderTree,
    permissions: [Permission.READ_CATEGORIES],
  },
];

/**
 * Match a route path pattern against an actual path.
 * Supports :param tokens (matches any non-empty segment).
 */
function matchRoute(routePath: string, actualPath: string): boolean {
  const routeSegments = routePath.split('/').filter(Boolean);
  const actualSegments = actualPath.split('/').filter(Boolean);
  if (routeSegments.length !== actualSegments.length) return false;
  return routeSegments.every(
    (seg, i) => seg.startsWith(':') || seg === actualSegments[i],
  );
}

/**
 * Get breadcrumb items for a given pathname.
 * Builds a hierarchy from root to current path.
 */
export function getBreadcrumbs(pathname: string): Array<{
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}> {
  const breadcrumbs: Array<{
    label: string;
    href?: string;
    icon?: React.ComponentType<{ className?: string }>;
  }> = [{ label: ROUTES[0].label, href: '/', icon: ROUTES[0].icon }];

  const segments = pathname.split('/').filter(Boolean);
  let currentPath = '';

  for (let i = 0; i < segments.length; i++) {
    currentPath += `/${segments[i]}`;

    // Exact match first
    let route = ROUTES.find((r) => r.path === currentPath);

    // Pattern match (handles :id tokens)
    if (!route) {
      route = ROUTES.find((r) => r.path !== '/' && matchRoute(r.path, currentPath));
    }

    if (route) {
      breadcrumbs.push({ label: route.label, href: currentPath, icon: route.icon });
    } else {
      breadcrumbs.push({
        label: segments[i].charAt(0).toUpperCase() + segments[i].slice(1),
        href: currentPath,
      });
    }
  }

  return breadcrumbs;
}
```

- **MIRROR**: ROUTE_PATTERN
- **GOTCHA**: `/products/create` must be listed BEFORE `/products/:id` in ROUTES so exact match wins over pattern match.
- **VALIDATE**: Trace manually for all four key routes (see Acceptance Criteria)

### Task 3: Update `AppHeader` to use shadcn Breadcrumb
- **ACTION**: Replace atom `Breadcrumb` import with shadcn sub-components; remove `console.log`
- **IMPLEMENT**:

```tsx
'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@admin/components/ui/breadcrumb';
import { SidebarTrigger } from '@admin/components/ui/sidebar';
import { getBreadcrumbs } from '@admin/lib/routes';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { UserNav } from './user-nav';

export function AppHeader() {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <header className="bg-background sticky top-0 z-10 flex h-auto min-h-14 flex-col items-center justify-between gap-2 border-b px-4 py-2 sm:flex-row sm:py-0">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <BreadcrumbItem key={item.href ?? item.label}>
                  {!isLast ? (
                    <>
                      <BreadcrumbLink asChild>
                        <Link href={item.href ?? '#'} className="flex items-center gap-1">
                          {item.icon && <item.icon className="size-4" />}
                          {item.label}
                        </Link>
                      </BreadcrumbLink>
                      <BreadcrumbSeparator />
                    </>
                  ) : (
                    <BreadcrumbPage className="flex items-center gap-1">
                      {item.icon && <item.icon className="size-4" />}
                      {item.label}
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-3">
        <UserNav />
      </div>
    </header>
  );
}
```

- **MIRROR**: SHADCN_UI_COMPONENT
- **GOTCHA**: `BreadcrumbSeparator` is a sibling of `BreadcrumbLink` inside the same `BreadcrumbItem`, wrapped in a fragment — not a standalone `BreadcrumbItem`.
- **VALIDATE**: No TypeScript errors; breadcrumb renders without duplicates at `/products`

### Task 4: Remove `atoms/breadcrumb.tsx` and clean barrel
- **ACTION**: Verify no other consumers, then delete file and update barrel
- **IMPLEMENT**:
  1. Run: `grep -r "from '@admin/components/atoms'" apps/admin/src --include="*.tsx" --include="*.ts"` — confirm only `app-header.tsx` (now updated) imported `Breadcrumb` from atoms.
  2. Delete `apps/admin/src/components/atoms/breadcrumb.tsx`
  3. In `apps/admin/src/components/atoms/index.ts`, remove line: `export * from './breadcrumb';`
- **GOTCHA**: Do NOT delete the file before verifying the grep returns no remaining consumers.
- **VALIDATE**: `pnpm build:admin` succeeds with no import errors.

---

## Validation Commands

### Static Analysis
```bash
cd apps/admin && pnpm tsc --noEmit
```
EXPECT: Zero type errors

### Lint + Format
```bash
pnpm check
```
EXPECT: No lint errors, formatting applied

### Browser Validation
```bash
pnpm dev:admin
```
EXPECT:
- `/products` → "Trang chủ > Sản phẩm" (no duplicate)
- `/products/<uuid>` → "Trang chủ > Sản phẩm > Chi tiết"
- `/products/<uuid>/edit` → "Trang chủ > Sản phẩm > Chỉnh sửa"
- `/categories` → "Trang chủ > Danh mục"

### Manual Validation
- [ ] No `console.log` output in browser console when navigating
- [ ] Breadcrumb links (non-last items) are clickable and navigate correctly
- [ ] Last breadcrumb item is not a link (rendered as `<span>`)
- [ ] Icons render on "Trang chủ", "Sản phẩm", "Danh mục" items
- [ ] ChevronRight separator appears between items

---

## Acceptance Criteria
- [ ] `components/ui/breadcrumb.tsx` created following shadcn/radix-vega pattern
- [ ] No duplicate breadcrumb items on any route
- [ ] UUID-based dynamic routes (`/products/:id`, `/products/:id/edit`) resolve to correct labels
- [ ] `AppHeader` no longer imports from `@admin/components/atoms`
- [ ] `atoms/breadcrumb.tsx` deleted; barrel updated
- [ ] No `console.log` statements remain in header or routes
- [ ] Zero TypeScript errors
- [ ] Zero lint errors

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Other files import `Breadcrumb` from `atoms` | Low | Build error | Grep before deleting (Task 4 step 1) |
| `/products/create` matched as `:id` instead of exact | Medium | Wrong label | ROUTES order: `create` must appear before `:id` |
| `Slot.Root` API differs | Low | Runtime error | Mirror exactly from `button.tsx:53` |

## Notes
- `radix-ui` is the unified Radix distribution — import `Slot` from it, use `Slot.Root` as the component. Do NOT use `@radix-ui/react-slot`.
- shadcn breadcrumb has no dedicated Radix primitive; it is built from plain HTML + Slot.
- `BreadcrumbSeparator` defaults to `ChevronRight` from `lucide-react`, matching `components.json`'s `iconLibrary: "lucide"`.
- The `ROUTES` array order matters: more-specific paths (`/products/create`) must precede pattern paths (`/products/:id`).
