import { ProductStatus } from '@lam-thinh-ecommerce/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

/**
 * Query parameters for listing products with pagination and filtering.
 */
export class ProductQueryDto {
  /**
   * Page number (1-indexed).
   */
  @ApiPropertyOptional({ example: 1, description: 'Page number (1-indexed).' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = 1;

  /**
   * Number of items per page.
   */
  @ApiPropertyOptional({
    example: 20,
    description: 'Items per page (max 100).',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit: number = 20;

  /**
   * Full-text search on name or SKU.
   */
  @ApiPropertyOptional({
    example: 'dầu nhớt',
    description: 'Full-text search on name or SKU.',
  })
  @IsString()
  @IsOptional()
  search?: string;

  /**
   * Filter by category ID.
   */
  @ApiPropertyOptional({
    example: 'uuid',
    description: 'Filter by category ID.',
  })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  /**
   * Filter by product status.
   */
  @ApiPropertyOptional({
    enum: Object.values(ProductStatus),
    description: 'Filter by product status.',
  })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;
}
