import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import {
  IMAGE_STATUS,
  ImageResourceType,
  type ImageStatus,
} from '../constants';

/**
 * Shared entity that tracks every Cloudinary image across all resource types.
 * Replaces both the `product_images` table and the embedded image columns on `categories`.
 */
@Entity('images')
export class Image {
  /** Unique identifier for the image record. */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** The ID of the user who uploaded the image. */
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  /**
   * The Cloudinary public ID of the asset (e.g., "uploads/abc123").
   * Used to delete the asset via the Cloudinary API.
   */
  @Index()
  @Column({ type: 'varchar', length: 500, name: 'public_id' })
  publicId: string;

  /**
   * The Cloudinary secure URL for displaying the image.
   */
  @Column({ type: 'varchar', length: 1000, name: 'secure_url' })
  secureUrl: string;

  /**
   * Current lifecycle status of the image.
   * - pending: uploaded, awaiting form submission
   * - permanent: linked to a resource
   */
  @Column({ type: 'varchar', length: 20, default: IMAGE_STATUS.PENDING })
  status: ImageStatus;

  /**
   * The type of resource this image belongs to.
   * Examples: 'product', 'category'. Null until linked.
   */
  @Column({
    type: 'varchar',
    length: 50,
    name: 'resource_type',
    nullable: true,
  })
  resourceType: ImageResourceType | null;

  /**
   * The ID of the resource this image is linked to.
   * Null until the owning resource is created/updated.
   */
  @Column({ type: 'uuid', name: 'resource_id', nullable: true })
  resourceId: string | null;

  /**
   * Display order within a resource's image gallery.
   * 0 = primary image. For single-image resources (e.g., category), always 0.
   */
  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sortOrder: number;

  /** Timestamp when the image record was created. */
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  /** Timestamp when the image record was last updated. */
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  /** Soft-delete timestamp. */
  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at' })
  deletedAt: Date | null;
}
