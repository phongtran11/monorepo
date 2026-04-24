import { Injectable } from '@nestjs/common';

import { User } from './user.entity';
import { UserRepository } from './user.repository';

/**
 * Service for managing users.
 */
@Injectable()
export class UserService {
  /**
   * Creates an instance of the UserService.
   *
   * @param userRepository - The repository for user database operations.
   */
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Finds a user by email.
   *
   * @param email - The email of the user to find.
   * @returns The user if found, null otherwise.
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  /**
   * Finds a user by email with deleted_at not null.
   *
   * @param email - The email of the user to find.
   * @returns The user if found, null otherwise.
   */
  async findByEmailWithDeleted(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      withDeleted: true,
    });
  }

  /**
   * Finds a user by ID.
   *
   * @param id - The ID of the user to find.
   * @returns The user if found, null otherwise.
   */
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  /**
   * Creates a new user.
   *
   * @param email - The email for the new user.
   * @param hashedPassword - The hashed password for the new user.
   * @returns The newly created user.
   */
  async create(email: string, hashedPassword: string): Promise<User> {
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
    });

    return this.userRepository.save(user);
  }
}
