import { Category } from '@api/category/entities/category.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, TreeRepository } from 'typeorm';

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
