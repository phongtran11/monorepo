import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

/**
 * Data transfer object for temporary upload response.
 */
@Exclude()
export class TempUploadResponseDto {
  /**
   * The temporary ID of the uploaded asset.
   */
  @ApiProperty({
    description: 'The temporary ID of the uploaded asset.',
    example: 'uuid',
  })
  @Expose()
  tempId: string;

  /**
   * The temporary URL of the uploaded asset.
   */
  @ApiProperty({
    description: 'The temporary URL of the uploaded asset.',
    example: 'https://res.cloudinary.com/...',
  })
  @Expose()
  tempUrl: string;

  /**
   * The time in seconds until the temporary upload expires.
   */
  @ApiProperty({
    description: 'The time in seconds until the temporary upload expires.',
    example: 86400,
  })
  @Expose()
  expiresIn: number;
}
