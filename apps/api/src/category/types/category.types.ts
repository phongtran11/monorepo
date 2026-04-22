/**
 * Domain interface representing a category image.
 * Returned by the service layer — free of HTTP/Swagger decorators.
 */
export interface CategoryImageResult {
  id: string;
  secureUrl: string;
}

/**
 * Domain interface representing a single category with its image.
 * Returned by the service layer — free of HTTP/Swagger decorators.
 */
export interface CategoryResult {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
  image: CategoryImageResult | null;
  children?: CategoryResult[];
  createdAt: Date;
  updatedAt: Date;
}
