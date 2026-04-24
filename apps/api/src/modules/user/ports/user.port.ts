import { User } from '@api/modules/user/user.entity';

/**
 * Port interface for cross-module access to user domain operations.
 * Inject this abstract class instead of UserService when crossing module boundaries.
 */
export abstract class UserPort {
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findByEmailWithDeleted(email: string): Promise<User | null>;
  abstract findById(id: string): Promise<User | null>;
  abstract create(email: string, hashedPassword: string): Promise<User>;
}
