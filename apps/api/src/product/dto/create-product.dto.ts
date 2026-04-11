import { ProductStatus } from '@lam-thinh-ecommerce/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Data transfer object for creating a new product.
 */
export class CreateProductDto {
  /**
   * The display name of the product.
   */
  @ApiProperty({
    example: 'Dầu nhớt Motul 10W-40',
    description: 'The display name of the product.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  /**
   * Stock keeping unit.
   */
  @ApiProperty({
    example: 'MOTUL-10W40-1L',
    description: 'Stock keeping unit — unique business identifier.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sku: string;

  /**
   * Short description shown on product cards.
   */
  @ApiPropertyOptional({
    example: 'Dầu nhớt tổng hợp cao cấp cho xe máy',
    description: 'Short description shown on product cards.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  shortDescription?: string;

  /**
   * Full product description.
   */
  @ApiPropertyOptional({
    example: 'Mô tả chi tiết sản phẩm...',
    description: 'Full product description, may contain HTML.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * Selling price.
   */
  @ApiProperty({ example: 250000, description: 'Selling price.' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  /**
   * Optional compare-at price (original price).
   */
  @ApiPropertyOptional({
    example: 300000,
    description: 'Optional compare-at price (original/strikethrough price).',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  compareAtPrice?: number;

  /**
   * Current stock on hand.
   */
  @ApiPropertyOptional({ example: 100, description: 'Current stock on hand.' })
  @IsInt()
  @Min(0)
  @IsOptional()
  stock?: number;

  /**
   * Lifecycle status of the product.
   */
  @ApiPropertyOptional({
    enum: Object.values(ProductStatus),
    example: ProductStatus.ACTIVE,
    description: 'Lifecycle status of the product.',
  })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  /**
   * ID of the category this product belongs to.
   */
  @ApiProperty({
    example: 'uuid',
    description: 'ID of the category this product belongs to.',
  })
  @IsUUID()
  categoryId: string;

  /**
   * Temporary upload IDs for product images.
   * If provided, images are attached atomically upon creation.
   * The first ID becomes the primary image (sortOrder = 0).
   */
  @ApiPropertyOptional({
    type: [String],
    example: ['temp-upload-id-1', 'temp-upload-id-2'],
    description: 'Temporary upload IDs for product images, ordered.',
  })
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @IsOptional()
  imageIds?: string[];
}
