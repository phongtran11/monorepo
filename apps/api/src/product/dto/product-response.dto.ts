import { ProductStatus } from '@lam-thinh-ecommerce/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';

/**
 * Data transfer object for a single image in product responses.
 */
@Exclude()
export class ProductImageResponseDto {
  /**
   * Unique identifier of the image record.
   * Use this as the imageId when submitting edit forms.
   */
  @ApiProperty({ example: 'uuid' })
  @Expose()
  id: string;

  /**
   * Secure URL of the image for display.
   */
  @ApiProperty({
    example:
      'https://res.cloudinary.com/demo/image/upload/v1/uploads/sample.jpg',
  })
  @Expose()
  secureUrl: string;

  /**
   * Display order within the product's gallery (0 = primary image).
   */
  @ApiProperty({ example: 0 })
  @Expose()
  sortOrder: number;
}

/**
 * Data transfer object for product responses.
 */
@Exclude()
export class ProductResponseDto {
  /**
   * Unique identifier of the product.
   */
  @ApiProperty({ example: 'uuid' })
  @Expose()
  id: string;

  /**
   * The display name of the product.
   */
  @ApiProperty({ example: 'Dầu nhớt Motul 10W-40' })
  @Expose()
  name: string;

  /**
   * URL-friendly slug.
   */
  @ApiProperty({ example: 'dau-nhot-motul-10w-40' })
  @Expose()
  slug: string;

  /**
   * Stock keeping unit.
   */
  @ApiProperty({ example: 'MOTUL-10W40-1L' })
  @Expose()
  sku: string;

  /**
   * Short description.
   */
  @ApiPropertyOptional({ example: 'Dầu nhớt tổng hợp cao cấp' })
  @Expose()
  shortDescription: string | null;

  /**
   * Full description.
   */
  @ApiPropertyOptional({ example: 'Mô tả chi tiết...' })
  @Expose()
  description: string | null;

  /**
   * Selling price.
   */
  @ApiProperty({ example: 250000 })
  @Expose()
  price: number;

  /**
   * Compare-at price (original/strikethrough).
   */
  @ApiPropertyOptional({ example: 300000 })
  @Expose()
  compareAtPrice: number | null;

  /**
   * Current stock on hand.
   */
  @ApiProperty({ example: 100 })
  @Expose()
  stock: number;

  /**
   * Lifecycle status of the product.
   */
  @ApiProperty({ enum: Object.values(ProductStatus) })
  @Expose()
  status: ProductStatus;

  /**
   * ID of the category this product belongs to.
   */
  @ApiProperty({ example: 'uuid' })
  @Expose()
  categoryId: string;

  /**
   * Images attached to the product, ordered by sortOrder.
   */
  @ApiProperty({ type: () => ProductImageResponseDto, isArray: true })
  @Expose()
  @Type(() => ProductImageResponseDto)
  images: ProductImageResponseDto[];

  /**
   * The date and time when the product was created.
   */
  @ApiProperty()
  @Expose()
  createdAt: Date;

  /**
   * The date and time when the product was last updated.
   */
  @ApiProperty()
  @Expose()
  updatedAt: Date;
}

/**
 * Paginated response envelope for product lists.
 */
@Exclude()
export class PaginatedProductResponseDto {
  /**
   * The list of products in the current page.
   */
  @ApiProperty({ type: () => ProductResponseDto, isArray: true })
  @Expose()
  @Type(() => ProductResponseDto)
  items: ProductResponseDto[];

  /**
   * Total number of products matching the query.
   */
  @ApiProperty({ example: 120 })
  @Expose()
  total: number;

  /**
   * Current page number (1-indexed).
   */
  @ApiProperty({ example: 1 })
  @Expose()
  page: number;

  /**
   * Number of items per page.
   */
  @ApiProperty({ example: 20 })
  @Expose()
  limit: number;
}
