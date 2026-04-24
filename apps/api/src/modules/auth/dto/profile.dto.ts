import { AccountStatus, Role } from '@lam-thinh-ecommerce/shared';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object for user profile information.
 */
export class ProfileDto {
  /**
   * User's unique identifier.
   */
  @ApiProperty({
    example: 'a81bc81b-dead...',
    description: "User's unique identifier.",
  })
  id: string;

  /**
   * User's email address.
   */
  @ApiProperty({
    example: 'user@example.com',
    description: "User's email address.",
  })
  email: string;

  /**
   * User's assigned role.
   */
  @ApiProperty({
    example: 1,
    description: "User's assigned role.",
  })
  role: Role;

  /**
   * User's account status.
   */
  @ApiProperty({
    example: 1,
    description: "User's account status.",
  })
  status: AccountStatus;
}
