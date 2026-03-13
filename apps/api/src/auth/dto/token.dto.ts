import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object for authentication tokens.
 */
export class TokenDto {
  /**
   * The JWT access token used for accessing protected resources.
   */
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....',
    description: 'The JWT access token used for accessing protected resources.',
  })
  accessToken: string;

  /**
   * The JWT refresh token used to obtain a new access token.
   */
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....',
    description: 'The JWT refresh token used to obtain a new access token.',
  })
  refreshToken: string;
}
