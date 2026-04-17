import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

/**
 * Data transfer object for bulk deleting products.
 */
export class BulkDeleteProductDto {
  /**
   * The list of product IDs to delete.
   */
  @ApiProperty({
    example: ['uuid-1', 'uuid-2'],
    description: 'The list of product IDs to delete.',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  ids: string[];
}
