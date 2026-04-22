import { ApiProperty } from '@nestjs/swagger';

/**
 * Data transfer object for upload signature responses.
 */
export class UploadSignatureResponseDto {
  /**
   * The Cloudinary cloud name.
   */
  @ApiProperty({
    description: 'The Cloudinary cloud name.',
    example: 'my-cloud',
  })
  cloudName: string;

  /**
   * The HMAC-SHA1 signature covering folder and timestamp.
   */
  @ApiProperty({
    description: 'HMAC-SHA1 signature covering folder and timestamp.',
    example: 'abc123def456',
  })
  signature: string;

  /**
   * Unix timestamp used when the signature was generated. Expires after 1 hour.
   */
  @ApiProperty({
    description: 'Unix timestamp used when the signature was generated.',
    example: 1714000000,
  })
  timestamp: number;

  /**
   * The Cloudinary API key.
   */
  @ApiProperty({
    description: 'The Cloudinary API key.',
    example: '123456789012345',
  })
  apiKey: string;

  /**
   * The target upload folder in Cloudinary.
   */
  @ApiProperty({
    description: 'The target upload folder in Cloudinary.',
    example: 'uploads',
  })
  folder: string;
}
