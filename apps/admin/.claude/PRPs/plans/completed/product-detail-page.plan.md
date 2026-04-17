# Plan: Product Detail Page

## Summary

Add a read-only product detail page at `/products/[id]` that displays all product information — basic info, images, status, category, pricing, and inventory — without an edit form. A user navigates here from the product list and can click through to the edit page if they have the `UPDATE_PRODUCT` permission.

## User Story

As an admin user, I want to view a product's full details in a read-only page, so that I can review all information before deciding whether to edit it.

## Problem → Solution

Currently clicking a product in the list navigates directly to `/products/{id}/edit`. There is no dedicated view-only page — users have to go into the edit form just to read information. → Add `/products/{id}` as a dedicated read-only detail view; the edit page remains unchanged.

## Metadata

- **Complexity**: Medium
- **Source PRD**: N/A
- **PRD Phase**: N/A
- **Estimated Files**: 5 (2 new, 3 updated)

---

## UX Design

### Before

```
┌─────────────────────────────────────┐
│  Products list                      │
│  [row] Product A  [Sửa button]      │
│          ↓ (click Sửa)              │
│  /products/{id}/edit  (full form)   │
└─────────────────────────────────────┘
```

### After

```
┌─────────────────────────────────────────────────┐
│  Products list                                  │
│  [row] Product A  [Sửa button]                  │
│          ↓ (click row name)                     │
│  /products/{id}  (read-only detail page)        │
│  ← Back  |  "Chi tiết sản phẩm"  |  [Sửa] btn  │
│  ┌── Thông tin cơ bản ──┐  ┌── Trạng thái ──┐  │
│  │ Tên, SKU, Mô tả      │  │ Badge          │  │
│  └──────────────────────┘  └────────────────┘  │
│  ┌── Hình ảnh ───────────┐  ┌── Danh mục ───┐  │
│  │ Image thumbnails grid │  │ Category name │  │
│  └──────────────────────┘  └────────────────┘  │
│                             ┌── Giá ─────────┐  │
│                             │ Price / Compare│  │
│                             └────────────────┘  │
│                             ┌── Tồn kho ─────┐  │
│                             │ Stock count    │  │
│                             └────────────────┘  │
│                             ┌── Thời gian ───┐  │
│                             │ Created/Updated│  │
│                             └────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Interaction Changes

| Touchpoint           | Before          | After                             | Notes                                              |
| -------------------- | --------------- | --------------------------------- | -------------------------------------------------- |
| Product name in list | Not clickable   | Links to `/products/{id}`         | Add `Link` wrapper to product name cell in columns |
| Detail page header   | N/A             | Back button + title + Edit button | Edit button gated by `UPDATE_PRODUCT` permission   |
| All fields           | Editable inputs | Read-only `<p>` display           | No form, no submit                                 |
| Images               | Upload widget   | Static image grid                 | Just display existing images                       |

---

## Mandatory Reading

| Priority | File                                                                | Lines | Why                                                |
| -------- | ------------------------------------------------------------------- | ----- | -------------------------------------------------- |
| P0       | `apps/admin/src/app/(authenticated)/products/[id]/edit/page.tsx`    | 1-40  | Exact pattern to mirror for the new route          |
| P0       | `apps/admin/src/modules/product/pages/edit-product-page.tsx`        | 1-422 | Layout structure, Card sections, imports to reuse  |
| P0       | `apps/admin/src/app/(authenticated)/products/[id]/edit/loading.tsx` | 1-75  | Skeleton pattern to replicate                      |
| P1       | `apps/admin/src/modules/product/types/product.type.ts`              | 1-56  | `Product`, `ProductImage`, `PRODUCT_STATUS_CONFIG` |
| P1       | `apps/admin/src/modules/product/pages/index.ts`                     | 1-3   | Barrel to update with new export                   |
| P1       | `apps/admin/src/modules/product/components/product-columns.tsx`     | all   | Where to add the clickable name link               |
| P2       | `apps/admin/src/lib/constants.ts`                                   | all   | `API_ENDPOINTS`, `ROUTE_PERMISSIONS`               |

## External Documentation

| Topic                 | Source                         | Key Takeaway                                                           |
| --------------------- | ------------------------------ | ---------------------------------------------------------------------- |
| Next.js 16 App Router | `node_modules/next/dist/docs/` | Use `Promise<{ id: string }>` for params; no legacy getServerSideProps |

---

## Patterns to Mirror

### ROUTE_PAGE_PATTERN

```typescript
// SOURCE: apps/admin/src/app/(authenticated)/products/[id]/edit/page.tsx:1-40
import { apis } from '@admin/lib/api';
import { API_ENDPOINTS } from '@admin/lib/constants';
import {
  Category,
  flattenCategories,
} from '@admin/modules/category/types/category.type';
import { EditProductPage } from '@admin/modules/product';
import { Product } from '@admin/modules/product/types/product.type';
import { redirect } from 'next/navigation';

interface EditProductRouteProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductRoute({ params }: EditProductRouteProps) {
  const { id } = await params;

  const [productResult, categoriesResult] = await Promise.all([
    apis.get<Product>(`${API_ENDPOINTS.PRODUCTS.BASE}/${id}`),
    apis.get<Category[]>(API_ENDPOINTS.CATEGORIES.BASE),
  ]);

  if (!productResult.success || !productResult.data) {
    redirect('/products');
  }

  const categories =
    categoriesResult.success && categoriesResult.data
      ? categoriesResult.data
      : [];

  return (
    <EditProductPage
      product={productResult.data}
      categories={flattenCategories(categories)}
    />
  );
}
```

### PAGE_COMPONENT_SHELL

```typescript
// SOURCE: apps/admin/src/modules/product/pages/edit-product-page.tsx:1-43
'use client';

interface EditProductPageProps {
  product: Product;
  categories: FlatCategory[];
}

export function EditProductPage({ product, categories }: EditProductPageProps) {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-xs" type="button" onClick={...}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-xl font-semibold">Sửa sản phẩm</h1>
        </div>
        {/* action button */}
      </div>
      {/* content grid */}
    </div>
  );
}
```

### GRID_LAYOUT_PATTERN

```tsx
// SOURCE: apps/admin/src/modules/product/pages/edit-product-page.tsx:135-136
<div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-5">
  <div className="flex flex-col gap-4 lg:col-span-3">{/* Left */}</div>
  <div className="flex flex-col gap-4 lg:col-span-2">{/* Right */}</div>
</div>
```

### CARD_SECTION_PATTERN

```tsx
// SOURCE: apps/admin/src/modules/product/pages/edit-product-page.tsx:140-165
<Card>
  <CardHeader>
    <CardTitle>Thông tin cơ bản</CardTitle>
  </CardHeader>
  <CardContent className="flex flex-col gap-4">{/* fields */}</CardContent>
</Card>
```

### STATUS_BADGE_PATTERN

```tsx
// SOURCE: apps/admin/src/modules/product/types/product.type.ts:41-56
// PRODUCT_STATUS_CONFIG maps ProductStatus → { label, className }
const config = PRODUCT_STATUS_CONFIG[product.status];
<span
  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}
>
  {config.label}
</span>;
```

### LOADING_SKELETON_PATTERN

```tsx
// SOURCE: apps/admin/src/app/(authenticated)/products/[id]/edit/loading.tsx:1-75
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@admin/components/ui/card';
import { Skeleton } from '@admin/components/ui/skeleton';

export default function ProductEditLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded" />
          <Skeleton className="h-7 w-36" />
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-5">
        {/* skeleton cards matching left/right split */}
      </div>
    </div>
  );
}
```

### BARREL_EXPORT_PATTERN

```typescript
// SOURCE: apps/admin/src/modules/product/pages/index.ts:1-3
export * from './create-product-page';
export * from './edit-product-page';
export * from './product-page';
// Add: export * from './detail-product-page';
```

---

## Files to Change

| File                                                            | Action | Justification                                        |
| --------------------------------------------------------------- | ------ | ---------------------------------------------------- |
| `apps/admin/src/modules/product/pages/detail-product-page.tsx`  | CREATE | New read-only detail page component                  |
| `apps/admin/src/app/(authenticated)/products/[id]/page.tsx`     | CREATE | Route server component fetching product + categories |
| `apps/admin/src/app/(authenticated)/products/[id]/loading.tsx`  | CREATE | Loading skeleton for detail route                    |
| `apps/admin/src/modules/product/pages/index.ts`                 | UPDATE | Add barrel export for new page component             |
| `apps/admin/src/modules/product/components/product-columns.tsx` | UPDATE | Make product name a Link to detail page              |

## NOT Building

- Rich-text / HTML rendering for the `description` field (render as plain text)
- A lightbox / full-screen image viewer
- Delete button on the detail page
- Any API changes (no new endpoints needed)
- Breadcrumbs navigation

---

## Step-by-Step Tasks

### Task 1: Create `detail-product-page.tsx` client component

- **ACTION**: Create `apps/admin/src/modules/product/pages/detail-product-page.tsx`
- **IMPLEMENT**:
  - `'use client'` directive
  - Props: `{ product: Product; categories: FlatCategory[] }`
  - Use `useRouter()` for Back navigation (`router.push('/products')`)
  - Use `usePermission(Permission.UPDATE_PRODUCT)` to gate the Edit button
  - Same page header layout as `edit-product-page.tsx` (Back button + title + optional Edit button)
  - Same `grid grid-cols-1 lg:grid-cols-5` layout
  - **Left column (lg:col-span-3)**:
    - Card "Thông tin cơ bản": display Name, SKU, Short description, Full description as labeled field rows using `<FieldLabel>` + `<p>` pattern
    - Card "Hình ảnh": flex-wrap grid of `<img>` thumbnails (`className="size-24 rounded-lg object-cover"`), show `<p className="text-sm text-muted-foreground">Không có hình ảnh</p>` when `product.images` is empty
  - **Right sidebar (lg:col-span-2)**:
    - Card "Trạng thái": status badge using `PRODUCT_STATUS_CONFIG`
    - Card "Danh mục": look up `categories.find(c => c.id === product.categoryId)?.name ?? product.categoryId`
    - Card "Giá": display `formatVND(product.price)`; if `compareAtPrice` exists, show `formatVND(product.compareAtPrice)` with label "Giá gốc"
    - Card "Tồn kho": display `product.stock` with label "Số lượng"
    - Card "Thời gian": Created = `new Date(product.createdAt).toLocaleString('vi-VN')`, Updated = `new Date(product.updatedAt).toLocaleString('vi-VN')`
- **MIRROR**: `GRID_LAYOUT_PATTERN`, `CARD_SECTION_PATTERN`, `STATUS_BADGE_PATTERN`, `PAGE_COMPONENT_SHELL`
- **IMPORTS**:
  ```typescript
  'use client';
  import { Button } from '@admin/components/ui/button';
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from '@admin/components/ui/card';
  import { FieldLabel } from '@admin/components/ui/field';
  import { FlatCategory } from '@admin/modules/category/types/category.type';
  import { formatVND } from '@lam-thinh-ecommerce/shared';
  import { Permission } from '@lam-thinh-ecommerce/shared';
  import { ArrowLeft, Pencil } from 'lucide-react';
  import { useRouter } from 'next/navigation';
  import { PRODUCT_STATUS_CONFIG, Product } from '../types/product.type';
  ```
- **GOTCHA**: `formatVND` — verify the exact export by checking `packages/shared/src/index.ts`. If not found, use `new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)` as fallback.
- **GOTCHA**: `usePermission` hook — grep for `usePermission` to find the correct import path before writing the file.
- **VALIDATE**: Component renders without TypeScript errors; Edit button only appears when user has `UPDATE_PRODUCT` permission.

### Task 2: Create route page `products/[id]/page.tsx`

- **ACTION**: Create `apps/admin/src/app/(authenticated)/products/[id]/page.tsx`
- **IMPLEMENT**:

  ```typescript
  import { apis } from '@admin/lib/api';
  import { API_ENDPOINTS } from '@admin/lib/constants';
  import {
    Category,
    flattenCategories,
  } from '@admin/modules/category/types/category.type';
  import { DetailProductPage } from '@admin/modules/product';
  import { Product } from '@admin/modules/product/types/product.type';
  import { redirect } from 'next/navigation';

  interface ProductDetailRouteProps {
    params: Promise<{ id: string }>;
  }

  export default async function ProductDetailRoute({
    params,
  }: ProductDetailRouteProps) {
    const { id } = await params;

    const [productResult, categoriesResult] = await Promise.all([
      apis.get<Product>(`${API_ENDPOINTS.PRODUCTS.BASE}/${id}`),
      apis.get<Category[]>(API_ENDPOINTS.CATEGORIES.BASE),
    ]);

    if (!productResult.success || !productResult.data) {
      redirect('/products');
    }

    const categories =
      categoriesResult.success && categoriesResult.data
        ? categoriesResult.data
        : [];

    return (
      <DetailProductPage
        product={productResult.data}
        categories={flattenCategories(categories)}
      />
    );
  }
  ```

- **MIRROR**: `ROUTE_PAGE_PATTERN`
- **GOTCHA**: `params` must be awaited (`Promise<{ id: string }>`), not destructured directly. The existing edit page shows the correct pattern.
- **VALIDATE**: Navigate to `/products/{valid-uuid}` → renders detail page. Navigate to `/products/bad-id` → redirects to `/products`.

### Task 3: Create loading skeleton `products/[id]/loading.tsx`

- **ACTION**: Create `apps/admin/src/app/(authenticated)/products/[id]/loading.tsx`
- **IMPLEMENT**: Mirror `edit/loading.tsx` structure — same header, same 5-column grid. Adjust right sidebar: add an extra card for "Thời gian" (two skeleton rows). Remove the image-upload skeleton; use `<Skeleton className="h-24 w-full rounded-lg" />` instead.
- **MIRROR**: `LOADING_SKELETON_PATTERN`
- **IMPORTS**: `Card`, `CardContent`, `CardHeader`, `CardTitle` from `@admin/components/ui/card`; `Skeleton` from `@admin/components/ui/skeleton`
- **VALIDATE**: Skeleton renders without errors when route is loading.

### Task 4: Update barrel export `pages/index.ts`

- **ACTION**: Edit `apps/admin/src/modules/product/pages/index.ts`
- **IMPLEMENT**: Add `export * from './detail-product-page';` as the second line, after `create-product-page` and before `edit-product-page` (alphabetical order).
- **MIRROR**: `BARREL_EXPORT_PATTERN`
- **VALIDATE**: `import { DetailProductPage } from '@admin/modules/product'` resolves without error.

### Task 5: Add clickable product name in columns

- **ACTION**: Edit `apps/admin/src/modules/product/components/product-columns.tsx`
- **IMPLEMENT**: In the "Product" column cell renderer, wrap the product name text with `<Link href={`/products/${row.original.id}`} className="hover:underline">` from `next/link`.
- **IMPORTS**: `import Link from 'next/link';`
- **GOTCHA**: Do NOT touch the "Sửa" action button — it must still navigate to `/products/{id}/edit`. Only the name text gets the detail-page link.
- **VALIDATE**: Clicking a product name in the table navigates to `/products/{id}`; clicking "Sửa" still navigates to `/products/{id}/edit`.

---

## Testing Strategy

### Unit Tests

No new unit tests required — display-only component with no business logic.

### Manual Validation

- [ ] Navigate to product list `/products`
- [ ] Click a product name → lands on `/products/{uuid}` detail page
- [ ] All fields display correctly (name, SKU, descriptions, price, stock, status, category, dates)
- [ ] Image thumbnails render (or placeholder shown if no images)
- [ ] Click Back (←) button → returns to `/products`
- [ ] With `UPDATE_PRODUCT` permission: Edit button visible; click → navigates to `/products/{id}/edit`
- [ ] Without `UPDATE_PRODUCT` permission: Edit button NOT visible
- [ ] Navigate to `/products/nonexistent-uuid` → redirects to `/products`
- [ ] Loading skeleton shows on slow network (throttle in DevTools)

---

## Validation Commands

### Static Analysis

```bash
pnpm --filter @lam-thinh-ecommerce/admin build
```

EXPECT: Zero TypeScript / build errors

### Lint + Format

```bash
pnpm check
```

EXPECT: No lint errors, files formatted

### Dev Server

```bash
pnpm dev:admin
```

EXPECT: App starts on port 3000; navigate to `/products/{id}` and verify page renders

---

## Acceptance Criteria

- [ ] `/products/{id}` renders a read-only product detail page
- [ ] Product name in the list table links to the detail page
- [ ] Edit button on detail page is permission-gated (`UPDATE_PRODUCT`)
- [ ] Back button navigates to `/products`
- [ ] Loading skeleton displayed during data fetch
- [ ] Invalid product ID redirects to `/products`
- [ ] No TypeScript errors
- [ ] No lint errors

## Completion Checklist

- [ ] `detail-product-page.tsx` created following `edit-product-page.tsx` layout patterns
- [ ] `products/[id]/page.tsx` created following `products/[id]/edit/page.tsx` pattern
- [ ] `products/[id]/loading.tsx` created following `products/[id]/edit/loading.tsx` pattern
- [ ] Barrel export in `pages/index.ts` updated
- [ ] Product name column updated with `<Link>` in `product-columns.tsx`
- [ ] `formatVND` import verified before use
- [ ] `usePermission` import path verified before use

## Risks

| Risk                                                   | Likelihood | Impact | Mitigation                                                             |
| ------------------------------------------------------ | ---------- | ------ | ---------------------------------------------------------------------- |
| `formatVND` not exported from shared package           | Low        | Medium | Check `packages/shared/src/index.ts`; fall back to `Intl.NumberFormat` |
| `usePermission` hook import path differs               | Low        | Low    | Grep for `usePermission` before writing import                         |
| Route conflict `[id]/page.tsx` vs `[id]/edit/page.tsx` | None       | N/A    | Next.js App Router handles nested routes natively                      |
| Category name lookup fails if categories fetch fails   | Low        | Low    | Categories default to `[]`; show raw `categoryId` as fallback          |

## Notes

- `product-columns.tsx` change: only the **name text** is linkified, not the thumbnail or the entire row.
- The detail page does NOT use `react-hook-form` or Zod — plain HTML display elements only.
- `product.createdAt` / `updatedAt` are ISO strings from the API — parse with `new Date()` before formatting.
- Vietnamese locale strings: Back = "Quay lại", Edit = "Sửa", page title = "Chi tiết sản phẩm".
