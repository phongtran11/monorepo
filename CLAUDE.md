# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Lam Thinh E-commerce**, a full-stack e-commerce platform built as a pnpm monorepo with three main packages:

- `apps/api`: NestJS 11 backend with TypeORM, PostgreSQL, Redis, and Cloudinary — runs on **port 8000**
- `apps/admin`: Next.js 16 admin dashboard with React 19, Tailwind CSS 4, and shadcn UI — runs on **port 3000**
- `packages/shared`: Shared TypeScript constants, types, and helpers

## First-Time Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Copy and fill in environment variables for the API
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env — fill in DATABASE_URL, JWT secrets, Cloudinary, Redis credentials

# 3. Start local services (PostgreSQL + Redis via Docker Compose)
pnpm logs:up
```

## Common Development Commands

```bash
# Start all services (foreground — shared, api, admin in parallel)
pnpm dev:all

# Start all services in background, with per-service log files in logs/
pnpm dev:bg
# Tail logs:  tail -f logs/api.log  |  tail -f logs/admin.log  |  tail -f logs/*.log

# Start services individually
pnpm dev:shared    # Build shared package in watch mode
pnpm dev:api       # API server on port 8000
pnpm dev:admin     # Admin dashboard on port 3000

# Debug API with Node inspector
pnpm debug:api

# Build
pnpm build              # All packages
pnpm build:shared
pnpm build:api
pnpm build:admin

# Lint + format (runs prettier --write + eslint --fix across all packages)
pnpm check

# API tests
pnpm --filter @lam-thinh-ecommerce/api test        # Unit tests
pnpm --filter @lam-thinh-ecommerce/api test:e2e    # E2E tests
pnpm --filter @lam-thinh-ecommerce/api test:cov    # Coverage report

# Docker Compose (PostgreSQL + Redis)
pnpm logs:up     # Start services
pnpm logs:down   # Stop services
```

## Monorepo Structure

```
monorepo/
├── apps/
│   ├── api/          # NestJS backend (see apps/api/CLAUDE.md)
│   └── admin/        # Next.js admin dashboard (see apps/admin/CLAUDE.md)
├── packages/
│   └── shared/       # Shared constants, types, helpers (see packages/shared/CLAUDE.md)
└── scripts/
    └── dev.sh        # Background dev runner (used by pnpm dev:bg)
```

## Coding Standards

### Naming Conventions

- **Files**: `kebab-case` (e.g., `user.repository.ts`, `api-response.dto.ts`)
- **Variables/Methods**: `camelCase`
- **Classes/Interfaces**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE` or `PascalCase` for enum-like objects

### Code Style

- **Indentation**: 2 spaces
- **Quotes**: Single quotes
- **Semicolons**: Always required
- **Trailing Commas**: `all` in arrays and objects
- **Import Organization**: Use `eslint-plugin-simple-import-sort` (enabled)
  - Prioritize alias imports: `@lam-thinh-ecommerce/...` (shared), `@api/*` (api), `@admin/*` (admin)
  - Avoid relative paths when possible
- **Barrel Exports**: Use `index.ts` files to export multiple symbols from a folder

### Documentation

- Add JSDoc comments for all public methods, classes, and interfaces

### Shared Constants

- Use values from `@lam-thinh-ecommerce/shared` when they already exist
- Cross-app constants (Role, ROLE_LABELS, permissions) live in `packages/shared`

## Workflow

1. Always run `pnpm check` before finalizing work (formats and lints all packages)
2. Do not stage or commit changes unless explicitly requested

## Deployment

- **API**: Deployed to Railway via `apps/api/Dockerfile` (see `railway.json`)
- **Admin**: Deployed to Vercel (see `apps/admin/vercel.json`)

## GitNexus

This project uses GitNexus for code intelligence. See `.claude/skills/gitnexus/` for tool usage guides.
