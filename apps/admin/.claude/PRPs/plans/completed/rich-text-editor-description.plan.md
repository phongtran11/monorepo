# Plan: Rich Text Editor for Product Description

## Summary

Replace the plain `<textarea>` used for the product description field in both the create and edit product forms with a Tiptap-powered rich text editor. The description column is already a PostgreSQL `text` type and the API DTO already annotates it as "may contain HTML", so **no API or database changes are needed** — this is a purely frontend change plus a display update on the detail page.

## User Story

As an admin, I want a rich text editor for the product description field, so that I can format product descriptions with headings, bold/italic text, and lists instead of plain text.

## Problem → Solution

Plain `<textarea>` with no formatting → Tiptap WYSIWYG editor with toolbar (Bold, Italic, Underline, H2, H3, BulletList, OrderedList), storing HTML string. Detail page renders raw text with `whitespace-pre-wrap` → renders HTML safely with `dangerouslySetInnerHTML`.

## Metadata

- **Complexity**: Medium
- **Source PRD**: N/A
- **PRD Phase**: N/A
- **Estimated Files**: 4

---

## UX Design

### Before

```
┌─────────────────────────────────────────────────┐
│  Mô tả đầy đủ                                   │
│ ┌─────────────────────────────────────────────┐ │
│ │ Plain textarea - 6 rows, no formatting      │ │
│ │ Cannot bold, italic, add headings           │ │
│ │ or lists                                    │ │
│ │                                             │ │
│ │                                             │ │
│ │                                             │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### After

```
┌─────────────────────────────────────────────────┐
│  Mô tả đầy đủ                                   │
│ ┌─────────────────────────────────────────────┐ │
│ │ [B] [I] [U] | [H2] [H3] | [•] [1.] Toolbar │ │
│ ├─────────────────────────────────────────────┤ │
│ │ Rich text editing area                      │ │
│ │ Formatted content with bold/italic          │ │
│ │ • Bullet lists                              │ │
│ │ ## Headings                                 │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Interaction Changes

| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Create form description | plain `<textarea>` | Tiptap editor with toolbar | HTML output submitted |
| Edit form description | plain `<textarea>` | Tiptap editor, pre-populated from HTML | `defaultContent` from product.description |
| Detail page description | `whitespace-pre-wrap` plain text | `dangerouslySetInnerHTML` rendered HTML | Admin-only, no XSS risk |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `apps/admin/src/modules/product/pages/create-product-page.tsx` | 202-221 | Exact textarea to replace |
| P0 | `apps/admin/src/modules/product/pages/edit-product-page.tsx` | 209-228 | Exact textarea to replace |
| P0 | `apps/admin/src/modules/product/pages/detail-product-page.tsx` | 91-98 | Description display to update |
| P1 | `apps/admin/src/components/ui/field.tsx` | all | Field/FieldLabel/FieldError pattern to mirror |
| P2 | `apps/admin/src/components/ui/input.tsx` | all | Border/focus/disabled Tailwind classes to mirror |

## External Documentation

| Topic | Key Takeaway |
|---|---|
| Tiptap React (`@tiptap/react`) | `useEditor` + `EditorContent`; call `editor.getHTML()` for output |
| Tiptap StarterKit (`@tiptap/starter-kit`) | Includes: Bold, Italic, Heading, BulletList, OrderedList, HardBreak, Paragraph |
| Tiptap Placeholder (`@tiptap/extension-placeholder`) | `Placeholder.configure({ placeholder: '...' })` |
| Tiptap Underline (`@tiptap/extension-underline`) | `import Underline from '@tiptap/extension-underline'` |

---

## Patterns to Mirror

### FIELD_WRAPPER_PATTERN
```tsx
// SOURCE: apps/admin/src/modules/product/pages/create-product-page.tsx:202-221
<Controller
  name="description"
  control={control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor={field.name}>Mô tả đầy đủ</FieldLabel>
      {/* ← replace <textarea> here with <RichTextEditor> */}
      {fieldState.error && (
        <FieldError errors={[fieldState.error]} />
      )}
    </Field>
  )}
/>
```

### BORDER_FOCUS_CLASSES
```tsx
// SOURCE: apps/admin/src/modules/product/pages/create-product-page.tsx:193
// Used on shortDescription textarea — mirror for RichTextEditor container.
// NOTE: use focus-within (not focus-visible) because focus is on inner ProseMirror div:
"rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow]
 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50
 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
```

### CLIENT_COMPONENT_PATTERN
```tsx
// SOURCE: apps/admin/src/modules/upload/components/multi-image-upload-field.tsx:1
'use client';
// All interactive UI components must have 'use client' directive
```

### IMPORT_ALIAS
```tsx
// SOURCE: apps/admin/src/modules/product/pages/create-product-page.tsx:3
import { ... } from '@admin/components/ui/...';
// Always use @admin/* alias, never relative paths
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `apps/admin/src/components/ui/rich-text-editor.tsx` | CREATE | Reusable Tiptap editor component |
| `apps/admin/src/modules/product/pages/create-product-page.tsx` | UPDATE | Replace textarea (lines 208-215) with `<RichTextEditor>` |
| `apps/admin/src/modules/product/pages/edit-product-page.tsx` | UPDATE | Replace textarea (lines 215-222) with `<RichTextEditor>` |
| `apps/admin/src/modules/product/pages/detail-product-page.tsx` | UPDATE | Replace plain text render (lines 92-94) with `dangerouslySetInnerHTML` |

## NOT Building

- No API or DTO changes — description column is `text` type and DTO already accepts HTML
- No image/file upload inside the editor
- No Markdown mode
- No character/word count
- No full-screen mode
- No table extension
- No link insertion UI
- No HTML sanitization middleware (admin-only content, no untrusted input)

---

## Step-by-Step Tasks

### Task 1: Install Tiptap packages

- **ACTION**: Add Tiptap packages to `apps/admin`
- **IMPLEMENT**: Run from monorepo root:
  ```bash
  pnpm --filter @lam-thinh-ecommerce/admin add @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-underline
  ```
- **MIRROR**: N/A
- **IMPORTS**: N/A
- **GOTCHA**: `@tiptap/pm` (ProseMirror) is a peer dependency pulled automatically by `@tiptap/starter-kit` — no separate install needed.
- **VALIDATE**: Confirm all 4 packages appear in `apps/admin/package.json` dependencies. Run `pnpm install` from monorepo root to sync lockfile.

---

### Task 2: Create `RichTextEditor` component

- **ACTION**: Create `apps/admin/src/components/ui/rich-text-editor.tsx`
- **IMPLEMENT**:

```tsx
'use client';

import { cn } from '@admin/lib/utils';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Underline as UnderlineIcon,
} from 'lucide-react';
import { useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive: boolean;
  disabled: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({
  onClick,
  isActive,
  disabled,
  title,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault(); // prevent editor losing focus on toolbar click
        onClick();
      }}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={isActive}
      className={cn(
        'rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50',
        isActive && 'bg-accent text-foreground',
      )}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Nhập nội dung...',
  disabled = false,
  invalid = false,
  id,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        code: false,
        blockquote: false,
        strike: false,
        horizontalRule: false,
      }),
      Underline,
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.isEmpty ? '' : editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'outline-none min-h-[140px] px-2.5 py-2 text-sm',
        ...(id ? { id } : {}),
      },
    },
  });

  // Sync external value changes (e.g. form reset) without re-triggering onUpdate
  useEffect(() => {
    if (!editor) return;
    const current = editor.isEmpty ? '' : editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  // Sync disabled state
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  return (
    <div
      aria-invalid={invalid}
      className={cn(
        'w-full overflow-hidden rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow]',
        'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
        'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap gap-0.5 border-b border-input px-1.5 py-1">
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBold().run()}
          isActive={editor?.isActive('bold') ?? false}
          disabled={disabled || !editor?.can().toggleBold()}
          title="In đậm (Ctrl+B)"
        >
          <Bold className="size-3.5" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          isActive={editor?.isActive('italic') ?? false}
          disabled={disabled || !editor?.can().toggleItalic()}
          title="In nghiêng (Ctrl+I)"
        >
          <Italic className="size-3.5" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          isActive={editor?.isActive('underline') ?? false}
          disabled={disabled || !editor?.can().toggleUnderline()}
          title="Gạch chân (Ctrl+U)"
        >
          <UnderlineIcon className="size-3.5" />
        </ToolbarButton>

        <div className="mx-1 w-px self-stretch bg-border" aria-hidden />

        <ToolbarButton
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 2 }).run()
          }
          isActive={editor?.isActive('heading', { level: 2 }) ?? false}
          disabled={disabled}
          title="Tiêu đề 2"
        >
          <Heading2 className="size-3.5" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 3 }).run()
          }
          isActive={editor?.isActive('heading', { level: 3 }) ?? false}
          disabled={disabled}
          title="Tiêu đề 3"
        >
          <Heading3 className="size-3.5" />
        </ToolbarButton>

        <div className="mx-1 w-px self-stretch bg-border" aria-hidden />

        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          isActive={editor?.isActive('bulletList') ?? false}
          disabled={disabled}
          title="Danh sách không thứ tự"
        >
          <List className="size-3.5" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          isActive={editor?.isActive('orderedList') ?? false}
          disabled={disabled}
          title="Danh sách có thứ tự"
        >
          <ListOrdered className="size-3.5" />
        </ToolbarButton>
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />
    </div>
  );
}
```

- **MIRROR**: `BORDER_FOCUS_CLASSES`, `CLIENT_COMPONENT_PATTERN`, `IMPORT_ALIAS`
- **IMPORTS**: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder`, `@tiptap/extension-underline`, `lucide-react`, `@admin/lib/utils`
- **GOTCHA 1**: Use `onMouseDown` + `e.preventDefault()` on toolbar buttons — prevents editor from losing focus on toolbar click.
- **GOTCHA 2**: `editor.getHTML()` returns `'<p></p>'` for empty editor. Use `editor.isEmpty ? '' : editor.getHTML()` to store empty string.
- **GOTCHA 3**: `useEffect` sync passes `false` as second arg to `setContent` to avoid emitting an update and creating an infinite loop.
- **VALIDATE**: Component renders without errors; toolbar buttons toggle formatting; `onChange` fires with HTML; `disabled` dims the component.

---

### Task 3: Update `create-product-page.tsx`

- **ACTION**: Replace plain `<textarea>` at lines 208-215 with `<RichTextEditor>`
- **IMPLEMENT**:

Old code (lines 208-215):
```tsx
<textarea
  {...field}
  id={field.name}
  rows={6}
  placeholder="Mô tả chi tiết sản phẩm..."
  disabled={isBusy}
  className="w-full resize-none rounded-md border border-input bg-transparent px-2.5 py-1.5 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
/>
```

New code:
```tsx
<RichTextEditor
  id={field.name}
  value={field.value ?? ''}
  onChange={field.onChange}
  placeholder="Mô tả chi tiết sản phẩm..."
  disabled={isBusy}
  invalid={fieldState.invalid}
/>
```

- **MIRROR**: `FIELD_WRAPPER_PATTERN`, `IMPORT_ALIAS`
- **IMPORTS**: Add `import { RichTextEditor } from '@admin/components/ui/rich-text-editor';`
- **GOTCHA**: Do NOT spread `{...field}` — `RichTextEditor` takes `value`/`onChange` explicitly; it does not need `onBlur` or `ref`.
- **VALIDATE**: Form renders editor; submitting stores HTML in description.

---

### Task 4: Update `edit-product-page.tsx`

- **ACTION**: Replace plain `<textarea>` at lines 215-222 with `<RichTextEditor>`
- **IMPLEMENT**: Same replacement as Task 3. `defaultValues` already sets `description: product.description ?? ''` so the editor pre-populates correctly via the `useEffect` sync inside the component.

Old code (lines 215-222):
```tsx
<textarea
  {...field}
  id={field.name}
  rows={6}
  placeholder="Mô tả chi tiết sản phẩm..."
  disabled={isBusy}
  className="w-full resize-none rounded-md border border-input bg-transparent px-2.5 py-1.5 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
/>
```

New code:
```tsx
<RichTextEditor
  id={field.name}
  value={field.value ?? ''}
  onChange={field.onChange}
  placeholder="Mô tả chi tiết sản phẩm..."
  disabled={isBusy}
  invalid={fieldState.invalid}
/>
```

- **MIRROR**: Same as Task 3
- **IMPORTS**: Add `import { RichTextEditor } from '@admin/components/ui/rich-text-editor';`
- **GOTCHA**: Pre-population works because `useEditor` receives `content: value` on mount, and the `useEffect` sync handles subsequent changes (e.g. react-hook-form `reset()`).
- **VALIDATE**: Edit form pre-populates with existing HTML; edits submit correctly.

---

### Task 5: Update `detail-product-page.tsx` to render HTML

- **ACTION**: Replace plain text render at lines 92-94 with HTML render
- **IMPLEMENT**:

Old code (lines 92-94):
```tsx
<p className="whitespace-pre-wrap text-sm">
  {product.description}
</p>
```

New code:
```tsx
<div
  className="text-sm [&_h2]:mb-1 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-4"
  dangerouslySetInnerHTML={{ __html: product.description }}
/>
```

- **MIRROR**: `DETAIL_PAGE_HTML_RENDER`
- **IMPORTS**: No new imports needed
- **GOTCHA 1**: Do NOT install `@tailwindcss/typography` for `prose` classes — use explicit Tailwind selectors to avoid a new dependency.
- **GOTCHA 2**: Safe to use `dangerouslySetInnerHTML` here — this is an admin-only page and the content is written by admins themselves.
- **VALIDATE**: Detail page renders `<strong>`, `<em>`, `<h2>`, `<ul>` tags visually; existing plain-text descriptions display correctly (Tiptap wraps them in `<p>` tags).

---

## API Compatibility — No Changes Needed

| Layer | File | Evidence |
|---|---|---|
| DTO | `apps/api/src/product/dto/create-product.dto.ts:57-66` | `@IsString() @IsOptional()` with JSDoc "may contain HTML" |
| Service create | `apps/api/src/product/services/product.service.ts:167-168` | `description: dto.description ?? null` — direct assignment |
| Service update | `apps/api/src/product/services/product.service.ts:264-269` | `if (dto.description !== undefined) { product.description = dto.description; }` |
| Entity | `apps/api/src/product/entities/product.entity.ts:59-63` | `@Column({ type: 'text', nullable: true })` — unlimited length |
| UpdateDto | `apps/api/src/product/dto/update-product.dto.ts` | `extends PartialType(CreateProductDto)` — same handling |

---

## Validation Commands

```bash
# Type check
pnpm --filter @lam-thinh-ecommerce/admin exec tsc --noEmit

# Lint + format
pnpm check

# Build
pnpm build:admin

# Dev server
pnpm dev:admin
# Navigate to http://localhost:3000/products/new and verify editor renders
```

---

## Acceptance Criteria

- [ ] Rich text editor renders in create product form
- [ ] Rich text editor renders in edit product form, pre-populated with existing HTML
- [ ] Toolbar: Bold, Italic, Underline, H2, H3, Bullet List, Ordered List
- [ ] HTML output is stored via react-hook-form and submitted to the API
- [ ] Empty editor submits `''`, not `'<p></p>'`
- [ ] `disabled` prop disables editor and toolbar when `isBusy`
- [ ] Detail page renders description as formatted HTML
- [ ] Zero TypeScript errors
- [ ] Zero lint errors

## Completion Checklist

- [ ] `'use client'` directive on component
- [ ] Toolbar buttons use `onMouseDown` + `e.preventDefault()`
- [ ] `useEffect` sync uses `false` flag on `setContent`
- [ ] All imports use `@admin/*` alias
- [ ] No `@tailwindcss/typography` added (use explicit selectors)
- [ ] No API changes made

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Tiptap SSR hydration mismatch | Low | Medium | Component is `'use client'` — Tiptap runs client-side only, no SSR |
| Existing plain-text descriptions appear broken | Low | Low | Plain text renders as `<p>text</p>` — visually correct, no migration needed |
| Bundle size increase | Low | Low | ~50kb gzipped — acceptable for admin dashboard |
