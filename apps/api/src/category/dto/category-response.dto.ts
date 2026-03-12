import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

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
   * The path to the category's logo.
   */
  @ApiPropertyOptional({
    example: 'categories/oil.png',
    description: "The path to the category's logo.",
    nullable: true,
  })
  @Expose()
  logoPath: string | null;

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
