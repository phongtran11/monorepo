import { Category } from '@api/category/entities/category.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Entity representing an image associated with a category.
 */
@Entity('category_images')
export class CategoryImage {
  /**
   * Unique identifier for the category image.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * The secure URL of the image.
   */
  @Column({ type: 'varchar', length: 255 })
  url: string;

  /**
   * The public ID of the image in the storage service.
   */
  @Column({ type: 'varchar', length: 255, name: 'public_id' })
  publicId: string;

  /**
   * The format of the image (e.g., 'jpg', 'png').
   */
  @Column({ type: 'varchar', length: 10 })
  format: string;

  /**
   * The size of the image in bytes.
   */
  @Column({ type: 'int' })
  bytes: number;

  /**
   * The width of the image in pixels.
   */
  @Column({ type: 'int', nullable: true })
  width: number | null;

  /**
   * The height of the image in pixels.
   */
  @Column({ type: 'int', nullable: true })
  height: number | null;

  /**
   * The category this image is associated with.
   */
  @ManyToOne(() => Category, (category) => category.images, {
    onDelete: 'CASCADE',
  })
  category: Category;

  /**
   * The date and time when the image record was created.
   */
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
