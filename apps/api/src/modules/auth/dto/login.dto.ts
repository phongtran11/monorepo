import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MinLength } from 'class-validator';

import { ProfileDto } from './profile.dto';
import { TokenDto } from './token.dto';

/**
 * Data Transfer Object for user login.
 */
export class LoginDto {
  /**
   * User's email address.
   */
  @ApiProperty({
    example: 'user@example.com',
    description: "User's email address.",
  })
  @IsEmail()
  email: string;

  /**
   * User's password (minimum 8 characters).
   */
  @ApiProperty({
    example: 'password123',
    description: "User's password (minimum 8 characters).",
  })
  @MinLength(8)
  password: string;
}

export class LoginResponseDto extends TokenDto {
  /**
   * The authenticated user's profile information.
   */
  @ApiProperty({
    description: 'The authenticated user profile information.',
    type: ProfileDto,
  })
  user: ProfileDto;
}
