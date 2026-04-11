import { Product } from '@api/product/entities/product.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

/**
 * Repository for product database operations.
 */
@Injectable()
export class ProductRepository extends Repository<Product> {
  /**
   * Creates an instance of the ProductRepository.
   *
   * @param dataSource - The data source for database operations.
   */
  constructor(protected dataSource: DataSource) {
    super(Product, dataSource.createEntityManager());
  }
}
