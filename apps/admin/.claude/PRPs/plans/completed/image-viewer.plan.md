# Plan: Image Viewer Component

## Summary
Build a reusable `ImageViewer` modal that lets users view a full-size image with zoom-in / zoom-out controls. Apply it to the product detail page (image gallery thumbnails) and the multi-image upload field (preview thumbnails). No new npm dependency is needed — the feature uses the existing Radix UI `Dialog` primitive already available through the unified `radix-ui` package.

## User Story
As an admin user, I want to click any product image thumbnail and see it full-size with zoom controls, so that I can inspect image quality without leaving the page.

## Problem → Solution
Currently image thumbnails are `96×96 px` with no way to see the full image. → Clicking any thumbnail opens a modal overlay with the full-resolution image and ±25% zoom step controls (0.5× – 3×).

## Metadata
- **Complexity**: Medium
- **Source PRD**: N/A
- **PRD Phase**: N/A
- **Estimated Files**: 1 created, 2 updated

---

## UX Design

### Before
```
┌─────────────────────────────────────┐
│  Hình ảnh                           │
│  [96×96 thumb] [96×96 thumb] ...   │  ← click does nothing
└─────────────────────────────────────┘
```

### After
```
┌─────────────────────────────────────┐
│  Hình ảnh                           │
│  [96×96 thumb]* [96×96 thumb]* ... │  ← cursor:pointer, click opens viewer
└─────────────────────────────────────┘

   ┌── black overlay (80% opacity) ──────────────────────────────────┐
   │                                [X] close (top-right)            │
   │                                                                  │
   │                   ┌──────────────────────┐                      │
   │                   │  full-size image     │                      │
   │                   │  (max 90vw × 85vh)   │                      │
   │                   │  CSS scale(N)        │                      │
   │                   └──────────────────────┘                      │
   │                                                                  │
   │         [−]  [100%]  [+]  [↺]   ← zoom controls (bottom center) │
   └──────────────────────────────────────────────────────────────────┘
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Product detail — image thumbnail | Static image | `cursor-zoom-in`, click opens viewer | `detail-product-page.tsx` |
| Upload field — image thumbnail | Static + remove button only | Click opens viewer | `multi-image-upload-field.tsx` |
| Viewer — zoom in | N/A | Scale + 0.25 (max 3×) | Button disabled at 3× |
| Viewer — zoom out | N/A | Scale − 0.25 (min 0.5×) | Button disabled at 0.5× |
| Viewer — reset | N/A | Scale back to 1× | Label shows current % |
| Viewer — close | N/A | ESC key or ✕ button | Zoom resets on close |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `apps/admin/src/components/ui/alert-dialog.tsx` | all | Pattern for Radix Dialog usage from `radix-ui` |
| P0 | `apps/admin/src/components/modules/confirm-dialog.tsx` | all | Pattern for module-level dialog wrapper |
| P0 | `apps/admin/src/components/ui/button.tsx` | 1-10, 43-54 | `Slot.Root`, `cn`, `data-slot` pattern |
| P1 | `apps/admin/src/modules/product/pages/detail-product-page.tsx` | 103-128 | Image gallery block to update |
| P1 | `apps/admin/src/modules/upload/components/multi-image-upload-field.tsx` | 151-178 | Upload thumbnails block to update |
| P2 | `apps/admin/src/components/ui/separator.tsx` | all | Named function + `data-slot` pattern reference |

## External Documentation
| Topic | Source | Key Takeaway |
|---|---|---|
| Radix Dialog primitive | https://www.radix-ui.com/primitives/docs/components/dialog | `Dialog.Root`, `.Portal`, `.Overlay`, `.Content`, `.Close` — all from unified `radix-ui` package |

---

## Patterns to Mirror

### SHADCN_UI_DIALOG_PRIMITIVE
```tsx
// SOURCE: apps/admin/src/components/ui/alert-dialog.tsx:1-11
'use client';

import { cn } from '@admin/lib/utils';
import { AlertDialog as AlertDialogPrimitive } from 'radix-ui';
import * as React from 'react';

function AlertDialog({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}
```
- Import primitive group as a namespace from `radix-ui`: `import { Dialog } from 'radix-ui'`
- Sub-components: `Dialog.Root`, `Dialog.Portal`, `Dialog.Overlay`, `Dialog.Content`, `Dialog.Close`
- `data-slot` on every wrapper element

### OVERLAY_CLASSES
```tsx
// SOURCE: apps/admin/src/components/ui/alert-dialog.tsx:36-43
className={cn(
  'fixed inset-0 z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
  className,
)}
```
- Use `data-open:` / `data-closed:` Tailwind v4 data variants for enter/exit animation
- z-50 for overlay; Dialog.Content also rendered at z-50 inside a Portal

### CONFIRM_DIALOG_STRUCTURE
```tsx
// SOURCE: apps/admin/src/components/modules/confirm-dialog.tsx:33-86
export function ConfirmDialog({ open, onOpenChange, ... }: ConfirmDialogProps) {
  // ...
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>...</AlertDialogContent>
    </AlertDialog>
  );
}
```
- Controlled `open` + `onOpenChange` props — consumer owns open state
- Named export, no default export
- No trigger inside the component — caller wraps their own trigger

### THUMBNAIL_PATTERN
```tsx
// SOURCE: apps/admin/src/modules/upload/components/multi-image-upload-field.tsx:155-178
{value.map((tempId) => (
  <div key={tempId} className="relative size-24 shrink-0">
    <div className="relative size-24 overflow-hidden rounded-lg border">
      <Image src={previews[tempId]} alt="Product image preview" fill
        className="object-cover" sizes="96px" />
    </div>
    <Button type="button" variant="destructive" size="icon"
      onClick={() => handleRemove(tempId)}
      className="absolute -right-2 -top-2 size-5">
      <X className="size-3" />
    </Button>
  </div>
))}
```

### NEXT_IMAGE_DETAIL_PATTERN
```tsx
// SOURCE: apps/admin/src/modules/product/pages/detail-product-page.tsx:111-119
<Image
  key={img.id}
  src={img.imageUrl}
  alt={product.name}
  width={96}
  height={96}
  className="size-24 rounded-lg object-cover"
/>
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `apps/admin/src/components/modules/image-viewer.tsx` | CREATE | Reusable image viewer modal |
| `apps/admin/src/modules/product/pages/detail-product-page.tsx` | UPDATE | Make gallery thumbnails clickable |
| `apps/admin/src/modules/upload/components/multi-image-upload-field.tsx` | UPDATE | Add view-on-click to upload thumbnails |

## NOT Building
- Pan / drag to reposition image when zoomed
- Keyboard arrow navigation between multiple images (single image per viewer open)
- Image download button
- Image metadata display (dimensions, file size)
- Thumbnail strip / carousel navigation within the viewer
- Swipe gestures for mobile

---

## Step-by-Step Tasks

### Task 1: Create `components/modules/image-viewer.tsx`
- **ACTION**: Create the reusable viewer modal using Radix `Dialog` primitive.
- **IMPLEMENT**:

```tsx
'use client';

import { Button } from '@admin/components/ui/button';
import { cn } from '@admin/lib/utils';
import { Minus, Plus, RotateCcw, X } from 'lucide-react';
import { Dialog } from 'radix-ui';
import * as React from 'react';

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const STEP = 0.25;

interface ImageViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  alt: string;
}

/**
 * Full-screen image viewer with zoom controls.
 * Consumer owns the open state. Zoom resets to 100% when closed.
 */
export function ImageViewer({ open, onOpenChange, src, alt }: ImageViewerProps) {
  const [scale, setScale] = React.useState(1);

  React.useEffect(() => {
    if (!open) setScale(1);
  }, [open]);

  const zoomIn = () => setScale((s) => Math.min(+(s + STEP).toFixed(2), MAX_SCALE));
  const zoomOut = () => setScale((s) => Math.max(+(s - STEP).toFixed(2), MIN_SCALE));
  const reset = () => setScale(1);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          data-slot="image-viewer-overlay"
          className="fixed inset-0 z-50 bg-black/80 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        />
        <Dialog.Content
          data-slot="image-viewer-content"
          className={cn(
            'fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 outline-none',
            'data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
          )}
        >
          {/* Close button */}
          <Dialog.Close asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 text-white hover:bg-white/20 hover:text-white"
              aria-label="Đóng"
            >
              <X className="size-5" />
            </Button>
          </Dialog.Close>

          {/* Image */}
          <div className="flex max-h-[85vh] max-w-[90vw] items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              style={{ transform: `scale(${scale})`, transition: 'transform 150ms ease' }}
              className="max-h-[85vh] max-w-[90vw] rounded-md object-contain"
              draggable={false}
            />
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={zoomOut}
              disabled={scale <= MIN_SCALE}
              aria-label="Thu nhỏ"
              className="text-white hover:bg-white/20 hover:text-white disabled:opacity-40"
            >
              <Minus className="size-4" />
            </Button>

            <button
              type="button"
              onClick={reset}
              className="min-w-[3.5rem] text-center text-sm font-medium text-white hover:text-white/80"
              aria-label="Đặt lại zoom"
            >
              {Math.round(scale * 100)}%
            </button>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={zoomIn}
              disabled={scale >= MAX_SCALE}
              aria-label="Phóng to"
              className="text-white hover:bg-white/20 hover:text-white disabled:opacity-40"
            >
              <Plus className="size-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={reset}
              aria-label="Đặt lại zoom"
              className="text-white hover:bg-white/20 hover:text-white"
            >
              <RotateCcw className="size-4" />
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

- **MIRROR**: SHADCN_UI_DIALOG_PRIMITIVE, OVERLAY_CLASSES
- **IMPORTS**: `Dialog` from `radix-ui`, `Button` from `@admin/components/ui/button`, `cn` from `@admin/lib/utils`, `Minus, Plus, RotateCcw, X` from `lucide-react`, `React` from `react`
- **GOTCHA**: Use plain `<img>` (not Next.js `Image`) inside the viewer. Next.js `Image` requires known `width`/`height` or a positioned `fill` container — neither works cleanly with arbitrary CSS scale zoom. The image URL is a Cloudinary CDN URL, so no optimization is lost. Add `eslint-disable-next-line @next/next/no-img-element` comment.
- **GOTCHA**: `Dialog.Close asChild` wrapping `<Button>` — mirrors the `AlertDialogAction` pattern in `alert-dialog.tsx:157`.
- **VALIDATE**: File exists, TypeScript resolves `Dialog` from `radix-ui`, no errors.

### Task 2: Update `detail-product-page.tsx` — clickable gallery
- **ACTION**: Add `selectedImage` state and `ImageViewer` to the image gallery section (lines 103-128).
- **IMPLEMENT**: Replace the static `<Image>` block inside the Images `CardContent`:

```tsx
// Add at top of component body (after existing hooks):
const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

// Replace <CardContent> block for images (was lines 108-128):
<CardContent>
  {product.images.length > 0 ? (
    <>
      <div className="flex flex-wrap gap-3">
        {product.images.map((img) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setSelectedImage(img.imageUrl)}
            className="relative size-24 shrink-0 cursor-zoom-in overflow-hidden rounded-lg border transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Xem ảnh lớn"
          >
            <Image
              src={img.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="96px"
            />
          </button>
        ))}
      </div>
      <ImageViewer
        open={!!selectedImage}
        onOpenChange={(open) => { if (!open) setSelectedImage(null); }}
        src={selectedImage ?? ''}
        alt={product.name}
      />
    </>
  ) : (
    <p className="text-sm text-muted-foreground">Không có hình ảnh</p>
  )}
</CardContent>
```

- **MIRROR**: NEXT_IMAGE_DETAIL_PATTERN, CONFIRM_DIALOG_STRUCTURE
- **IMPORTS**: Add `import { ImageViewer } from '@admin/components/modules/image-viewer';` and ensure `React` is imported (add `import * as React from 'react'` or destructure `useState` from existing import)
- **GOTCHA**: The existing `<Image>` used `width={96} height={96}` — switch to `fill` inside the `relative size-24 overflow-hidden` button wrapper (same pattern as `multi-image-upload-field.tsx`).
- **VALIDATE**: Clicking thumbnail opens viewer; ESC closes it; zoom works; no TypeScript errors.

### Task 3: Update `multi-image-upload-field.tsx` — view button on thumbnails
- **ACTION**: Add `viewingSrc` state, make each completed-upload thumbnail a clickable button, add `ImageViewer` at the bottom of the returned JSX.
- **IMPLEMENT**:

Add state (line 57 area, alongside existing `useState` calls):
```tsx
const [viewingSrc, setViewingSrc] = React.useState<string | null>(null);
```

Replace the completed-uploads `{value.map(...)}` block (was lines 154-178):
```tsx
{value.map((tempId) => (
  <div key={tempId} className="relative size-24 shrink-0">
    <button
      type="button"
      onClick={() => previews[tempId] && setViewingSrc(previews[tempId])}
      className="relative size-24 cursor-zoom-in overflow-hidden rounded-lg border transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="Xem ảnh"
    >
      <Image
        src={previews[tempId]}
        alt="Product image preview"
        fill
        className="object-cover"
        sizes="96px"
      />
    </button>
    <Button
      type="button"
      variant="destructive"
      size="icon"
      onClick={() => handleRemove(tempId)}
      disabled={disabled}
      aria-label="Xóa ảnh"
      className="absolute -right-2 -top-2 size-5"
    >
      <X className="size-3" />
    </Button>
  </div>
))}
```

Add `ImageViewer` just before the closing `</div>` of the outer flex container (before `{error && ...}`):
```tsx
<ImageViewer
  open={!!viewingSrc}
  onOpenChange={(open) => { if (!open) setViewingSrc(null); }}
  src={viewingSrc ?? ''}
  alt="Product image preview"
/>
```

- **MIRROR**: THUMBNAIL_PATTERN, CONFIRM_DIALOG_STRUCTURE
- **IMPORTS**: Add `import { ImageViewer } from '@admin/components/modules/image-viewer';`
- **GOTCHA**: `previews[tempId]` can be `undefined` during upload — guard with `previews[tempId] && setViewingSrc(...)`.
- **GOTCHA**: Place the single `<ImageViewer>` instance OUTSIDE `value.map()` — one viewer for all thumbnails, not one per thumbnail.
- **VALIDATE**: Clicking thumbnail opens viewer; remove button still works; upload still works; ESC closes viewer.

---

## Validation Commands

### Static Analysis
```bash
cd /Users/phong.tran/Workspace/personal/monorepo/apps/admin && npx tsc --noEmit
```
EXPECT: Zero new type errors (pre-existing `login-page.tsx` TS2578 is OK)

### Lint + Format
```bash
cd /Users/phong.tran/Workspace/personal/monorepo && pnpm check
```
EXPECT: No lint errors; `@next/next/no-img-element` suppressed by inline comment

### Browser Validation
```bash
pnpm dev:admin
```
EXPECT:
- `/products/<id>` → thumbnails have pointer cursor, click opens viewer
- Viewer renders full-size image, zoom in/out work
- ESC closes viewer, zoom resets to 100%
- `/products/<id>/edit` → upload field thumbnails open viewer on click
- Remove button still works in upload field

### Manual Validation
- [ ] Overlay click closes the viewer (Radix default behavior)
- [ ] ESC key closes the viewer
- [ ] Zoom in disabled at 300%
- [ ] Zoom out disabled at 50%
- [ ] Scale label updates on each zoom step
- [ ] Reset button returns to 100%
- [ ] Remove button in upload field still works after change
- [ ] No console errors

---

## Acceptance Criteria
- [ ] `components/modules/image-viewer.tsx` created
- [ ] Product detail page images open the viewer on click
- [ ] Upload field thumbnails open the viewer on click
- [ ] Zoom in / out / reset controls work correctly
- [ ] Viewer closes on ESC and overlay click
- [ ] Zero new TypeScript errors
- [ ] `eslint-disable-next-line` comment in place for `<img>` tag

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `Dialog` not exported from unified `radix-ui` package | Low | Build error | Pattern mirrors `AlertDialog` import from same package |
| `@next/next/no-img-element` lint rule blocks CI | Medium | Lint failure | Add `eslint-disable-next-line` comment above `<img>` |
| `previews[tempId]` undefined on click | Low | Viewer opens with blank src | Guard: `previews[tempId] && setViewingSrc(...)` |

## Notes
- Using plain `<img>` inside the viewer is intentional — Cloudinary URLs are already CDN-optimised; zoom via CSS `scale()` requires a plain element.
- `Dialog` is used directly inside `image-viewer.tsx` rather than adding a `components/ui/dialog.tsx` wrapper to avoid adding a generic primitive for a single use case.
- `Dialog.Close asChild` with `<Button>` child mirrors `AlertDialogAction` in `alert-dialog.tsx:157`.
