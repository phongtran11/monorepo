# API — CLAUDE.md

Context for the NestJS backend (`apps/api`).

## Architecture

**Module Organization:**

- Feature-based modules: `auth`, `user`, `category`, `product`, `cloudinary`
- Group related files into subfolders when >2 files of same type: `dto/`, `entities/`, `repositories/`, `services/`, `guard/`, `strategy/`
- Global app bootstrap centralized in `src/common/factory/app.factory.ts`
- `CloudinaryModule` is `@Global()` — no need to re-import in feature modules

## Key Patterns

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
   return ApiResponseDto.success(
     plainToInstance(CategoryResponseDto, categories),
   );
   ```

5. **Configuration**: Use `@nestjs/config` with dedicated config files in `src/config/`
   - Environment variables validated with Zod schema in `src/config/env.validation.ts`

## Authentication

- JWT-based with access + refresh tokens
- Session tracking via JTI (unique token IDs)
- Two Passport strategies: `JwtStrategy`, `JwtRefreshStrategy`
- Argon2 password hashing with secret
- Role-based access control (CUSTOMER, STAFF, ADMIN)

## Database

- PostgreSQL with TypeORM
- Soft deletes via `@DeleteDateColumn`
- Tree structure for categories using materialized-path
- Atomic transactions for critical operations

### Money / Decimal Columns

TypeORM returns `decimal` columns as `string` by default. For money fields, always attach a transformer so the entity property is `number`:

```typescript
@Column({
  type: 'decimal',
  precision: 12,
  scale: 2,
  transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value),
  },
})
price: number;
```

- For `nullable: true` money columns, both the type (`number | null`) and the transformer's `from` must preserve null — never coerce null to 0 (conflates "missing" with "free").
- Trust the `NOT NULL` constraint on non-nullable columns; do not add defensive null→0 fallbacks in the transformer.

## Image Management

- Cloudinary for permanent storage
- `TempUploadService` stages uploads under `temp/` with Redis-tracked tempIds
- Automatic cleanup scheduler for expired temporary uploads
- Permanent folder convention: `uploads/<resource>/<YYYY-MM>` (use `formatYearMonth()` from shared)

### External-Before-Transaction Pattern

When a create/update touches both Cloudinary and the DB, follow this pattern (see `CategoryService.create`, `ProductService.create`):

1. **Validate** uniqueness and read-only lookups first (no lock held).
2. **Pre-process external work BEFORE the transaction**: consume temp uploads, move assets to permanent folder. Collect results.
3. **Open the DB transaction** containing *only* DB operations — no Redis/Cloudinary calls inside.
4. **On DB failure**: roll back the moved Cloudinary assets in the `catch` block (`cloudinaryService.deleteAsset`).
5. **On success (update flow)**: delete the *old* Cloudinary assets post-transaction as best-effort cleanup.

Rationale: minimizes DB lock time, keeps rollback semantics sane, and orphaned assets from a crash between step 2 and 3 are reclaimed by the cleanup scheduler.

## API Conventions

- Global prefix: `/api`
- Default versioning: `/v1`
- Full endpoint format: `/api/v1/endpoint`
- Swagger documentation at `/api/docs`

### Pagination & Filtering

For list endpoints (see `ProductService.findAll`):

- Query DTO extends a `page`/`limit` shape with `@Type(() => Number)` + `@IsInt` + `@Min`/`@Max` (cap `limit` at 100).
- Use `createQueryBuilder` with `.skip((page - 1) * limit).take(limit)` and `getManyAndCount()`.
- Return a `{ items, total, page, limit }` envelope wrapped in `ApiResponseDto` via a dedicated `PaginatedXxxResponseDto`.
- Use `ILIKE` with `%search%` for case-insensitive text search on Postgres.

## API-Specific Standards

1. **Swagger**: Always add `@ApiTags`, `@ApiOperation`, `@ApiOkResponse`, `@ApiCreatedResponse` decorators. Use `ApiResponseOf(...)` for response types.

2. **Error Messages**: Use Vietnamese for all `HttpException` messages

3. **TypeORM Entities**: Explicitly define TypeScript types for all columns
   - **CRITICAL**: If `@Column` has `nullable: true`, TypeScript type MUST include `| null`

   ```typescript
   @Column({ type: 'varchar', length: 255, nullable: true })
   fullName: string | null;  // ← Must include | null
   ```

4. **Environment Variables**: Add new variables to Zod validation schema in `src/config/env.validation.ts`

## Testing

- **Framework**: Jest 30 with ts-jest
- **Unit tests**: `pnpm --filter @lam-thinh-ecommerce/api test`
- **E2E tests**: `pnpm --filter @lam-thinh-ecommerce/api test:e2e`
- **Coverage**: `pnpm --filter @lam-thinh-ecommerce/api test:cov`
- **E2E Setup**: Use `bootstrapApp` factory from `src/common/factory/app.factory.ts`

## Key Reference Files

- **API response envelope**: `src/common/dto/api-response.dto.ts`
- **Global app bootstrap**: `src/common/factory/app.factory.ts`
- **Environment validation**: `src/config/env.validation.ts`
