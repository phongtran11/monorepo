/**
 * Lifecycle status of a product.
 */
export const ProductStatus = {
  /** Not yet published, only visible in admin dashboard. */
  DRAFT: 'draft',
  /** Published and visible to customers. */
  ACTIVE: 'active',
  /** Hidden from customers, retained for history. */
  ARCHIVED: 'archived',
} as const;

/**
 * Type representing the available product statuses.
 */
export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];
