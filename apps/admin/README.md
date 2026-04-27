# @lam-thinh-ecommerce/admin

Next.js 16 admin dashboard for the Lam Thinh E-commerce platform. Manages products, categories, users, and uploads through a server-rendered React UI.

**Port:** 3000

## Tech Stack

- **Framework:** Next.js 16, React 19 (App Router)
- **Styling:** Tailwind CSS 4, shadcn UI, Radix UI primitives
- **Forms:** React Hook Form + Zod validation
- **Tables:** TanStack Table
- **Rich Text:** Tiptap
- **Logging:** Pino (server-side)
- **Auth:** JWT cookie-based, enforced in middleware (not in pages)

## Prerequisites

- Node.js 20+
- The API (`apps/api`) must be running on port 8000

## Setup

```bash
# From repo root
pnpm install

# Configure environment
cp apps/admin/.env.example apps/admin/.env
# Edit apps/admin/.env — fill in API_URL and Cloudinary values

# Start dev server
pnpm dev:admin
```

Open http://localhost:3000.

## Environment Variables

```env
NODE_ENV=development

# NestJS API base URL
API_URL=http://localhost:8000/api/v1

# Cloudinary (for direct browser uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset

# Optional
# LOG_LEVEL=debug
```

## Scripts

```bash
pnpm dev:admin    # Start dev server on port 3000
pnpm build:admin  # Build for production
pnpm check        # Prettier + ESLint fix (run from repo root)
```

## Project Structure

```
src/
├── app/
│   ├── (authenticated)/         # Protected route group
│   │   ├── layout.tsx           # Authenticated shell (sidebar, header)
│   │   ├── categories/          # Category list + create + edit pages
│   │   └── products/            # Product list + create + [id] detail pages
│   ├── login/                   # Public login page
│   ├── error.tsx                # Global error boundary
│   ├── not-found.tsx            # 404 page
│   └── layout.tsx               # Root layout (theme provider, fonts)
├── modules/                     # Feature modules (colocated logic)
│   ├── auth/
│   │   ├── actions/             # Server actions (login, logout, token refresh)
│   │   ├── components/          # LoginForm (client component)
│   │   ├── context/             # AuthContext (current user)
│   │   ├── pages/               # LoginPage composition
│   │   ├── schemas/             # Zod schemas
│   │   ├── types/               # TypeScript types
│   │   └── index.ts             # Barrel export
│   ├── category/                # Category CRUD + tree management
│   ├── product/                 # Product CRUD + image management
│   └── upload/                  # Temporary upload orchestration
├── components/
│   ├── atoms/                   # Thin wrappers: CurrencyInput, Select
│   ├── modules/                 # Cross-feature UI: dialogs, pagination, skeletons
│   └── ui/                      # shadcn primitives — do not edit directly
├── hooks/                       # Custom React hooks
├── lib/
│   ├── api.ts                   # Server-only Apis singleton (fetch wrapper)
│   ├── action-utils.ts          # Server action error handling helpers
│   ├── constants.ts             # ROUTE_PERMISSIONS, API_ENDPOINTS, cookies
│   ├── env.ts                   # Zod environment validation (server-only)
│   ├── logger.ts                # Pino-based logger
│   └── token-manager.ts         # JWT token read/write in cookies
└── proxy/
    ├── auth.ts                  # Auth middleware logic (token refresh on 401)
    └── proxy.ts                 # Middleware entry point
```

## Key Concepts

### Authentication

Auth is enforced in `proxy.ts` middleware — **not** in pages or layouts. When the API returns 401, the middleware silently attempts a token refresh. If refresh also fails, the user is redirected to `/login`.

Never add auth guards inside page components; the middleware is the single enforcement point.

### API Client

`src/lib/api.ts` exports a server-only `Apis` singleton. It automatically attaches `Authorization` headers from cookies, handles retry logic, and enforces request timeouts. Use it in Server Components and Server Actions.

```typescript
import { apis } from '@admin/lib/api';

const data = await apis.get('/categories');
```

### Upload Flow

Image uploads go through four server actions:

1. `uploadTemp` — uploads the file to Cloudinary as a temporary asset
2. `getSignature` — gets a signed Cloudinary URL for the browser
3. `registerTemp` — registers the temp ID with the API (tracked in Redis)
4. `cancelUpload` — deletes the temp asset if the form is abandoned

### Route Permissions

`ROUTE_PERMISSIONS` in `src/lib/constants.ts` maps URL patterns to required permissions. The middleware checks this map on every request using the current user's role from `@lam-thinh-ecommerce/shared`.

### Module File Conventions

| File type | Location |
|---|---|
| Server actions | `<feature>/actions/` with `'use server'` |
| Client components | `<feature>/components/` with `'use client'` |
| Zod schemas | `<feature>/schemas/` |
| TypeScript types | `<feature>/types/` |
| Barrel export | `<feature>/index.ts` |

### Category Tree

The API returns categories as a nested tree. The admin module flattens this to a list with `depth` and `parentId` properties for use in select dropdowns and sortable tables.

### Path Aliases

```
@admin/*                   → src/*
@lam-thinh-ecommerce/shared → packages/shared/src
```

## Deployment

Deployed to **Railway** as a Docker image using the multi-stage `Dockerfile` in this directory.

The build process:
1. **deps** — installs workspace dependencies with pnpm
2. **builder** — builds `packages/shared` then `apps/admin` with `NEXT_TELEMETRY_DISABLED=1`
3. **runner** — copies only the Next.js standalone output, static files, and `public/` into a minimal `node:22-alpine` image

```bash
# Must be run from the repo root — the Dockerfile references paths relative to it
docker build -f apps/admin/Dockerfile -t lam-thinh-admin .
```

The container runs on port `3000` (`CMD ["node", "apps/admin/server.js"]`).
