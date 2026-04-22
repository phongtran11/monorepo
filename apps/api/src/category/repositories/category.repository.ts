import { Category } from '@api/category/entities/category.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, TreeRepository } from 'typeorm';

/**
 * Repository for category database operations, specializing in tree structures.
 */
@Injectable()
export class CategoryRepository extends TreeRepository<Category> {
  constructor(private dataSource: DataSource) {
    super(Category, dataSource.createEntityManager());
  }

  /**
   * Finds a category by slug, including soft-deleted records.
   */
  findBySlug(slug: string): Promise<Category | null> {
    return this.findOne({ where: { slug }, withDeleted: true });
  }

  /**
   * Finds a category by ID with parent and children relations loaded.
   */
  findById(id: string): Promise<Category | null> {
    return this.findOne({ where: { id }, relations: ['parent', 'children'] });
  }

  /**
   * Finds multiple categories by IDs with children relation loaded.
   */
  findByIds(ids: string[]): Promise<Category[]> {
    return this.find({
      where: ids.map((id) => ({ id })),
      relations: ['children'],
    });
  }
}
