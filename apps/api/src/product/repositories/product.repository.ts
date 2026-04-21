import { Product } from '@api/product/entities/product.entity';
import { ProductFilter } from '@api/product/interfaces';
import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';

/**
 * Repository for product database operations.
 */
@Injectable()
export class ProductRepository extends Repository<Product> {
  constructor(protected dataSource: DataSource) {
    super(Product, dataSource.createEntityManager());
  }

  /**
   * Finds a product by ID with the category relation loaded.
   */
  findById(id: string): Promise<Product | null> {
    return this.findOne({ where: { id }, relations: ['category'] });
  }

  /**
   * Finds multiple products by IDs.
   */
  findByIds(ids: string[]): Promise<Product[]> {
    return this.findBy({ id: In(ids) });
  }

  /**
   * Finds a product by slug, including soft-deleted records.
   */
  findBySlug(slug: string): Promise<Product | null> {
    return this.findOne({ where: { slug }, withDeleted: true });
  }

  /**
   * Finds a product by SKU, including soft-deleted records.
   */
  findBySku(sku: string): Promise<Product | null> {
    return this.findOne({ where: { sku }, withDeleted: true });
  }

  /**
   * Returns a paginated, filtered list of products with a total count.
   */
  findPaginated(filter: ProductFilter): Promise<[Product[], number]> {
    const { page, limit, categoryId, status, search } = filter;

    const qb = this.createQueryBuilder('product')
      .orderBy('product.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (categoryId) {
      qb.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    if (status) {
      qb.andWhere('product.status = :status', { status });
    }

    if (search) {
      qb.andWhere('(product.name ILIKE :search OR product.sku ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    return qb.getManyAndCount();
  }
}
