import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MinLength } from 'class-validator';

/**
 * Data Transfer Object for user registration.
 */
export class RegisterDto {
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
   * User's chosen password (minimum 8 characters).
   */
  @ApiProperty({
    example: 'password123',
    minLength: 8,
    description: "User's chosen password (minimum 8 characters).",
  })
  @MinLength(8)
  password: string;
}
