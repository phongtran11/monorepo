# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Lam Thinh E-commerce**, a full-stack e-commerce platform built as a pnpm monorepo with three main packages:

- `apps/api`: NestJS 11 backend with TypeORM, PostgreSQL, Redis, and Cloudinary
- `apps/admin`: Next.js 16 admin dashboard with React 19, Tailwind CSS 4, and shadcn UI
- `packages/shared`: Shared TypeScript constants, types, and helpers

## Common Development Commands

```bash
# Install dependencies (from monorepo root)
pnpm install

# Start all services in development mode
pnpm dev

# Build all packages
pnpm build

# Lint and format
pnpm lint
pnpm format:check
pnpm format

# Package-specific commands
pnpm --filter @lam-thinh-ecommerce/api dev        # Start API server (port 3000)
pnpm --filter @lam-thinh-ecommerce/api test       # Run API unit tests
pnpm --filter @lam-thinh-ecommerce/api test:e2e   # Run API E2E tests
pnpm --filter @lam-thinh-ecommerce/admin dev      # Start admin dashboard
pnpm --filter @lam-thinh-ecommerce/shared dev     # Build shared package in watch mode
```

## Monorepo Structure

```
monorepo/
├── apps/
│   ├── api/          # NestJS backend (see apps/api/CLAUDE.md)
│   └── admin/        # Next.js admin dashboard (see apps/admin/CLAUDE.md)
└── packages/
    └── shared/       # Shared constants, types, helpers (see packages/shared/CLAUDE.md)
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

1. Always run `pnpm lint` and `pnpm format:check` before finalizing work
2. Do not stage or commit changes unless explicitly requested

## GitNexus

This project uses GitNexus for code intelligence. See `.claude/skills/gitnexus/` for tool usage guides.
