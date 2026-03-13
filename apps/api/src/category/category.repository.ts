import { Injectable } from '@nestjs/common';
import { DataSource, TreeRepository } from 'typeorm';

import { Category } from './category.entity';

/**
 * Repository for category database operations, specializing in tree structures.
 */
@Injectable()
export class CategoryRepository extends TreeRepository<Category> {
  /**
   * Creates an instance of the CategoryRepository.
   *
   * @param dataSource - The data source for database operations.
   */
  constructor(private dataSource: DataSource) {
    super(Category, dataSource.createEntityManager());
  }
}
