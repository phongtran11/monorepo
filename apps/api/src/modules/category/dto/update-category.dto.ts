import { PartialType } from '@nestjs/swagger';

import { CreateCategoryDto } from './create-category.dto';

/**
 * Data transfer object for updating an existing category.
 * Extends CreateCategoryDto with all fields optional.
 * imageId may be null to remove the current image.
 */
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
