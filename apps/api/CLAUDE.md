# API — CLAUDE.md

Context for the NestJS backend (`apps/api`).

## Architecture

**Module Organization:**
- Feature-based modules (`auth`, `user`, `category`, etc.)
- Group related files into subfolders when >2 files of same type: `dto/`, `entities/`, `repositories/`, `services/`, `guard/`, `strategy/`
- Global app bootstrap centralized in `src/common/factory/app.factory.ts`

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

## Image Management

- Cloudinary for permanent storage
- TempUploadService for staging with Redis tracking
- Automatic cleanup scheduler for expired temporary uploads

## API Conventions

- Global prefix: `/api`
- Default versioning: `/v1`
- Full endpoint format: `/api/v1/endpoint`
- Swagger documentation at `/api/docs`

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
