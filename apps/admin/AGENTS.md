<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Architecture

This is a **Next.js 16 admin dashboard** with React 19 and Tailwind CSS 4, using the App Router with a route-group pattern:

- `src/app/(authenticated)/` — protected pages (sidebar + header layout)
- `src/app/login/` — public login page
- `src/app/layout.tsx` — root layout (fonts, toaster)

Auth is enforced in **middleware** (`src/proxy.ts` + `src/proxy/auth.ts`), not in pages. The middleware decodes the JWT, checks role (`ADMIN` or `STAFF` only), account status, and route-level permissions before the request reaches any page. Silent token refresh also happens here.

### Module Pattern

Feature code lives in `src/modules/<feature>/` with a consistent internal structure:

```
src/modules/category/
├── actions/         # Server Actions ('use server') — call apis.* then revalidatePath
├── components/      # Client components ('use client') for that feature
├── pages/           # Page-level components (mix of client/server)
├── schemas/         # Zod validation schemas (used in forms)
├── types/           # TypeScript types for the feature
└── index.ts         # Barrel: re-exports from pages/ only
```

Pages (`src/app/`) are thin route files: they fetch data via `apis.*`, decode the JWT for permissions, then pass everything into the module's page component.

### API Client (`src/lib/api.ts`)

`apis` is a server-only singleton (`Apis` class) that wraps `fetch` with:
- Automatic `Authorization: Bearer <access_token>` header from cookies
- Silent token refresh on 401 (one retry, via `TokenManager`)
- Timeout and abort signal support
- Typed `ApiResponse<T>` return shape from `@lam-thinh-ecommerce/shared`

Usage: `apis.get<ResponseType>(path)`, `apis.post<ResponseType, BodyType>(path, { data })`, etc.

### Upload Flow

Temporary uploads go through `uploadTempAction` → returns `{ tempId, tempUrl, expiresIn }`. The `tempId` is submitted with the form payload. On cancel, `cancelUploadAction` cleans up the temp asset.

### Environment

Validated at startup via Zod in `src/lib/env.ts` (server-only). Key vars:
- `API_URL` — backend base URL (default: `http://localhost:8000/api/v1`)
- `LOG_LEVEL` — optional log verbosity

### Path Aliases

- `@admin/*` → `src/*`
- `@lam-thinh-ecommerce/shared` → shared package

### Route Permissions

Defined in `src/lib/constants.ts` as `ROUTE_PERMISSIONS` (prefix → `Permission[]`). The middleware checks these against the user's role via `RolePermissionsMap` from the shared package. Pages also decode the JWT to derive per-action capability flags (`canCreate`, `canUpdate`, `canDelete`) and pass them down to page components.
