import { ApiProperty } from '@nestjs/swagger';

/**
 * Data transfer object for image registration responses.
 */
export class ImageResponseDto {
  /**
   * The database ID of the registered image record.
   * Use this as the imageId when submitting forms.
   */
  @ApiProperty({
    description: 'The database ID of the registered image record.',
    example: 'uuid',
  })
  id: string;

  /**
   * The Cloudinary secure URL for displaying the image preview.
   */
  @ApiProperty({
    description: 'The Cloudinary secure URL for displaying the image.',
    example: 'https://res.cloudinary.com/demo/image/upload/v1/uploads/abc123',
  })
  secureUrl: string;

  /**
   * Display sort order within a resource's image gallery.
   */
  @ApiProperty({
    description: 'Display sort order (0 = primary image).',
    example: 0,
  })
  sortOrder: number;
}
