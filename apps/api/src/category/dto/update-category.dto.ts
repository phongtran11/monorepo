import { PartialType } from '@nestjs/swagger';

import { CreateCategoryDto } from './create-category.dto';

/**
 * Data transfer object for updating an existing category.
 */
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
