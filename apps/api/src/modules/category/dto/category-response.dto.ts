import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';

/**
 * Data transfer object for a category image in responses.
 */
@Exclude()
export class CategoryImageResponseDto {
  /**
   * The database ID of the image record.
   * Use this as the imageId when submitting edit forms.
   */
  @ApiProperty({ example: 'uuid' })
  @Expose()
  id: string;

  /**
   * The Cloudinary secure URL for displaying the image.
   */
  @ApiProperty({
    example:
      'https://res.cloudinary.com/demo/image/upload/v1/uploads/sample.jpg',
  })
  @Expose()
  secureUrl: string;
}

/**
 * Data transfer object for category response.
 */
@Exclude()
export class CategoryResponseDto {
  /**
   * The unique identifier of the category.
   */
  @ApiProperty({
    example: 'uuid',
    description: 'The unique identifier of the category.',
  })
  @Expose()
  id: string;

  /**
   * The name of the category.
   */
  @ApiProperty({
    example: 'Dầu nhớt',
    description: 'The name of the category.',
  })
  @Expose()
  name: string;

  /**
   * The unique slug of the category.
   */
  @ApiProperty({
    example: 'dau-nhot',
    description: 'The unique slug of the category.',
  })
  @Expose()
  slug: string;

  /**
   * The order in which the category is displayed.
   */
  @ApiProperty({
    example: 0,
    description: 'The order in which the category is displayed.',
  })
  @Expose()
  displayOrder: number;

  /**
   * The image attached to this category, if any.
   */
  @ApiPropertyOptional({
    type: () => CategoryImageResponseDto,
    description: 'The image attached to this category.',
  })
  @Expose()
  @Type(() => CategoryImageResponseDto)
  image?: CategoryImageResponseDto | null;

  /**
   * The children of this category.
   */
  @ApiPropertyOptional({
    type: () => CategoryResponseDto,
    isArray: true,
    description: 'The children of this category.',
  })
  @Expose()
  children?: CategoryResponseDto[];

  /**
   * The date and time when the category was created.
   */
  @ApiProperty({
    description: 'The date and time when the category was created.',
  })
  @Expose()
  createdAt: Date;

  /**
   * The date and time when the category was last updated.
   */
  @ApiProperty({
    description: 'The date and time when the category was last updated.',
  })
  @Expose()
  updatedAt: Date;
}
