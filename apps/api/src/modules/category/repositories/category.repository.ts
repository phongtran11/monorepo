import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, TreeRepository } from 'typeorm';

import { Category } from '../entities/category.entity';

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
    return this.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });
  }

  /**
   * Finds a category by ID with its parent loaded for update flows.
   */
  findByIdForUpdateInTransaction(
    id: string,
    manager: EntityManager,
  ): Promise<Category | null> {
    return manager.getTreeRepository(Category).findOne({
      where: { id },
      relations: { parent: true },
    });
  }

  /**
   * Finds a category by slug, including soft-deleted records.
   */
  findBySlugForUpdateInTransaction(
    slug: string,
    manager: EntityManager,
  ): Promise<Category | null> {
    return manager.getTreeRepository(Category).findOne({
      select: { id: true },
      where: { slug },
      withDeleted: true,
    });
  }

  /**
   * Finds a category by ID using the active transaction manager when provided.
   */
  findByIdInTransaction(
    id: string,
    manager: EntityManager,
  ): Promise<Category | null> {
    return manager.getTreeRepository(Category).findOne({ where: { id } });
  }

  /**
   * Finds descendants for a category using the active transaction manager.
   */
  findDescendantsInTransaction(
    category: Category,
    manager: EntityManager,
  ): Promise<Category[]> {
    return manager.getTreeRepository(Category).findDescendants(category);
  }

  /**
   * Saves a category within a transaction.
   */
  saveInTransaction(
    category: Category,
    manager: EntityManager,
  ): Promise<Category> {
    return manager.getTreeRepository(Category).save(category);
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
