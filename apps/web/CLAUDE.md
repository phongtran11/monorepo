# Web — CLAUDE.md

Context for the Next.js frontend (`apps/web`).

## Architecture

- Next.js 16 with App Router
- React 19 with React Compiler enabled
- Tailwind CSS 4 for styling
- **Runs on port 4000** (NOT 3000)

## Component Library — Atomic Design

```
src/components/
├── atoms/           # Smallest UI primitives (Button, Input, Card, etc.)
├── molecules/       # Composed atoms (ActionGroup, TextBlock, Logo)
└── index.ts         # Barrel export for all components
```

- Atoms are pure presentation — no business logic, styled with CVA variants
- Molecules compose 2-3 atoms into semantic groups
- Import via `@web/components` barrel export

## Feature Folder Pattern

Each route/feature folder follows a consistent structure separating UI from logic:

```
app/admin/(auth)/login/
├── page.tsx             # Pure UI — presentation only, imports hooks
├── _hooks/              # Client-side logic (custom React hooks)
│   └── use-login-form.ts
├── _components/         # Feature-specific components (if needed)
├── action.ts            # Server actions (data mutations, auth)
└── login.schema.ts      # Zod validation schemas
```

- **`page.tsx`**: Only JSX and hook consumption — no inline `useState`, `useForm`, or submit handlers
- **`_hooks/`**: Extract all client-side state and logic into custom hooks
- **`_components/`**: Feature-specific UI components (prefixed with `_` to mark as private to the route)
- **`action.ts`**: Server actions for async operations (auth, API calls)
- **`*.schema.ts`**: Zod schemas colocated with the feature that uses them
- **Vietnamese UI text**: All user-facing text (labels, placeholders, validation messages, toasts, confirmations) must be in Vietnamese

## Shared Utilities

```
src/lib/
├── constants/           # App-level constants (API URLs, config)
├── fetcher/             # HTTP client with auth & token refresh
├── helper/              # Reusable utility functions
│   ├── cn.helper.ts     # clsx + tailwind-merge
│   └── string.helper.ts # String utilities (getInitials, etc.)
└── proxy/               # Next.js middleware (auth, redirects)
```

- App-specific helpers live in `src/lib/helper/`
- Custom hooks shared across features live in `src/hooks/`
