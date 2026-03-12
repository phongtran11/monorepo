import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { User } from './user.entity';

/**
 * Repository for user database operations.
 */
@Injectable()
export class UserRepository extends Repository<User> {
  /**
   * Creates an instance of the UserRepository.
   *
   * @param dataSource - The data source for database operations.
   */
  constructor(protected dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }
}
