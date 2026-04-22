import { ProductStatus } from '@lam-thinh-ecommerce/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * Data transfer object for a single image in product responses.
 */

export class ProductImageResponseDto {
  /**
   * Unique identifier of the image record.
   * Use this as the imageId when submitting edit forms.
   */
  @ApiProperty({ example: 'uuid' })
  id: string;

  /**
   * Secure URL of the image for display.
   */
  @ApiProperty({
    example:
      'https://res.cloudinary.com/demo/image/upload/v1/uploads/sample.jpg',
  })
  secureUrl: string;

  /**
   * Display order within the product's gallery (0 = primary image).
   */
  @ApiProperty({ example: 0 })
  sortOrder: number;
}

/**
 * Data transfer object for product responses.
 */
export class ProductResponseDto {
  /**
   * Unique identifier of the product.
   */
  @ApiProperty({ example: 'uuid' })
  id: string;

  /**
   * The display name of the product.
   */
  @ApiProperty({ example: 'Dầu nhớt Motul 10W-40' })
  name: string;

  /**
   * URL-friendly slug.
   */
  @ApiProperty({ example: 'dau-nhot-motul-10w-40' })
  slug: string;

  /**
   * Stock keeping unit.
   */
  @ApiProperty({ example: 'MOTUL-10W40-1L' })
  sku: string;

  /**
   * Short description.
   */
  @ApiPropertyOptional({ example: 'Dầu nhớt tổng hợp cao cấp' })
  shortDescription: string | null;

  /**
   * Full description.
   */
  @ApiPropertyOptional({ example: 'Mô tả chi tiết...' })
  description: string | null;

  /**
   * Selling price.
   */
  @ApiProperty({ example: 250000 })
  price: number;

  /**
   * Compare-at price (original/strikethrough).
   */
  @ApiPropertyOptional({ example: 300000 })
  compareAtPrice: number | null;

  /**
   * Current stock on hand.
   */
  @ApiProperty({ example: 100 })
  stock: number;

  /**
   * Lifecycle status of the product.
   */
  @ApiProperty({ enum: Object.values(ProductStatus) })
  status: ProductStatus;

  /**
   * ID of the category this product belongs to.
   */
  @ApiProperty({ example: 'uuid' })
  categoryId: string;

  /**
   * Images attached to the product, ordered by sortOrder.
   */
  @ApiProperty({ type: () => ProductImageResponseDto, isArray: true })
  @Type(() => ProductImageResponseDto)
  images: ProductImageResponseDto[];

  /**
   * The date and time when the product was created.
   */
  @ApiProperty()
  createdAt: Date;

  /**
   * The date and time when the product was last updated.
   */
  @ApiProperty()
  updatedAt: Date;
}

/**
 * Paginated response envelope for product lists.
 */
export class PaginatedProductResponseDto {
  /**
   * The list of products in the current page.
   */
  @ApiProperty({ type: () => ProductResponseDto, isArray: true })
  @Type(() => ProductResponseDto)
  items: ProductResponseDto[];

  /**
   * Total number of products matching the query.
   */
  @ApiProperty({ example: 120 })
  total: number;

  /**
   * Current page number (1-indexed).
   */
  @ApiProperty({ example: 1 })
  page: number;

  /**
   * Number of items per page.
   */
  @ApiProperty({ example: 20 })
  limit: number;
}
