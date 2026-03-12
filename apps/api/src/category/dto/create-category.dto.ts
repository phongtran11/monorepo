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
   * The path to the category's logo.
   */
  @ApiPropertyOptional({
    example: 'categories/oil.png',
    description: "The path to the category's logo.",
    nullable: true,
  })
  @IsString()
  @IsOptional()
  logoPath?: string | null;

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
  parentId?: string;
}
