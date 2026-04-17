# Plan: Product Table Select Box + Edit Product Page

## Summary

Add row-selection (checkbox) with bulk-delete to the products table, and implement a full edit product page at `/products/[id]/edit` that pre-populates all existing product fields. Both features follow the exact patterns already established by the category module.

## User Story

As an admin, I want to select multiple products for bulk deletion and edit individual products, so that I can manage the product catalogue efficiently.

## Problem → Solution

- Products table has no selection/bulk-delete capability → add checkbox column + bulk-delete bar + dialog (mirrors category table)
- Edit button in product table is a TODO stub → implement `/products/[id]/edit` page with pre-populated form using `PATCH /products/:id`

## Metadata

- **Complexity**: Medium
- **Source PRD**: N/A
- **PRD Phase**: N/A
- **Estimated Files**: 9

---

## UX Design

### Before

```
┌─────────────────────────────────────────────┐
│ Products table                              │
│ [name] [price] [stock] [status] [edit btn] │
│  (edit btn = no-op TODO)                   │
└─────────────────────────────────────────────┘
```

### After

```
┌─────────────────────────────────────────────┐
│ Products table                              │
│ [☐] [name] [price] [stock] [status] [edit]  │
│                                             │
│ ── when rows selected ──────────────────── │
│ Đã chọn 3 sản phẩm        [🗑 Xóa đã chọn] │
│ ─────────────────────────────────────────── │
│                                             │
│ Edit btn → /products/[id]/edit              │
│ (same layout as create, pre-filled)         │
└─────────────────────────────────────────────┘
```

### Interaction Changes

| Touchpoint   | Before        | After                                 | Notes                    |
| ------------ | ------------- | ------------------------------------- | ------------------------ |
| Product row  | No checkbox   | Checkbox in first column              | All rows selectable      |
| Table header | No select-all | Checkbox (all/indeterminate)          | Mirrors category pattern |
| Bulk bar     | Missing       | Appears above card when rows selected | Destructive style        |
| Edit button  | No-op         | Navigates to `/products/[id]/edit`    | Full page, not sheet     |
| Edit page    | 404           | Full form pre-populated               | Same layout as create    |

---

## Mandatory Reading

| Priority | File                                                              | Lines  | Why                                              |
| -------- | ----------------------------------------------------------------- | ------ | ------------------------------------------------ |
| P0       | `src/modules/category/components/category-columns.tsx`            | 1-72   | Exact checkbox column pattern to mirror          |
| P0       | `src/modules/category/components/category-table.tsx`              | 36-158 | Bulk-delete bar + RowSelectionState pattern      |
| P0       | `src/modules/category/components/bulk-delete-category-dialog.tsx` | all    | ConfirmDialog usage pattern                      |
| P0       | `src/modules/product/pages/create-product-page.tsx`               | all    | Form layout to mirror for edit page              |
| P0       | `src/modules/product/actions/create-product.action.ts`            | all    | Server action pattern                            |
| P1       | `src/modules/product/components/product-columns.tsx`              | all    | Current columns — where to add select column     |
| P1       | `src/modules/product/components/product-table.tsx`                | all    | Current table — where to add rowSelection state  |
| P1       | `src/modules/product/pages/product-page.tsx`                      | all    | handleEdit stub — fix to navigate                |
| P1       | `src/app/(authenticated)/products/page.tsx`                       | all    | Server route pattern to replicate for edit route |
| P2       | `src/lib/constants.ts`                                            | all    | API_ENDPOINTS                                    |

## External Documentation

| Topic | Source | Key Takeaway                                    |
| ----- | ------ | ----------------------------------------------- |
| N/A   | —      | Feature uses established internal patterns only |

---

## Patterns to Mirror

### CHECKBOX_COLUMN

```typescript
// SOURCE: src/modules/category/components/category-columns.tsx:29-72
{
  id: 'select',
  header: ({ table }) => {
    const { canDelete } = table.options.meta as ProductColumnMeta;
    if (!canDelete) return null;
    return (
      <Checkbox
        checked={
          table.getIsAllRowsSelected()
            ? true
            : table.getIsSomeRowsSelected()
              ? 'indeterminate'
              : false
        }
        onCheckedChange={(checked) =>
          table.toggleAllRowsSelected(checked === true)
        }
        aria-label="Chọn tất cả"
      />
    );
  },
  cell: ({ row, table }) => {
    const { canDelete } = table.options.meta as ProductColumnMeta;
    if (!canDelete) return null;
    return (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => row.toggleSelected(checked === true)}
        aria-label="Chọn hàng"
      />
    );
  },
  enableSorting: false,
  enableHiding: false,
}
```

### ROW_SELECTION_TABLE_STATE

```typescript
// SOURCE: src/modules/category/components/category-table.tsx:46-64
const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

const table = useReactTable({
  data: data.items,
  columns: productColumns,
  getCoreRowModel: getCoreRowModel(),
  onRowSelectionChange: setRowSelection,
  state: { rowSelection },
  meta,
});

const selectedIds = table
  .getSelectedRowModel()
  .flatRows.map((r) => r.original.id);
```

### BULK_DELETE_BAR

```typescript
// SOURCE: src/modules/category/components/category-table.tsx:90-108
{canDelete && selectedIds.length > 0 && (
  <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2">
    <span className="text-sm text-muted-foreground">
      Đã chọn{' '}
      <span className="font-medium text-foreground">
        {selectedIds.length}
      </span>{' '}
      sản phẩm
    </span>
    <Button
      size="sm"
      variant="destructive"
      onClick={() => setBulkDialogOpen(true)}
    >
      <Trash2 data-icon="inline-start" />
      Xóa đã chọn
    </Button>
  </div>
)}
```

### BULK_DELETE_DIALOG

```typescript
// SOURCE: src/modules/category/components/bulk-delete-category-dialog.tsx:all
<ConfirmDialog
  open={open}
  onOpenChange={onOpenChange}
  title="Xóa sản phẩm đã chọn"
  description={<>...</>}
  confirmLabel={`Xóa ${selectedIds.length} sản phẩm`}
  errorTitle="Xóa sản phẩm thất bại"
  onConfirm={() => bulkDeleteProductAction(selectedIds)}
  onSuccess={onSuccess}
/>
```

### SERVER_ACTION

```typescript
// SOURCE: src/modules/product/actions/create-product.action.ts:all
'use server';
import { apis } from '@admin/lib/api';
import { API_ENDPOINTS } from '@admin/lib/constants';
import { revalidatePath } from 'next/cache';

export async function updateProductAction(id: string, data: ProductSchema) {
  const result = await apis.patch<Product, object>(
    `${API_ENDPOINTS.PRODUCTS.BASE}/${id}`,
    {
      data: {
        /* fields */
      },
    },
  );
  if (result.success) {
    revalidatePath('/products');
    revalidatePath(`/products/${id}/edit`);
  }
  return result;
}
```

### EDIT_PAGE_ROUTE

```typescript
// SOURCE: src/app/(authenticated)/products/page.tsx (server component pattern)
// Edit route: src/app/(authenticated)/products/[id]/edit/page.tsx
export default async function EditProductRoute({ params }) {
  const { id } = await params;
  const [productResult, categoriesResult] = await Promise.all([
    apis.get<Product>(`${API_ENDPOINTS.PRODUCTS.BASE}/${id}`),
    apis.get<Category[]>(API_ENDPOINTS.CATEGORIES.BASE),
  ]);
  // handle not found -> redirect('/products')
  return <EditProductPage product={product} categories={flatCategories} />;
}
```

### FORM_CONTROLLER

```typescript
// SOURCE: src/modules/product/pages/create-product-page.tsx:136-156
<Controller
  name="name"
  control={control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor={field.name}>
        Tên sản phẩm <span className="text-destructive">*</span>
      </FieldLabel>
      <Input {...field} id={field.name} disabled={isBusy} />
      {fieldState.error && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

---

## Files to Change

| File                                                            | Action | Justification                                                     |
| --------------------------------------------------------------- | ------ | ----------------------------------------------------------------- |
| `src/modules/product/components/product-columns.tsx`            | UPDATE | Add `select` column as first column                               |
| `src/modules/product/components/product-table.tsx`              | UPDATE | Add RowSelectionState, bulk-delete bar, BulkDeleteProductDialog   |
| `src/modules/product/components/bulk-delete-product-dialog.tsx` | CREATE | ConfirmDialog wrapper for bulk product delete                     |
| `src/modules/product/actions/bulk-delete-product.action.ts`     | CREATE | Server action calling `DELETE /products/bulk`                     |
| `src/modules/product/actions/update-product.action.ts`          | CREATE | Server action calling `PATCH /products/:id`                       |
| `src/modules/product/actions/index.ts`                          | UPDATE | Re-export new actions                                             |
| `src/modules/product/pages/edit-product-page.tsx`               | CREATE | Client page component — same layout as create, pre-populated      |
| `src/app/(authenticated)/products/[id]/edit/page.tsx`           | CREATE | Server route — fetch product + categories, render EditProductPage |
| `src/modules/product/pages/product-page.tsx`                    | UPDATE | Fix `handleEdit` to navigate to `/products/${product.id}/edit`    |
| `src/modules/product/index.ts`                                  | UPDATE | Export EditProductPage                                            |

## NOT Building

- Single-product delete from the table row (only bulk delete)
- Rich-text editor for description field
- Image reordering on edit page
- Slug editing (auto-generated by backend)

---

## Step-by-Step Tasks

### Task 1: Add checkbox column to product-columns.tsx

- **ACTION**: Prepend a `select` column before the `product` column
- **IMPLEMENT**: Copy pattern from `category-columns.tsx:29-72`. No `disabled` condition — all products are selectable. `canDelete` already exists on `ProductColumnMeta`.
- **MIRROR**: CHECKBOX_COLUMN
- **IMPORTS**: Add `Checkbox` from `@admin/components/ui/checkbox`
- **GOTCHA**: `ProductColumnMeta` already has `canDelete` — just use it in the select column header/cell guards
- **VALIDATE**: TypeScript compiles; checkbox appears in table

### Task 2: Add row selection state to product-table.tsx

- **ACTION**: Add `RowSelectionState`, bulk-delete bar, and `BulkDeleteProductDialog`
- **IMPLEMENT**:
  1. `const [rowSelection, setRowSelection] = useState<RowSelectionState>({})`
  2. `const [bulkDialogOpen, setBulkDialogOpen] = useState(false)`
  3. Add `onRowSelectionChange`, `state: { rowSelection }` to `useReactTable`
  4. Derive `selectedIds` from `table.getSelectedRowModel().flatRows`
  5. Render bulk-delete bar above `<Card>` and `<BulkDeleteProductDialog>`
  6. Add `data-state={row.getIsSelected() ? 'selected' : undefined}` to `<TableRow>`
- **MIRROR**: ROW_SELECTION_TABLE_STATE, BULK_DELETE_BAR
- **IMPORTS**: `RowSelectionState` from `@tanstack/react-table`; `Trash2` from `lucide-react`; `BulkDeleteProductDialog`
- **VALIDATE**: Selecting rows shows count bar; clicking button opens dialog

### Task 3: Create bulk-delete-product-dialog.tsx

- **ACTION**: Create `src/modules/product/components/bulk-delete-product-dialog.tsx`
- **IMPLEMENT**: Mirror `bulk-delete-category-dialog.tsx` exactly, replace "danh mục" with "sản phẩm"
- **MIRROR**: BULK_DELETE_DIALOG
- **IMPORTS**: `ConfirmDialog` from `@admin/components/modules/confirm-dialog`; `bulkDeleteProductAction`
- **VALIDATE**: Dialog shows correct count, calls action, clears selection on success

### Task 4: Create bulk-delete-product.action.ts

- **ACTION**: Create `src/modules/product/actions/bulk-delete-product.action.ts`
- **IMPLEMENT**:

  ```typescript
  'use server';
  import { apis } from '@admin/lib/api';
  import { API_ENDPOINTS } from '@admin/lib/constants';
  import { revalidatePath } from 'next/cache';

  export async function bulkDeleteProductAction(ids: string[]) {
    const result = await apis.delete<void>(
      `${API_ENDPOINTS.PRODUCTS.BASE}/bulk`,
      { data: { ids } },
    );
    if (result.success) {
      revalidatePath('/products');
    }
    return result;
  }
  ```

- **MIRROR**: SERVER_ACTION
- **GOTCHA**: Verify `DELETE /products/bulk` exists in the NestJS controller; if missing, implement it in `apps/api` first
- **VALIDATE**: Action compiles; product list refreshes after deletion

### Task 5: Create update-product.action.ts

- **ACTION**: Create `src/modules/product/actions/update-product.action.ts`
- **IMPLEMENT**:

  ```typescript
  'use server';
  import { apis } from '@admin/lib/api';
  import { API_ENDPOINTS } from '@admin/lib/constants';
  import { revalidatePath } from 'next/cache';
  import { ProductSchema } from '../schemas/product.schema';
  import { Product } from '../types/product.type';

  export async function updateProductAction(id: string, data: ProductSchema) {
    const result = await apis.patch<Product, object>(
      `${API_ENDPOINTS.PRODUCTS.BASE}/${id}`,
      {
        data: {
          name: data.name,
          sku: data.sku,
          price: data.price,
          compareAtPrice: data.compareAtPrice ?? null,
          stock: data.stock ?? 0,
          status: data.status,
          categoryId: data.categoryId,
          shortDescription: data.shortDescription || undefined,
          description: data.description || undefined,
          imageIds: data.imageIds ?? [],
        },
      },
    );
    if (result.success) {
      revalidatePath('/products');
      revalidatePath(`/products/${id}/edit`);
    }
    return result;
  }
  ```

- **GOTCHA**: `imageIds` sends only NEW temp upload IDs. Existing images on the product are not re-submitted unless the backend merges them. Confirm API PATCH contract.
- **VALIDATE**: TypeScript compiles with no errors

### Task 6: Update actions/index.ts

- **ACTION**: Export the two new actions
- **IMPLEMENT**: Add `export * from './bulk-delete-product.action';` and `export * from './update-product.action';`
- **VALIDATE**: Both importable via module barrel

### Task 7: Create edit-product-page.tsx

- **ACTION**: Create `src/modules/product/pages/edit-product-page.tsx`
- **IMPLEMENT**: Mirror `create-product-page.tsx` exactly:
  - Same grid layout, same Card sections
  - Page header: "Sửa sản phẩm"; button label: "Lưu thay đổi"
  - `defaultValues` populated from `product` prop
  - `onSubmit` calls `updateProductAction(product.id, data)` then `router.push('/products')`
  - `handleCancel` cancels any new temp uploads and navigates back
  - `FORM_ID = 'edit-product-form'`
  - `defaultValues.imageIds = []` (empty — do not pre-fill with existing image IDs)
- **GOTCHA**: Keep `// @ts-expect-error zodResolver generic mismatch` comment. `compareAtPrice` default: `product.compareAtPrice ?? null`
- **VALIDATE**: Form renders with correct pre-filled values

### Task 8: Create edit route page.tsx

- **ACTION**: Create `src/app/(authenticated)/products/[id]/edit/page.tsx`
- **IMPLEMENT**:

  ```typescript
  import { apis } from '@admin/lib/api';
  import { API_ENDPOINTS } from '@admin/lib/constants';
  import { Category, flattenCategories } from '@admin/modules/category/types/category.type';
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
    const categories = categoriesResult.success && categoriesResult.data
      ? categoriesResult.data : [];
    return (
      <EditProductPage
        product={productResult.data}
        categories={flattenCategories(categories)}
      />
    );
  }
  ```

- **MIRROR**: EDIT_PAGE_ROUTE
- **GOTCHA**: `params` is a Promise in Next.js 16 — must `await params` before destructuring
- **VALIDATE**: Valid ID renders form; invalid ID redirects to `/products`

### Task 9: Fix handleEdit and update module barrel

- **ACTION**: Fix `handleEdit` stub in `product-page.tsx`; export `EditProductPage` from `index.ts`
- **IMPLEMENT**:
  1. `product-page.tsx`: `function handleEdit(product: Product) { router.push(\`/products/${product.id}/edit\`); }`
  2. `src/modules/product/index.ts`: add `export { EditProductPage } from './pages/edit-product-page';`
- **VALIDATE**: Edit icon navigates to edit page

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

EXPECT: No lint errors

### Build

```bash
pnpm build:admin
```

EXPECT: Build succeeds

### Browser Validation

```bash
pnpm dev:admin
```

EXPECT: Feature works at http://localhost:3000/products

---

## Acceptance Criteria

- [ ] Checkbox column in products table (guarded by `canDelete`)
- [ ] Bulk-delete bar appears when rows selected
- [ ] Bulk-delete dialog confirms and deletes; row selection clears on success
- [ ] Edit button navigates to `/products/[id]/edit`
- [ ] Edit page renders with all fields pre-populated
- [ ] Edit form validates and submits via `updateProductAction`
- [ ] No type errors; no lint errors

## Risks

| Risk                                                  | Likelihood | Impact                  | Mitigation                                                             |
| ----------------------------------------------------- | ---------- | ----------------------- | ---------------------------------------------------------------------- |
| `DELETE /products/bulk` endpoint missing in API       | Medium     | Blocker for bulk delete | Check `apps/api/src/modules/product/` controller; implement if missing |
| `PATCH /products/:id` expects different image payload | Medium     | Silent data loss        | Confirm API PATCH handler image merging behavior                       |
| `flattenCategories` not exported from category types  | Low        | TypeScript error        | Verify export in `src/modules/category/types/category.type.ts`         |

## Notes

- Edit page uses a full dedicated page (not a Sheet) — products have too many fields.
- `imageIds` in the edit form = new temp uploads only. Existing `product.images` are for display context only and not re-submitted.
