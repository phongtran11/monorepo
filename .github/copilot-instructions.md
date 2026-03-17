# Project Guidelines

## Code Style

- Use TypeScript with strict typing and explicit types for public APIs.
- Follow naming conventions already used in the repo:
  - Files: kebab-case
  - Variables/functions: camelCase
  - Classes/interfaces/types: PascalCase
- Keep imports sorted (ESLint simple-import-sort is enabled).
- Keep formatting aligned with Prettier (2 spaces, single quotes, semicolons, trailing commas).
- Prefer barrel exports (`index.ts`) when a folder exposes multiple symbols.

## Architecture

- This is a pnpm monorepo with three primary areas:
  - `apps/api`: NestJS backend (modular architecture, TypeORM, JWT auth, Swagger)
  - `apps/web`: Next.js frontend (App Router, Tailwind v4)
  - `packages/shared`: shared constants/helpers/types used by apps
- In `apps/api`, keep features module-scoped (`auth`, `user`, `category`, etc.).
- When a module has multiple files of the same role, group by subfolders (`dto`, `entities`, `repositories`, `services`, `guard`, `strategy`).
- For database access in API, follow the existing custom repository pattern (repositories extending TypeORM `Repository`).
- Keep global app bootstrap behavior centralized in `apps/api/src/common/factory/app.factory.ts`.

## Build and Test

- Install dependencies from monorepo root: `pnpm install`.
- Common root commands:
  - `pnpm dev`
  - `pnpm build`
  - `pnpm lint`
  - `pnpm format:check`
- API-specific commands:
  - `pnpm --filter @lam-thinh-ecommerce/api dev`
  - `pnpm --filter @lam-thinh-ecommerce/api test`
  - `pnpm --filter @lam-thinh-ecommerce/api test:e2e`
- Web-specific commands:
  - `pnpm --filter @lam-thinh-ecommerce/web dev`
  - `pnpm --filter @lam-thinh-ecommerce/web build`
- Shared package commands:
  - `pnpm --filter @lam-thinh-ecommerce/shared dev`
  - `pnpm --filter @lam-thinh-ecommerce/shared build`

## Conventions

- API responses must use the standard `ApiResponseDto<T>` wrapper.
- For request validation in API, use `class-validator` decorators in DTO classes.
- For response serialization in API, prefer DTOs with `class-transformer` (`@Exclude`, `@Expose`).
- For DTO and interface declarations, prefer explicit, clean interface/type definitions for payloads and metadata.
- Add JSDoc comments for all public methods, classes, and interfaces.
- Always add Swagger decorators for API endpoints (`@ApiOkResponse`, `@ApiCreatedResponse`, `@ApiResponse`, etc.) and use `ApiResponseOf(...)` for response `type` definitions.
- Use `@nestjs/config` with dedicated config files in `apps/api/src/config/` (for example, `registerAs('app', ...)` in `apps/api/src/config/app.config.ts`).
- Keep all global API configuration (prefix/versioning/validation/filter) in the app factory, not per-controller.
- Use Vietnamese for user-facing HTTP exception messages.
- Use values from `@lam-thinh-ecommerce/shared` when constants/helpers already exist there.
- Environment variables for API are validated with Zod (`apps/api/src/config/env.validation.ts`); keep new env vars added to that schema.

## Pitfalls

- `apps/web` runs on port 4000 (`next dev --port=4000`), not 3000.
- API global prefix/versioning means endpoints are under `/api/v1/...` by default.
- TypeORM `synchronize` is enabled outside production only; do not rely on sync behavior for production migrations.
- In TypeORM entities, if a column is nullable, ensure the TypeScript type includes `| null`.

## Reference Examples

- Constants and inferred types: `packages/shared/src/constants/role.constant.ts`
- API response envelope: `apps/api/src/common/dto/api-response.dto.ts`
- Global API bootstrap setup: `apps/api/src/common/factory/app.factory.ts`
- Env validation schema: `apps/api/src/config/env.validation.ts`
