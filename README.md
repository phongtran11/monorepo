# Lam Thinh E-commerce

A full-stack e-commerce platform built as a **pnpm monorepo**, consisting of a NestJS REST API, a Next.js admin dashboard, a shared utilities package, and a web crawler for data ingestion.

## Packages

| Package | Description | Port |
|---|---|---|
| [`apps/api`](./apps/api/README.md) | NestJS 11 backend — REST API, PostgreSQL, Redis, Cloudinary | 8000 |
| [`apps/admin`](./apps/admin/README.md) | Next.js 16 admin dashboard — React 19, Tailwind CSS 4, shadcn UI | 3000 |
| [`apps/crawler`](./apps/crawler/README.md) | Playwright-based web crawler for product data ingestion | — |
| [`packages/shared`](./packages/shared/README.md) | Shared TypeScript constants, types, and helpers | — |
| [`packages/eslint-config`](./packages/eslint-config/README.md) | Shared ESLint configuration | — |

## Tech Stack

- **Package Manager:** pnpm 10 (workspaces)
- **Language:** TypeScript 5
- **Backend:** NestJS 11, TypeORM, PostgreSQL, Redis
- **Frontend:** Next.js 16, React 19, Tailwind CSS 4, shadcn UI
- **Auth:** JWT (access + refresh tokens with rotation)
- **Storage:** Cloudinary (images)
- **Code Quality:** ESLint 9, Prettier 3, `eslint-plugin-simple-import-sort`
- **Deployment:** Railway (API), Vercel (Admin)

## Prerequisites

- Node.js 20+
- pnpm 10+
- Docker (for local PostgreSQL + Redis)

## Getting Started

```bash
# 1. Install all dependencies
pnpm install

# 2. Configure environment
cp apps/api/.env.example apps/api/.env
cp apps/admin/.env.example apps/admin/.env
# Edit both .env files — fill in database, JWT, Cloudinary, and Redis credentials

# 3. Start local services (PostgreSQL + Redis)
pnpm logs:up

# 4. Start all apps in parallel
pnpm dev:all
```

Services will be available at:
- **Admin dashboard:** http://localhost:3000
- **REST API:** http://localhost:8000
- **Swagger docs:** http://localhost:8000/api/docs

## Development Commands

```bash
# Start all services in foreground (shared package + api + admin in parallel)
pnpm dev:all

# Start all services in background, logs written to logs/
pnpm dev:bg
# Tail logs:
tail -f logs/api.log
tail -f logs/admin.log

# Start services individually
pnpm dev:shared    # Shared package in watch mode
pnpm dev:api       # API on port 8000
pnpm dev:admin     # Admin on port 3000

# Debug API with Node inspector
pnpm debug:api

# Build all packages
pnpm build

# Build individually
pnpm build:shared
pnpm build:api
pnpm build:admin

# Lint + format all packages (prettier --write + eslint --fix)
pnpm check

# Docker Compose — start/stop PostgreSQL + Redis
pnpm logs:up
pnpm logs:down
```

## Project Structure

```
monorepo/
├── apps/
│   ├── api/              # NestJS backend
│   ├── admin/            # Next.js admin dashboard
│   └── crawler/          # Playwright web crawler
├── packages/
│   ├── shared/           # Shared constants, types, helpers
│   └── eslint-config/    # Shared ESLint config
├── scripts/
│   └── dev.sh            # Background dev runner
└── logs/                 # Dev log files (git-ignored)
```

## Coding Standards

| Convention | Style |
|---|---|
| Files | `kebab-case` |
| Variables / methods | `camelCase` |
| Classes / interfaces | `PascalCase` |
| Constants | `UPPER_SNAKE_CASE` |
| Indentation | 2 spaces |
| Quotes | Single |
| Semicolons | Required |
| Trailing commas | `all` |

- **Imports:** alias-first (`@lam-thinh-ecommerce/...`, `@api/*`, `@admin/*`); avoid relative paths when an alias exists.
- **Barrel exports:** every folder exposes an `index.ts`.
- **Docs:** JSDoc on all public methods, classes, and interfaces.

Always run `pnpm check` before finalizing work.

## Deployment

Both apps are deployed to **Railway** as Docker images.

| App | Platform | Config |
|---|---|---|
| API | Railway | `apps/api/Dockerfile` |
| Admin | Railway | `apps/admin/Dockerfile` |
