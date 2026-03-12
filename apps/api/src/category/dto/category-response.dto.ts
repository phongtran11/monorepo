import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Data transfer object for category response.
 */
export class CategoryResponseDto {
  /**
   * The unique identifier of the category.
   */
  @ApiProperty({
    example: 'uuid',
    description: 'The unique identifier of the category.',
  })
  id: string;

  /**
   * The name of the category.
   */
  @ApiProperty({
    example: 'Dầu nhớt',
    description: 'The name of the category.',
  })
  name: string;

  /**
   * The unique slug of the category.
   */
  @ApiProperty({
    example: 'dau-nhot',
    description: 'The unique slug of the category.',
  })
  slug: string;

  /**
   * The path to the category's logo.
   */
  @ApiPropertyOptional({
    example: 'categories/oil.png',
    description: "The path to the category's logo.",
  })
  logoPath?: string;

  /**
   * The order in which the category is displayed.
   */
  @ApiProperty({
    example: 0,
    description: 'The order in which the category is displayed.',
  })
  displayOrder: number;

  /**
   * The children of this category.
   */
  @ApiPropertyOptional({
    type: () => CategoryResponseDto,
    isArray: true,
    description: 'The children of this category.',
  })
  children?: CategoryResponseDto[];

  /**
   * The date and time when the category was created.
   */
  @ApiProperty({
    description: 'The date and time when the category was created.',
  })
  createdAt: Date;

  /**
   * The date and time when the category was last updated.
   */
  @ApiProperty({
    description: 'The date and time when the category was last updated.',
  })
  updatedAt: Date;
}
