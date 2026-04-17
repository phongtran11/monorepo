# Plan: Upload Logic Deduplication + ImageViewer Pan Support

## Summary
Two improvements in one plan. (1) Both upload components share identical ~40-line Cloudinary upload logic — extract it into `cloudinary-upload.ts` utility and refactor both components to use it. A full single-component merge is impractical because the value types differ (`string` vs `string[]`) and the UIs are substantially different; extracting shared logic achieves the same deduplication goal cleanly. (2) `ImageViewer` currently only zooms around the center — add pointer-based drag-to-pan so users can navigate zoomed images freely.

## User Story
As an admin user, I want to drag a zoomed image to inspect different areas, and as a developer I want the upload logic to live in one place so changes to the Cloudinary flow only need to be made once.

## Problem → Solution
- `image-upload-field.tsx` and `multi-image-upload-field.tsx` both implement the identical 3-step Cloudinary upload (get signature → upload to Cloudinary → register with backend). → Extract into `src/modules/upload/utils/cloudinary-upload.ts`.
- `ImageViewer` applies `scale(N)` only, always centering on the image center. → Add `offset {x, y}` state with pointer-capture drag events; apply `translate(x, y) scale(N)` transform; reset offset on zoom reset or dialog close.

## Metadata
- **Complexity**: Medium
- **Source PRD**: N/A
- **PRD Phase**: N/A
- **Estimated Files**: 1 created, 3 updated

---

## UX Design

### ImageViewer — Before
```
┌─────────────────────────────────────────────────┐
│  [zoom in]  image always centered  [zoom out]   │
│  Can't move the image when zoomed in             │
└─────────────────────────────────────────────────┘
```

### ImageViewer — After
```
┌─────────────────────────────────────────────────┐
│  [zoom in]  grab+drag to pan  [zoom out]        │
│  cursor:grab when zoomed, cursor:grabbing while  │
│  dragging; offset resets when zoom resets        │
└─────────────────────────────────────────────────┘
```

### Upload deduplication — UX change
None — purely internal refactor. User-facing behaviour is identical.

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Viewer — drag zoomed image | Not possible | Pointer drag pans the image | Only active when scale > 1 |
| Viewer — cursor | Always default | `grab` at scale > 1, `grabbing` while dragging | Visual affordance |
| Viewer — reset zoom | Resets scale only | Resets scale AND pan offset | Fully resets view |
| Upload — behaviour | Unchanged | Unchanged | Internal only |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `apps/admin/src/components/modules/image-viewer.tsx` | all | File being modified for pan |
| P0 | `apps/admin/src/modules/upload/components/image-upload-field.tsx` | 54-123 | `uploadFile` logic to extract |
| P0 | `apps/admin/src/modules/upload/components/multi-image-upload-field.tsx` | 59-137 | Duplicate `uploadFile` to replace |
| P1 | `apps/admin/src/modules/upload/actions/index.ts` | all | Shared actions imported by utility |
| P1 | `apps/admin/src/modules/upload/index.ts` | all | Barrel — utility does NOT need to be added here |

## External Documentation
No external research needed — feature uses established React pointer events and existing internal patterns.

---

## Patterns to Mirror

### UPLOAD_FLOW_CURRENT
```ts
// SOURCE: apps/admin/src/modules/upload/components/image-upload-field.tsx:68-121
// Step 1: get a short-lived Cloudinary signature
const sigResult = await getUploadSignatureAction();
if (!sigResult.success || !sigResult.data) { ... return; }
const { signature, timestamp, apiKey, cloudName, folder, tags } = sigResult.data;

// Step 2: upload directly from the browser to Cloudinary
const cloudinaryForm = new FormData();
cloudinaryForm.append('file', file);
cloudinaryForm.append('api_key', apiKey);
cloudinaryForm.append('timestamp', String(timestamp));
cloudinaryForm.append('signature', signature);
cloudinaryForm.append('folder', folder);
cloudinaryForm.append('tags', tags);
const cloudRes = await fetch(
  `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
  { method: 'POST', body: cloudinaryForm },
);
if (!cloudRes.ok) { ... return; }
const { public_id, secure_url } = await cloudRes.json();

// Step 3: register with the backend to get a tempId
const result = await registerTempUploadAction(public_id, secure_url);
if (!result.success || !result.data) { ... return; }
```
→ This exact block (~40 lines) is duplicated in both components. Extract verbatim into utility.

### UTILITY_FILE_PATTERN
```ts
// Convention: pure async function, named export, no default export
// No 'use client' or 'use server' directive (plain utility)
// Lives in a utils/ subfolder of the owning module
```

### IMAGE_VIEWER_CURRENT_TRANSFORM
```tsx
// SOURCE: apps/admin/src/components/modules/image-viewer.tsx:64-70
<img
  src={src}
  alt={alt}
  style={{ transform: `scale(${scale})`, transition: 'transform 150ms ease' }}
  className="max-h-[85vh] max-w-[90vw] rounded-md object-contain"
  draggable={false}
/>
```
→ Change to `transform: translate(${offset.x}px, ${offset.y}px) scale(${scale})`
→ `transition: isDragging.current ? 'none' : 'transform 150ms ease'`

### POINTER_CAPTURE_PATTERN
```tsx
// Standard React pointer capture for smooth drag:
const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
  if (scale <= 1) return;
  isDragging.current = true;
  dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  e.currentTarget.setPointerCapture(e.pointerId); // keeps events flowing even off-element
};
const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
  if (!isDragging.current) return;
  setOffset({
    x: dragStart.current.ox + (e.clientX - dragStart.current.x),
    y: dragStart.current.oy + (e.clientY - dragStart.current.y),
  });
};
const handlePointerUp = () => { isDragging.current = false; };
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `apps/admin/src/modules/upload/utils/cloudinary-upload.ts` | CREATE | Extracted shared Cloudinary upload logic |
| `apps/admin/src/modules/upload/components/image-upload-field.tsx` | UPDATE | Replace inline upload with utility call |
| `apps/admin/src/modules/upload/components/multi-image-upload-field.tsx` | UPDATE | Replace inline upload with utility call |
| `apps/admin/src/components/modules/image-viewer.tsx` | UPDATE | Add pan/drag support |

## NOT Building
- Full single-component merge of both upload fields (value types and UI differ too much)
- Inertial/momentum scrolling after drag release
- Pinch-to-zoom gesture (touch)
- Boundary clamping for pan offset

---

## Step-by-Step Tasks

### Task 1: Create `utils/cloudinary-upload.ts`
- **ACTION**: Create `apps/admin/src/modules/upload/utils/cloudinary-upload.ts` with the extracted upload logic.
- **IMPLEMENT**:

```ts
import {
  getUploadSignatureAction,
  registerTempUploadAction,
} from '../actions';

/**
 * Uploads a file to Cloudinary via the 3-step flow:
 * 1. Get a short-lived signed URL from the backend
 * 2. Upload directly from the browser to Cloudinary
 * 3. Register the temp asset with the backend to receive a tempId
 *
 * Returns `{ tempId, tempUrl }` on success, or `null` on any failure.
 */
export async function uploadToCloudinary(
  file: File,
): Promise<{ tempId: string; tempUrl: string } | null> {
  // Step 1: get a short-lived Cloudinary signature
  const sigResult = await getUploadSignatureAction();
  if (!sigResult.success || !sigResult.data) return null;

  const { signature, timestamp, apiKey, cloudName, folder, tags } =
    sigResult.data;

  // Step 2: upload directly from the browser to Cloudinary
  const cloudinaryForm = new FormData();
  cloudinaryForm.append('file', file);
  cloudinaryForm.append('api_key', apiKey);
  cloudinaryForm.append('timestamp', String(timestamp));
  cloudinaryForm.append('signature', signature);
  cloudinaryForm.append('folder', folder);
  cloudinaryForm.append('tags', tags);

  const cloudRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: cloudinaryForm },
  );

  if (!cloudRes.ok) return null;

  const { public_id, secure_url } = (await cloudRes.json()) as {
    public_id: string;
    secure_url: string;
  };

  // Step 3: register with the backend to get a tempId
  const result = await registerTempUploadAction(public_id, secure_url);
  if (!result.success || !result.data) return null;

  return { tempId: result.data.tempId, tempUrl: result.data.tempUrl };
}
```

- **MIRROR**: UPLOAD_FLOW_CURRENT, UTILITY_FILE_PATTERN
- **IMPORTS**: `getUploadSignatureAction`, `registerTempUploadAction` from `'../actions'`
- **GOTCHA**: No `'use client'` or `'use server'` directive — this is a plain `.ts` utility. It calls server actions via RPC (safe from client), but no directive needed.
- **GOTCHA**: Do NOT add this to `src/modules/upload/index.ts` — it is internal to the upload module only.
- **VALIDATE**: File exists, TypeScript resolves imports, return type `{ tempId: string; tempUrl: string } | null`.

### Task 2: Refactor `image-upload-field.tsx`
- **ACTION**: Replace the inline 3-step upload block inside `uploadFile` with `uploadToCloudinary`.
- **IMPLEMENT**: Replace the `uploadFile` useCallback body:

```ts
const uploadFile = useCallback(
  async (file: File) => {
    if (disabled || isUploading) return;

    // Cancel the previous staged upload before starting a replacement
    if (staged) {
      cancelUploadAction(staged.tempId);
      setStaged(null);
    }

    setIsUploading(true);
    setError(null);
    onChange('');

    const result = await uploadToCloudinary(file);

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (!result) {
      setError('Tải ảnh thất bại. Vui lòng thử lại.');
      return;
    }

    setStaged({ tempId: result.tempId, previewUrl: result.tempUrl });
    onChange(result.tempId);
  },
  [disabled, isUploading, staged, onChange, setIsUploading],
);
```

- **MIRROR**: UPLOAD_FLOW_CURRENT
- **IMPORTS**: Add `import { uploadToCloudinary } from '../utils/cloudinary-upload';`. Update existing `'../actions'` import to keep only `cancelUploadAction` (remove `getUploadSignatureAction` and `registerTempUploadAction`).
- **GOTCHA**: Original had multiple early `setIsUploading(false)` returns. New version: single `setIsUploading(false)` after `await uploadToCloudinary` — this correctly handles both success and failure paths since the utility does all the work.
- **VALIDATE**: TypeScript clean; upload field behaviour unchanged.

### Task 3: Refactor `multi-image-upload-field.tsx`
- **ACTION**: Replace the inline upload block inside the `files.slice(0, slots).map(async (file) => {...})` callback.
- **IMPLEMENT**: Replace the `try` block inside the Promise.all map:

```ts
await Promise.all(
  files.slice(0, slots).map(async (file) => {
    try {
      const result = await uploadToCloudinary(file);

      if (!result) {
        setError('Tải ảnh thất bại. Vui lòng thử lại.');
        return;
      }

      const { tempId, tempUrl } = result;

      // Update preview map immediately so this thumbnail appears
      // without waiting for the other concurrent uploads to finish.
      setPreviews((prev) => ({ ...prev, [tempId]: tempUrl }));
      newIds.push(tempId);
    } finally {
      // Decrement the skeleton count as each upload settles (success or failure)
      setUploadingCount((c) => c - 1);
    }
  }),
);
```

- **MIRROR**: UPLOAD_FLOW_CURRENT
- **IMPORTS**: Add `import { uploadToCloudinary } from '../utils/cloudinary-upload';`. Update `'../actions'` import to keep only `cancelUploadAction`.
- **GOTCHA**: Original destructured `result.data.tempId` / `result.data.tempUrl`. The utility returns `{ tempId, tempUrl }` directly — no `.data` nesting.
- **VALIDATE**: TypeScript clean; concurrent uploads still work; progressive skeleton thumbnails still appear.

### Task 4: Add pan/drag to `ImageViewer`
- **ACTION**: Add `offset` state, `isDragging`/`dragStart` refs, pointer event handlers, and update transform. Replace entire function body.
- **IMPLEMENT**:

```tsx
export function ImageViewer({ open, onOpenChange, src, alt }: ImageViewerProps) {
  const [scale, setScale] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const isDragging = React.useRef(false);
  const dragStart = React.useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  React.useEffect(() => {
    if (!open) {
      setScale(1);
      setOffset({ x: 0, y: 0 });
    }
  }, [open]);

  const zoomIn = () => setScale((s) => Math.min(+(s + STEP).toFixed(2), MAX_SCALE));
  const zoomOut = () => setScale((s) => Math.max(+(s - STEP).toFixed(2), MIN_SCALE));
  const reset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (scale <= 1) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.x),
      y: dragStart.current.oy + (e.clientY - dragStart.current.y),
    });
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

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

          {/* Image — drag container */}
          <div
            className="flex max-h-[85vh] max-w-[90vw] items-center justify-center overflow-hidden"
            style={{ cursor: scale > 1 ? (isDragging.current ? 'grabbing' : 'grab') : 'default' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                transition: isDragging.current ? 'none' : 'transform 150ms ease',
              }}
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

- **MIRROR**: IMAGE_VIEWER_CURRENT_TRANSFORM, POINTER_CAPTURE_PATTERN
- **IMPORTS**: No new imports — `React` already imported.
- **GOTCHA**: Transform order MUST be `translate(...) scale(...)` (translate first). This means translation is in screen coordinates — 1px mouse = 1px pan regardless of zoom level. `scale(...) translate(...)` would multiply the translation by scale factor.
- **GOTCHA**: `isDragging.current` is a ref — changing it does NOT re-render. Cursor style reads the ref during the render triggered by `setOffset` on pointermove, which is correct.
- **GOTCHA**: `onPointerLeave={handlePointerUp}` is a safety net; `setPointerCapture` already keeps events flowing off-element, but leave handler prevents stuck-drag edge cases.
- **VALIDATE**: Scale=1 → drag disabled, cursor default. Scale>1 → drag works, cursor grab/grabbing. Reset → offset+scale both zero. Close → all reset.

---

## Validation Commands

### Static Analysis
```bash
cd /Users/phong.tran/Workspace/personal/monorepo/apps/admin && npx tsc --noEmit
```
EXPECT: Zero new type errors

### Lint + Format
```bash
cd /Users/phong.tran/Workspace/personal/monorepo && pnpm check
```
EXPECT: No lint errors

### Browser Validation
```bash
pnpm dev:admin
```
EXPECT:
- Single image upload still works (category form, etc.)
- Multi-image upload still works with concurrent progress
- Viewer: zoom in → cursor `grab` → drag moves image → zoom reset snaps back to center

### Manual Validation
- [ ] `ImageUploadField` — upload, replace, remove all still work
- [ ] `MultiImageUploadField` — concurrent upload, skeleton tiles, remove all still work
- [ ] Viewer drag only activates when scale > 1
- [ ] `grab` cursor when zoomed-in but not dragging
- [ ] `grabbing` cursor while dragging
- [ ] Pan offset resets when reset button clicked
- [ ] Pan offset resets when ESC pressed (dialog closes)
- [ ] No console errors

---

## Acceptance Criteria
- [ ] `utils/cloudinary-upload.ts` created; 3-step logic in one place
- [ ] `image-upload-field.tsx` uses utility; no inline Cloudinary fetch
- [ ] `multi-image-upload-field.tsx` uses utility; no inline Cloudinary fetch
- [ ] `ImageViewer` supports drag-to-pan when zoomed
- [ ] Zero new TypeScript errors
- [ ] Zero lint errors

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `setIsUploading(false)` timing differs post-refactor | Low | Spinner stuck | Single `setIsUploading(false)` after await handles all paths |
| Transform order wrong | Medium | Pan scales with zoom level | `translate(x,y) scale(s)` — translate FIRST |
| Cursor not updating during drag | Low | Cursor stays `grab` | `setOffset` on pointermove triggers re-render that reads `isDragging.current` |

## Notes
- Full merge rejected: `value: string` vs `value: string[]` are different types; single+multi UIs differ substantially. Utility extraction eliminates duplication without complexity.
- `cloudinary-upload.ts` is NOT added to `upload/index.ts` — internal utility only.
- `isDragging` is `useRef` not `useState` — avoids re-renders on every pointerdown/up.
