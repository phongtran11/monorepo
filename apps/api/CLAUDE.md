# API — CLAUDE.md

Context for the NestJS backend (`apps/api`).

---

## Architecture

**Module structure:** Feature-based — `auth`, `user`, `category`, `product`, `cloudinary`

- Group related files into subfolders when >2 of same type: `dto/`, `entities/`, `repositories/`, `services/`, `ports/`, `types/`
- `CloudinaryModule` is `@Global()` — no need to re-import in feature modules
- App bootstrap: `src/common/factory/app.factory.ts`

**Layer responsibilities:**

| Layer      | Responsibility                             | Returns                 |
| ---------- | ------------------------------------------ | ----------------------- |
| Controller | Routing, HTTP concerns, Swagger decorators | `ApiResponseDto<T>`     |
| Service    | Business logic, entity → interface mapping | Plain domain interfaces |
| Repository | Database interaction                       | Entities                |
| Entity     | DB schema only                             | —                       |

---

## Key Patterns

### 1. Custom Repository

```typescript
@Injectable()
export class UserRepository extends Repository<User> {
  constructor(protected dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }
}
```

### 2. Response Envelope

All responses use `ApiResponseDto<T>`:

```typescript
return ApiResponseDto.success(data);
```

### 3. Response Serialization

Services map entities → plain domain interfaces. Controllers wrap and return — no `plainToInstance`.

```typescript
// types/category.types.ts — no decorators
export interface CategoryResult {
  id: string;
  name: string;
  image: CategoryImageResult | null;
  createdAt: Date;
  updatedAt: Date;
}

// category.service.ts
async findOne(id: string): Promise<CategoryResult> {
  const entity = await this.categoryRepository.findById(id);
  const image = await this.imageService.findForResource('category', id);
  return this.toResult(entity, image[0] ?? null);
}

// category.controller.ts
async findOne(@Param('id') id: string): Promise<ApiResponseDto<CategoryResult>> {
  return ApiResponseDto.success(await this.categoryService.findOne(id));
}
```

`class-transformer` (`@Type`, `@Transform`) is valid for **request DTO deserialization** only — not for response mapping.

### 4. Cross-Module Ports

When a service needs to call into another module, use an abstract class port. Never inject a concrete `Service` or `Repository` from another module directly.

**Scope rule:**

- **Same module** → inject the concrete service (e.g. controller → `CategoryService`)
- **Across modules** → inject the port (e.g. `CategoryService` → `ProductPort`)

Ports expose only the methods that external callers actually need — not the full service contract.

**Define** a port (abstract class, no decorators):

```typescript
// product/ports/product.port.ts
export abstract class ProductPort {
  abstract hasProductsInCategories(categoryIds: string[]): Promise<boolean>;
}
```

**Implement** in the owning service:

```typescript
@Injectable()
export class ProductService implements ProductPort {
  async hasProductsInCategories(categoryIds: string[]): Promise<boolean> { ... }
}
```

**Register** in the module (export the port, never the concrete class):

```typescript
@Module({
  providers: [
    ProductService,
    ProductRepository,
    { provide: ProductPort, useExisting: ProductService },
  ],
  exports: [ProductPort],
})
export class ProductModule {}
```

**Consume** in another module (no `@Inject()` needed — abstract class is the token):

```typescript
constructor(private readonly productPort: ProductPort) {}
```

**Module dependency direction** — strictly one-way:

```
AuthModule      → UserModule      (AuthService uses UserPort)
CategoryModule  → ProductModule   (CategoryService uses ProductPort)
ProductModule   → (nothing)       leaf module
```

**FK validation without ports** — for simple foreign key existence checks, let the DB constraint enforce it and translate the error rather than adding a reverse port dependency:

```typescript
try {
  await this.dataSource.transaction(...);
} catch (error) {
  if (error instanceof QueryFailedError && (error as any).code === '23503') {
    throw new NotFoundException('Danh mục không tồn tại');
  }
  throw error;
}
```

### 5. Configuration

Use `@nestjs/config` with dedicated config files in `src/config/`. Environment variables validated with Zod in `src/config/env.validation.ts`.

---

## Authentication

- JWT access + refresh tokens
- Strategies: `JwtStrategy`, `JwtRefreshStrategy`
- Argon2 password hashing with `PASSWORD_HASH_SECRET`
- Role-based access: `CUSTOMER`, `STAFF`, `ADMIN`

**Session rotation:** `Session` entity tracks refresh tokens by JTI.

- `chainId` — shared across all tokens in a rotation chain; revoking one revokes all
- `replayPayload` / `replayExpiresAt` — idempotent refresh within grace period
- `revokedAt` — set on logout or reuse detection

---

## Database

- PostgreSQL + TypeORM, soft deletes via `@DeleteDateColumn`
- Category tree: `@Tree('materialized-path')`
- Atomic operations use `dataSource.transaction()`

**Money columns** — TypeORM returns `decimal` as `string`; always add a transformer:

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

- `nullable: true` money columns: type must be `number | null` and transformer must preserve `null`
- Non-nullable columns: trust the DB constraint, no defensive null→0 fallback

**Nullable columns rule** — if `@Column` has `nullable: true`, TypeScript type MUST include `| null`:

```typescript
@Column({ type: 'varchar', length: 255, nullable: true })
fullName: string | null;
```

---

## Image Management

- Cloudinary for permanent storage; Redis tracks temp upload `tempId`s
- Scheduler purges expired temp uploads automatically
- Permanent folder: `uploads/<resource>/<YYYY-MM>` (use `formatYearMonth()` from shared)

**External-Before-Transaction pattern** (see `CategoryService.create`, `ProductService.create`):

1. Validate uniqueness first (no lock held)
2. Run external work (Cloudinary, Redis) **before** opening the transaction
3. Open transaction for DB operations only
4. On DB failure: roll back Cloudinary assets in `catch`
5. On update success: delete old assets post-transaction as best-effort cleanup

---

## API Conventions

- Global prefix: `/api/v1`
- Swagger: `/api/docs`

**Swagger** — always add on controllers and methods:

```typescript
@ApiTags('categories')
@ApiOperation({ summary: '...' })
@ApiOkResponse({ type: ApiResponseOf(CategoryResponseDto) })
```

**Error messages** — Vietnamese for all `HttpException` messages.

**Pagination** (see `ProductService.findAll`):

- Query DTO: `page`/`limit` with `@Type(() => Number)` + `@IsInt` + `@Min`/`@Max` (cap at 100)
- Query builder: `.skip((page - 1) * limit).take(limit).getManyAndCount()`
- Response: `{ items, total, page, limit }` wrapped in `ApiResponseDto`
- Text search: `ILIKE '%search%'`

**Bulk operations** — dedicated DTO with UUID array:

```typescript
export class BulkDeleteCategoryDto {
  @IsArray()
  @IsUUID('all', { each: true })
  ids: string[];
}
```

---

## Testing

- Jest 30 + ts-jest
- Unit: `pnpm --filter @lam-thinh-ecommerce/api test`
- E2E: `pnpm --filter @lam-thinh-ecommerce/api test:e2e`
- Coverage: `pnpm --filter @lam-thinh-ecommerce/api test:cov`
- E2E bootstrap: `bootstrapApp` from `src/common/factory/app.factory.ts`

---

## Key Reference Files

| Purpose                | Path                                       |
| ---------------------- | ------------------------------------------ |
| API response envelope  | `src/common/dto/api-response.dto.ts`       |
| App bootstrap          | `src/common/factory/app.factory.ts`        |
| Environment validation | `src/config/env.validation.ts`             |
| Auth guards            | `src/auth/guard/`                          |
| Custom decorators      | `src/common/decorator/`                    |
| Swagger helpers        | `src/common/swagger/api-response.mixin.ts` |
