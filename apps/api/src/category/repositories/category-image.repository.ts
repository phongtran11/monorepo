import { CategoryImage } from '@api/category/entities/category-image.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

/**
 * Repository for category image database operations.
 */
@Injectable()
export class CategoryImageRepository extends Repository<CategoryImage> {
  /**
   * Creates an instance of the CategoryImageRepository.
   *
   * @param dataSource - The data source for database operations.
   */
  constructor(protected dataSource: DataSource) {
    super(CategoryImage, dataSource.createEntityManager());
  }
}
