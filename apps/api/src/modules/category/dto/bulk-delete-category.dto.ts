import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

/**
 * Data transfer object for bulk deleting categories.
 */
export class BulkDeleteCategoryDto {
  /**
   * The list of category IDs to delete.
   */
  @ApiProperty({
    example: ['uuid-1', 'uuid-2'],
    description: 'The list of category IDs to delete.',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  ids: string[];
}
