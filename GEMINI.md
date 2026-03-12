# Project Rules & Guidelines

## Core Principles

- **Monorepo Structure:** Managed with `pnpm` workspaces.
- **Shared Code:** Use `packages/shared` for constants, types, and helpers shared between apps.
- **Type Safety:** Use TypeScript with strict typing. Prefer `as const` and `typeof` for constants.
- **Barrel Exports:** Use `index.ts` files to export all relevant symbols within a directory (e.g., `dto`, `filter`, `decorator`, `config`). This simplifies imports and provides a cleaner API.

## API Development (`apps/api`)

- **Framework:** NestJS (Express).
- **Versioning:** URI versioning (default `v1`). Global prefix: `api`.
- **Response Format:** All responses must use `ApiResponseDto<T>`.
  - Fields: `success`, `statusCode`, `message`, `data`, `error`.
  - Use static helpers: `ApiResponseDto.success(data, ...)` and `ApiResponseDto.error(message, ...)`.
- **Architecture:**
  - **Module Pattern:** Organize code into modules (`auth`, `user`, etc.).
  - **Repository Pattern:** Use Custom Repository Pattern for database access. Repositories should extend `Repository<T>` or `TreeRepository<T>` and be decorated with `@Injectable()`. Inject them directly into services.
  - **DTOs:**
    - Use class-validator decorators for request validation.
    - For response DTOs, use `@Exclude()` at the class level and `@Expose()` on fields to be returned.
    - In Controllers, use `plainToInstance(DtoClass, data)` from `class-transformer` to ensure the response object is correctly transformed and filtered before being wrapped in `ApiResponseDto.success(data)`. Avoid using `as unknown as DtoClass`.
  - **Configuration:** Use `@nestjs/config` with dedicated config files in `src/config/`.
- **App Initialization:** All global configurations (prefix, versioning, pipes, filters) must be centralized in `src/common/factory/app.factory.ts`. This ensures consistency between `main.ts` and E2E tests.
- **E2E Testing:**
  - Use the `bootstrapApp` factory from `src/common/factory/app.factory.ts` for app initialization in `beforeAll`.
  - Assert both API response structure (using `ApiResponseDto`) and database state (using repositories) to ensure complete data integrity.
- **Global Setup:**
  - Swagger documentation: `/api/docs`.
  - Global `ValidationPipe` with `whitelist: true` and `transform: true`.
  - Global `HttpExceptionFilter` for standardized error handling.
  - Logger: `nestjs-pino`.
- **Error Handling:** Use Vietnamese for all `HttpException` messages.
- **Documentation:** Always add Swagger decorators (`@ApiTags`, `@ApiOperation`, `@ApiResponse`, etc.), example and descriptions for Swagger decorators when implementing controllers and DTOs in `apps/api/**`.
- **Bootstrapping:** Use `void bootstrap()` for the entry point and call `bootstrapApp(app)`.

## Web Development (`apps/web`)

- **Framework:** Next.js (observed in structure).
- **Styling:** Tailwind CSS (observed `postcss.config.mjs` and `globals.css`).

## Coding Standards

- **Naming Conventions:**
  - Files: `kebab-case` (e.g., `user.repository.ts`, `api-response.dto.ts`).
  - Variables/Methods: `camelCase`.
  - Classes/Interfaces: `PascalCase`.
  - Constants: `UPPER_SNAKE_CASE` or `PascalCase` for objects used as enums.
- **Indentation:** 2 spaces.
- **Quotes:** Single quotes.
- **Semicolons:** Always use semicolons.
- **Trailing Commas:** `all` in arrays and objects.
- **Documentation:** Must include JSDoc comments for all public methods, classes, and interfaces.
- **Imports:**
  - Use `eslint-plugin-simple-import-sort`.
  - Prioritize import from alias. Prefer workspace aliases (`@lam-thinh-ecommerce/...`) or path aliases (`@api/*` for API, `@web/*` for Web) for internal imports. Avoid relative paths.

## Git & Workflow

- **No Direct Commits:** Do not stage or commit changes unless explicitly requested.
- **Verification:** Always run `pnpm lint` and `pnpm format:check` before finalizing.
