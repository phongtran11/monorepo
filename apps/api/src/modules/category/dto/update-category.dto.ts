import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { CreateCategoryDto } from './create-category.dto';

/**
 * Data transfer object for updating an existing category.
 * Extends CreateCategoryDto with all fields optional, excluding imageId.
 * imageToAdd and imageToRemove are used for explicit image updates.
 */
export class UpdateCategoryDto extends PartialType(
  OmitType(CreateCategoryDto, ['imageId'] as const),
) {
  /**
   * The ID of the image to be added.
   */
  @ApiPropertyOptional({
    example: 'uuid',
    description: 'The ID of the image to be added.',
  })
  @IsString()
  @IsOptional()
  imageToAdd?: string;

  /**
   * The ID of the image to be removed.
   */
  @ApiPropertyOptional({
    example: 'uuid',
    description: 'The ID of the image to be removed.',
  })
  @IsString()
  @IsOptional()
  imageToRemove?: string;
}
