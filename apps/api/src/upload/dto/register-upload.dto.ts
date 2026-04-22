import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

/**
 * Data transfer object for registering a newly uploaded Cloudinary asset.
 */
export class RegisterUploadDto {
  /**
   * The Cloudinary public ID returned by the direct browser upload.
   */
  @ApiProperty({
    description: 'The Cloudinary public ID of the uploaded asset.',
    example: 'uploads/abc123',
  })
  @IsString()
  @IsNotEmpty()
  publicId: string;

  /**
   * The Cloudinary secure URL returned by the direct browser upload.
   */
  @ApiProperty({
    description: 'The Cloudinary secure URL of the uploaded asset.',
    example: 'https://res.cloudinary.com/demo/image/upload/v1/uploads/abc123',
  })
  @IsString()
  @IsUrl()
  secureUrl: string;
}
