import { Product } from '@api/product/entities/product.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Entity representing an image attached to a product.
 */
@Entity('product_images')
export class ProductImage {
  /**
   * Unique identifier for the product image.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * The secure Cloudinary URL of the image.
   */
  @Column({ type: 'varchar', length: 500, name: 'image_url' })
  imageUrl: string;

  /**
   * The public ID of the image in Cloudinary.
   */
  @Column({ type: 'varchar', length: 255, name: 'image_public_id' })
  imagePublicId: string;

  /**
   * The display order of the image within a product's gallery.
   * Lower values appear first; the image with sortOrder = 0 is treated as primary.
   */
  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sortOrder: number;

  /**
   * The product this image belongs to.
   */
  @ManyToOne(() => Product, (product) => product.images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  /**
   * Denormalized product id.
   */
  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  /**
   * The date and time when the product image was created.
   */
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
