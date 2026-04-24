/**
 * Supported resource types that can own images.
 * Used as the `resourceType` discriminator in the shared `images` table.
 */
export const IMAGE_RESOURCE_TYPE = {
  CATEGORY: 'category',
  PRODUCT: 'product',
} as const;

/** Union of all valid resource type strings. */
export type ImageResourceType =
  (typeof IMAGE_RESOURCE_TYPE)[keyof typeof IMAGE_RESOURCE_TYPE];

/**
 * Lifecycle status of a tracked image.
 * - pending: uploaded to Cloudinary, not yet linked to a resource
 * - permanent: verified and linked to a resource
 */
export const IMAGE_STATUS = {
  PENDING: 'pending',
  PERMANENT: 'permanent',
} as const;

/** Union of all valid image status strings. */
export type ImageStatus = (typeof IMAGE_STATUS)[keyof typeof IMAGE_STATUS];
