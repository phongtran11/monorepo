# @lam-thinh-ecommerce/api

NestJS 11 REST API for the Lam Thinh E-commerce platform. Handles authentication, product catalog, category management, image uploads, and user administration.

**Port:** 8000 | **Swagger docs:** http://localhost:8000/api/docs | **API prefix:** `/api/v1`

## Tech Stack

- **Framework:** NestJS 11, Express
- **Database:** PostgreSQL + TypeORM (custom repositories)
- **Cache / Sessions:** Redis via ioredis
- **Auth:** JWT access + refresh tokens with rotation chains (argon2 password hashing)
- **Storage:** Cloudinary
- **Validation:** class-validator, class-transformer, Zod (env)
- **Logging:** nestjs-pino (structured JSON logs)
- **Docs:** @nestjs/swagger (auto-generated OpenAPI)
- **Testing:** Jest 30 + ts-jest

## Prerequisites

- Node.js 20+
- PostgreSQL (local Docker: `pnpm logs:up` from repo root)
- Redis (local Docker: `pnpm logs:up` from repo root)

## Setup

```bash
# From repo root
pnpm install
pnpm logs:up       # Start PostgreSQL + Redis via Docker

# Configure environment
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env — fill in all required values

# Start in watch mode
pnpm dev:api
```

## Environment Variables

Copy `.env.example` to `.env` and fill in each value:

```env
PORT=8000

# PostgreSQL connection string
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# JWT
JWT_ACCESS_SECRET=your_access_secret
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRATION=7d

# Argon2 password hashing pepper
PASSWORD_HASH_SECRET=your_pepper

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_DEFAULT_FOLDER=uploads

# Redis
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=debug
```

## Scripts

```bash
pnpm dev:api          # Start dev server in watch mode
pnpm debug:api        # Start with Node inspector (port 9229)
pnpm build:api        # Build for production
pnpm check            # Prettier + ESLint fix (run from repo root)

# Tests — run from repo root
pnpm --filter @lam-thinh-ecommerce/api test        # Unit tests
pnpm --filter @lam-thinh-ecommerce/api test:watch  # Watch mode
pnpm --filter @lam-thinh-ecommerce/api test:cov    # Coverage report
pnpm --filter @lam-thinh-ecommerce/api test:e2e    # E2E tests
```

## Project Structure

```
src/
├── config/
│   └── env.validation.ts        # Zod schema — validates all env vars at startup
├── modules/                     # Feature modules
│   ├── auth/                    # JWT login, token refresh, guards, strategies
│   ├── user/                    # User CRUD, role management
│   ├── category/                # Category tree (materialized-path)
│   ├── product/                 # Product catalog
│   ├── image/                   # Image records linked to entities
│   └── upload/                  # Temporary Cloudinary upload handling
├── lib/
│   ├── common/
│   │   ├── decorator/           # @CurrentUser, @Public, @Roles, etc.
│   │   ├── dto/                 # ApiResponseDto<T>, PaginationDto
│   │   ├── filter/              # Global exception filters
│   │   ├── factory/             # App bootstrap (app.factory.ts)
│   │   ├── logger/              # Request logger middleware
│   │   └── swagger/             # Mixin helpers for Swagger decorators
│   ├── redis/                   # RedisService (ioredis wrapper)
│   └── cloudinary/              # CloudinaryService SDK wrapper
├── app.module.ts
└── main.ts
```

## Architecture Patterns

### Layer Responsibilities

| Layer      | Responsibility                             | Returns                 |
| ---------- | ------------------------------------------ | ----------------------- |
| Controller | Routing, HTTP concerns, Swagger decorators | `ApiResponseDto<T>`     |
| Service    | Business logic, entity → interface mapping | Plain domain interfaces |
| Repository | Database interaction                       | Entities                |
| Entity     | DB schema only                             | —                       |

### Response Envelope

Every endpoint returns a consistent `ApiResponseDto<T>`:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "...",
  "data": {},
  "error": null
}
```

### Custom Repositories

Each module has a typed repository class that extends TypeORM's `Repository<Entity>` and exposes named query methods. Services never call `EntityManager` directly.

### Cross-Module Ports

When module A depends on module B, module A declares an abstract port class. Module B provides the concrete adapter and exports the port token. This enforces unidirectional dependencies:

```
AuthModule → UserModule → (leaf)
CategoryModule → ProductModule → (leaf)
```

### Money Fields

Decimal price columns use a custom TypeORM transformer: stored as `DECIMAL` in Postgres, deserialized as JavaScript `number`.

### External-Before-Transaction

Cloudinary uploads and Redis writes happen **before** the database transaction opens, preventing I/O waits from holding a DB lock. On DB failure, the handler rolls back Cloudinary assets in a `catch` block.

### Soft Deletes

All entities use `@DeleteDateColumn()`. Rows are never hard-removed; TypeORM automatically filters `deleted_at IS NULL` on every query.

### JWT + Refresh Token Rotation

Each `Session` entity stores a `chainId` shared across all tokens in a rotation chain. Reusing a revoked token revokes the entire chain, preventing replay attacks.

### Pagination

All list endpoints accept `?page=1&limit=20`. The `limit` is capped at 100. Responses follow `{ items, total, page, limit }` wrapped in `ApiResponseDto`.

## API Conventions

| Convention             | Value                           |
| ---------------------- | ------------------------------- |
| Global prefix          | `/api/v1`                       |
| Swagger UI             | `/api/docs`                     |
| Error message language | Vietnamese                      |
| Pagination params      | `?page=&limit=` (max 100)       |
| Text search            | `ILIKE`                         |
| Bulk operations        | Dedicated DTOs with UUID arrays |

## Key Reference Files

| Purpose                | Path                                           |
| ---------------------- | ---------------------------------------------- |
| API response envelope  | `src/lib/common/dto/api-response.dto.ts`       |
| App bootstrap          | `src/lib/common/factory/app.factory.ts`        |
| Environment validation | `src/config/env.validation.ts`                 |
| Auth guards            | `src/modules/auth/guard/`                      |
| Custom decorators      | `src/lib/common/decorator/`                    |
| Swagger helpers        | `src/lib/common/swagger/api-response.mixin.ts` |

## Deployment

Deployed to **Railway** using the `Dockerfile` in this directory.

```bash
# Build the Docker image locally
docker build -f apps/api/Dockerfile -t lam-thinh-api .
```
