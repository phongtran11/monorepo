# Project Rules & Guidelines

## Core Principles

- **Monorepo Structure:** Managed with `pnpm` workspaces.
- **Shared Code:** Use `packages/shared` for constants, types, and helpers shared between apps.
  - **Example:** `@lam-thinh-ecommerce/shared`
- **Type Safety:** Use TypeScript with strict typing. Prefer `as const` and `typeof` for constants.
  - **Example:**
    ```typescript
    /** Status of an account in the system. */
    export const AccountStatus = {
      INACTIVE: 1,
      ACTIVE: 2,
      BANNED: 3,
    } as const;
    export type AccountStatus =
      (typeof AccountStatus)[keyof typeof AccountStatus];
    ```
- **Barrel Exports:** Use `index.ts` files to export all relevant symbols within a directory.
  - **Example:** `packages/shared/src/index.ts`
    ```typescript
    export * from './constants';
    export * from './helpers';
    ```

## API Development (`apps/api`)

- **Framework:** NestJS (Express).
- **Versioning:** URI versioning (default `v1`). Global prefix: `api`.
  - **Example:** `GET /api/v1/auth/profile`
- **Response Format:** All responses must use `ApiResponseDto<T>`.
  - **Example:**
    ```typescript
    return ApiResponseDto.success(data);
    ```
- **Architecture:**
  - **Module Pattern:** Organize code into modules (`auth`, `user`, `category`, etc.).
  - **Repository Pattern:** Use Custom Repository Pattern for database access.
    - **Example:** `apps/api/src/user/user.repository.ts`
      ```typescript
      @Injectable()
      export class UserRepository extends Repository<User> {
        constructor(protected dataSource: DataSource) {
          super(User, dataSource.createEntityManager());
        }
      }
      ```
  - **DTOs:**
    - Use `class-validator` decorators for request validation.
      - **Example:** `apps/api/src/auth/dto/login.dto.ts` (using `@IsEmail()`, `@MinLength(8)`)
    - For response DTOs, use `@Exclude()` at the class level and `@Expose()` on fields.
      - **Example:** `apps/api/src/category/dto/category-response.dto.ts`
  - **Transformation:** In Controllers, use `plainToInstance(DtoClass, data)` from `class-transformer`.
    - **Example:** `apps/api/src/category/category.controller.ts`
      ```typescript
      const categories = await this.categoryService.findAll();
      return ApiResponseDto.success(
        plainToInstance(CategoryResponseDto, categories),
      );
      ```
  - **Configuration:** Use `@nestjs/config` with dedicated config files in `src/config/`.
    - **Example:** `apps/api/src/config/app.config.ts` using `registerAs('app', ...)`
- **App Initialization:** All global configurations must be centralized in `src/common/factory/app.factory.ts`.
- **E2E Testing:** Use the `bootstrapApp` factory for app initialization in tests.
- **Global Setup:**
  - Swagger documentation: `/api/docs`.
  - Logger: `nestjs-pino`.
- **Error Handling:** Use Vietnamese for all `HttpException` messages.
- **Documentation:** Always add Swagger decorators (`@ApiTags`, `@ApiOperation`, `@ApiResponse`, etc.).
  - **Example:** `apps/api/src/auth/auth.controller.ts`
- **Bootstrapping:** Use `void bootstrap()` for the entry point.

## Web Development (`apps/web`)

- **Framework:** Next.js.
- **Styling:** Tailwind CSS.

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
  - **Example:**
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
- **Imports:** Use `eslint-plugin-simple-import-sort`. Prioritize import from alias (`@lam-thinh-ecommerce/...`, `@api/*`, `@web/*`). Avoid relative paths.

## Git & Workflow

- **No Direct Commits:** Do not stage or commit changes unless explicitly requested.
- **Verification:** Always run `pnpm lint` and `pnpm format:check` before finalizing.
