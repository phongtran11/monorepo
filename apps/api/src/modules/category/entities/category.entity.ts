import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Tree,
  TreeChildren,
  TreeParent,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Entity representing a product category in the system.
 * Categories are organized in a tree structure.
 * Images are stored in the shared `images` table (resourceType='category').
 */
@Entity('categories')
@Tree('materialized-path')
export class Category {
  /**
   * Unique identifier for the category.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * The name of the category.
   */
  @Column({ type: 'varchar', length: 255 })
  name: string;

  /**
   * The unique URL-friendly slug for the category.
   */
  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  /**
   * The order in which the category is displayed.
   */
  @Column({ type: 'int', name: 'display_order', default: 0 })
  displayOrder: number;

  /**
   * The parent category of this category.
   */
  @TreeParent()
  parent: Category | null;

  /**
   * The child categories of this category.
   */
  @TreeChildren()
  children: Category[];

  /**
   * The date and time when the category was created.
   */
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  /**
   * The date and time when the category was last updated.
   */
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  /**
   * The date and time when the category was soft-deleted.
   */
  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at' })
  deletedAt: Date | null;
}
