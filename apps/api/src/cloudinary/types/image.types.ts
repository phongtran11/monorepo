/**
 * Domain result interface for a registered image.
 */
export interface ImageResult {
  id: string;
  publicId: string;
  secureUrl: string;
  sortOrder: number;
  resourceId: string | null;
}
