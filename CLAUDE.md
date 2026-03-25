# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Lam Thinh E-commerce**, a full-stack e-commerce platform built as a pnpm monorepo with three main packages:

- `apps/api`: NestJS 11 backend with TypeORM, PostgreSQL, Redis, and Cloudinary
- `apps/web`: Next.js 16 frontend with React 19 and Tailwind CSS 4
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
pnpm --filter @lam-thinh-ecommerce/web dev        # Start web app (port 4000)
pnpm --filter @lam-thinh-ecommerce/shared dev     # Build shared package in watch mode
```

## Architecture

### Monorepo Structure

The project uses **pnpm workspaces** with the following organization:

```
monorepo/
├── apps/
│   ├── api/          # NestJS backend
│   │   └── src/
│   │       ├── auth/              # Authentication & JWT
│   │       ├── user/              # User management
│   │       ├── category/          # Category management (tree structure)
│   │       ├── cloudinary/        # Image upload service
│   │       ├── common/            # Shared utilities, DTOs, factories
│   │       └── config/            # Configuration files (validated with Zod)
│   └── web/          # Next.js frontend
└── packages/
    └── shared/       # Shared constants, types, helpers
```

### Backend Architecture (NestJS)

**Module Organization:**
- Feature-based modules (`auth`, `user`, `category`, etc.)
- Group related files into subfolders when >2 files of same type: `dto/`, `entities/`, `repositories/`, `services/`, `guard/`, `strategy/`
- Global app bootstrap centralized in `apps/api/src/common/factory/app.factory.ts`

**Key Patterns:**

1. **Custom Repository Pattern**: Repositories extend TypeORM `Repository<T>`
   ```typescript
   @Injectable()
   export class UserRepository extends Repository<User> {
     constructor(protected dataSource: DataSource) {
       super(User, dataSource.createEntityManager());
     }
   }
   ```

2. **Response Envelope**: All API responses use `ApiResponseDto<T>`
   ```typescript
   return ApiResponseDto.success(data);
   ```

3. **DTO Validation**: Use `class-validator` decorators for request validation

4. **Response Serialization**: Use `class-transformer` with `@Exclude()` at class level and `@Expose()` on fields
   ```typescript
   const categories = await this.categoryService.findAll();
   return ApiResponseDto.success(
     plainToInstance(CategoryResponseDto, categories),
   );
   ```

5. **Configuration**: Use `@nestjs/config` with dedicated config files in `src/config/`
   - Environment variables validated with Zod schema in `apps/api/src/config/env.validation.ts`
   - Example: `registerAs('app', ...)` in `app.config.ts`

**Authentication:**
- JWT-based with access + refresh tokens
- Session tracking via JTI (unique token IDs)
- Two Passport strategies: `JwtStrategy`, `JwtRefreshStrategy`
- Argon2 password hashing with secret
- Role-based access control (CUSTOMER, STAFF, ADMIN)

**Database:**
- PostgreSQL with TypeORM
- Soft deletes via `@DeleteDateColumn`
- Tree structure for categories using materialized-path
- Atomic transactions for critical operations

**Image Management:**
- Cloudinary for permanent storage
- TempUploadService for staging with Redis tracking
- Automatic cleanup scheduler for expired temporary uploads

**API Conventions:**
- Global prefix: `/api`
- Default versioning: `/v1`
- Full endpoint format: `/api/v1/endpoint`
- Swagger documentation at `/api/docs`

### Frontend Architecture (Next.js)

- Next.js 16 with App Router
- React 19 with React Compiler enabled
- Tailwind CSS 4 for styling
- Runs on port 4000 (NOT 3000)

### Shared Package

Contains:
- Constants (account statuses, roles, permissions)
- Type definitions derived from constants using `as const` and `typeof`
- Helper functions (slugify, number formatting)
- Barrel exports for clean imports

Example constant pattern:
```typescript
export const AccountStatus = {
  INACTIVE: 1,
  ACTIVE: 2,
  BANNED: 3,
} as const;
export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];
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
  - Prioritize alias imports: `@lam-thinh-ecommerce/...`, `@api/*`, `@web/*`
  - Avoid relative paths when possible
- **Barrel Exports**: Use `index.ts` files to export multiple symbols from a folder

### Documentation

- Add JSDoc comments for all public methods, classes, and interfaces
- Example:
  ```typescript
  /**
   * Converts a string into a URL-friendly slug.
   * Handles Vietnamese characters and accents.
   *
   * @param text - The raw string to slugify.
   * @returns The generated slug string.
   */
  export function slugify(text: string): string { ... }
  ```

### API-Specific Standards

1. **Swagger Documentation**: Always add Swagger decorators for endpoints
   - `@ApiTags`, `@ApiOperation`, `@ApiOkResponse`, `@ApiCreatedResponse`, etc.
   - Use `ApiResponseOf(...)` for response type definitions

2. **Error Messages**: Use Vietnamese for all `HttpException` messages

3. **TypeORM Entities**:
   - Explicitly define TypeScript types for all columns
   - **CRITICAL**: If `@Column` has `nullable: true`, TypeScript type MUST include `| null`
   ```typescript
   @Column({ type: 'varchar', length: 255, nullable: true })
   fullName: string | null;  // ← Must include | null
   ```

4. **DTO and Interface Declarations**: Prefer explicit, clean interface/type definitions
   ```typescript
   export interface TempUploadMeta {
     publicId: string;
     secureUrl: string;
     userId: string;
   }
   ```

5. **Shared Constants**: Use values from `@lam-thinh-ecommerce/shared` when they already exist

6. **Environment Variables**: Add new environment variables to Zod validation schema in `apps/api/src/config/env.validation.ts`

## Critical Pitfalls to Avoid

1. **Web app runs on port 4000**, not 3000 (`next dev --port=4000`)
2. **API endpoints are under `/api/v1/...`** by default (not just `/...`)
3. **TypeORM `synchronize`** is enabled outside production only - don't rely on sync for production
4. **Nullable columns** MUST have `| null` in TypeScript type definition
5. **Do not commit changes** unless explicitly requested by the user

## Key Reference Files

- **API response envelope**: `apps/api/src/common/dto/api-response.dto.ts`
- **Global app bootstrap**: `apps/api/src/common/factory/app.factory.ts`
- **Environment validation**: `apps/api/src/config/env.validation.ts`
- **Constants with types**: `packages/shared/src/constants/role.constant.ts`

## Testing

- **Framework**: Jest 30 with ts-jest
- **Unit tests**: `pnpm --filter @lam-thinh-ecommerce/api test`
- **E2E tests**: `pnpm --filter @lam-thinh-ecommerce/api test:e2e`
- **Coverage**: `pnpm --filter @lam-thinh-ecommerce/api test:cov`
- **E2E Test Setup**: Use `bootstrapApp` factory from `apps/api/src/common/factory/app.factory.ts`

## Workflow

1. Always run `pnpm lint` and `pnpm format:check` before finalizing work
2. Verify that new environment variables are added to Zod validation schema
3. Ensure Swagger decorators are present on all new API endpoints
4. Use Vietnamese for user-facing error messages
5. Do not stage or commit changes unless explicitly requested

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **monorepo** (409 symbols, 984 relationships, 17 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## When Debugging

1. `gitnexus_query({query: "<error or symptom>"})` — find execution flows related to the issue
2. `gitnexus_context({name: "<suspect function>"})` — see all callers, callees, and process participation
3. `READ gitnexus://repo/monorepo/process/{processName}` — trace the full execution flow step by step
4. For regressions: `gitnexus_detect_changes({scope: "compare", base_ref: "main"})` — see what your branch changed

## When Refactoring

- **Renaming**: MUST use `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` first. Review the preview — graph edits are safe, text_search edits need manual review. Then run with `dry_run: false`.
- **Extracting/Splitting**: MUST run `gitnexus_context({name: "target"})` to see all incoming/outgoing refs, then `gitnexus_impact({target: "target", direction: "upstream"})` to find all external callers before moving code.
- After any refactor: run `gitnexus_detect_changes({scope: "all"})` to verify only expected files changed.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Tools Quick Reference

| Tool | When to use | Command |
|------|-------------|---------|
| `query` | Find code by concept | `gitnexus_query({query: "auth validation"})` |
| `context` | 360-degree view of one symbol | `gitnexus_context({name: "validateUser"})` |
| `impact` | Blast radius before editing | `gitnexus_impact({target: "X", direction: "upstream"})` |
| `detect_changes` | Pre-commit scope check | `gitnexus_detect_changes({scope: "staged"})` |
| `rename` | Safe multi-file rename | `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` |
| `cypher` | Custom graph queries | `gitnexus_cypher({query: "MATCH ..."})` |

## Impact Risk Levels

| Depth | Meaning | Action |
|-------|---------|--------|
| d=1 | WILL BREAK — direct callers/importers | MUST update these |
| d=2 | LIKELY AFFECTED — indirect deps | Should test |
| d=3 | MAY NEED TESTING — transitive | Test if critical path |

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/monorepo/context` | Codebase overview, check index freshness |
| `gitnexus://repo/monorepo/clusters` | All functional areas |
| `gitnexus://repo/monorepo/processes` | All execution flows |
| `gitnexus://repo/monorepo/process/{name}` | Step-by-step execution trace |

## Self-Check Before Finishing

Before completing any code modification task, verify:
1. `gitnexus_impact` was run for all modified symbols
2. No HIGH/CRITICAL risk warnings were ignored
3. `gitnexus_detect_changes()` confirms changes match expected scope
4. All d=1 (WILL BREAK) dependents were updated

## Keeping the Index Fresh

After committing code changes, the GitNexus index becomes stale. Re-run analyze to update it:

```bash
npx gitnexus analyze
```

If the index previously included embeddings, preserve them by adding `--embeddings`:

```bash
npx gitnexus analyze --embeddings
```

To check whether embeddings exist, inspect `.gitnexus/meta.json` — the `stats.embeddings` field shows the count (0 means no embeddings). **Running analyze without `--embeddings` will delete any previously generated embeddings.**

> Claude Code users: A PostToolUse hook handles this automatically after `git commit` and `git merge`.

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
