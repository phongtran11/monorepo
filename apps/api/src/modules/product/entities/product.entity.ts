import { Category } from '@api/modules/category/entities/category.entity';
import { ProductStatus } from '@lam-thinh-ecommerce/shared';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Entity representing a product in the catalog.
 * Images are stored in the shared `images` table (resourceType='product').
 */
@Entity('products')
export class Product {
  /**
   * Unique identifier for the product.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * The display name of the product.
   */
  @Column({ type: 'varchar', length: 255 })
  name: string;

  /**
   * URL-friendly slug, unique across all products.
   */
  @Index()
  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  /**
   * Stock keeping unit — unique business identifier for the product.
   */
  @Index()
  @Column({ type: 'varchar', length: 100, unique: true })
  sku: string;

  /**
   * Short description, used for product cards and list views.
   */
  @Column({
    type: 'varchar',
    length: 500,
    name: 'short_description',
    nullable: true,
  })
  shortDescription: string | null;

  /**
   * Full product description, supports rich text/HTML.
   */
  @Column({ type: 'text', nullable: true })
  description: string | null;

  /**
   * Selling price in the smallest currency unit's denomination.
   */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  price: number;

  /**
   * Optional compare-at price used to show a strikethrough original price.
   */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'compare_at_price',
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) =>
        value === null ? null : parseFloat(value),
    },
  })
  compareAtPrice: number | null;

  /**
   * Current stock on hand.
   */
  @Column({ type: 'int', default: 0 })
  stock: number;

  /**
   * Lifecycle status of the product.
   */
  @Column({
    type: 'varchar',
    length: 20,
    default: ProductStatus.DRAFT,
  })
  status: ProductStatus;

  /**
   * The category this product belongs to.
   */
  @ManyToOne(() => Category, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  /**
   * Denormalized category id for querying/filtering.
   */
  @Column({ type: 'uuid', name: 'category_id' })
  categoryId: string;

  /**
   * The date and time when the product was created.
   */
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  /**
   * The date and time when the product was last updated.
   */
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  /**
   * The date and time when the product was soft-deleted.
   */
  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at' })
  deletedAt: Date | null;
}
