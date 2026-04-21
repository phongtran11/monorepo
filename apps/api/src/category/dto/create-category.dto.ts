import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

/**
 * Data transfer object for creating a new category.
 */
export class CreateCategoryDto {
  /**
   * The name of the category.
   */
  @ApiProperty({
    example: 'Dầu nhớt',
    description: 'The name of the category.',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * The order in which the category is displayed.
   */
  @ApiPropertyOptional({
    example: 0,
    description: 'The order in which the category is displayed.',
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;

  /**
   * The ID of the parent category, if any.
   */
  @ApiPropertyOptional({
    example: 'uuid',
    description: 'The ID of the parent category, if any.',
  })
  @IsUUID()
  @IsOptional()
  parentId?: string | null;

  /**
   * The temporary upload ID for the category image.
   * If provided, the image will be attached to the category upon creation.
   * This ensures atomicity - either both category and image are created, or neither.
   */
  @ApiPropertyOptional({
    example: 'temp-upload-id',
    description: 'The temporary upload ID for the category image.',
  })
  @IsString()
  @IsOptional()
  imageId?: string | null;
}
