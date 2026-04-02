import { CreateCategoryDto } from '@api/category/dto/create-category.dto';
import { PartialType } from '@nestjs/swagger';

/**
 * Data transfer object for updating an existing category.
 */
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
