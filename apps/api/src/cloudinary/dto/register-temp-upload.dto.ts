import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

/**
 * DTO for registering a Cloudinary asset that was uploaded directly from the browser.
 */
export class RegisterTempUploadDto {
  /**
   * The public ID of the asset in Cloudinary (e.g. "temp/abc123").
   */
  @ApiProperty({
    description: 'The public ID of the asset in Cloudinary.',
    example: 'temp/abc123',
  })
  @IsString()
  @IsNotEmpty()
  publicId: string;

  /**
   * The secure URL of the uploaded asset.
   */
  @ApiProperty({
    description: 'The secure URL of the uploaded asset.',
    example: 'https://res.cloudinary.com/demo/image/upload/temp/abc123.jpg',
  })
  @IsString()
  @IsUrl()
  secureUrl: string;
}
