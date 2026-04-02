import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

/**
 * Data transfer object for Cloudinary upload response.
 */
@Exclude()
export class UploadResponseDto {
  /**
   * The public ID of the uploaded image on Cloudinary.
   */
  @ApiProperty({
    description: 'The public ID of the uploaded image on Cloudinary.',
    example: 'uploads/abc123xyz',
  })
  @Expose()
  publicId: string;

  /**
   * The secure HTTPS URL for accessing the uploaded image.
   */
  @ApiProperty({
    description: 'The secure HTTPS URL for accessing the uploaded image.',
    example: 'https://res.cloudinary.com/.../image/upload/...',
  })
  @Expose()
  url: string;

  /**
   * The width of the uploaded image in pixels.
   */
  @ApiProperty({
    description: 'The width of the uploaded image in pixels.',
    example: 1920,
  })
  @Expose()
  width: number;

  /**
   * The height of the uploaded image in pixels.
   */
  @ApiProperty({
    description: 'The height of the uploaded image in pixels.',
    example: 1080,
  })
  @Expose()
  height: number;

  /**
   * The format of the uploaded image (e.g., jpg, png).
   */
  @ApiProperty({
    description: 'The format of the uploaded image (e.g., jpg, png).',
    example: 'jpg',
  })
  @Expose()
  format: string;
}
