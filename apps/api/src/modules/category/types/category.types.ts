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

/**
 * Command object for creating a new category.
 * Free of HTTP/Swagger/validation decorators — pure domain input.
 */
export interface CreateCategoryCommand {
  name: string;
  displayOrder?: number;
  parentId?: string | null;
  imageId?: string | null;
}

/**
 * Command object for updating an existing category.
 * All fields are optional — only provided fields are applied.
 */
export interface UpdateCategoryCommand {
  name?: string;
  displayOrder?: number;
  parentId?: string | null;
  imageId?: string | null;
}

/**
 * Command object for bulk-deleting categories.
 */
export interface BulkDeleteCategoryCommand {
  ids: string[];
}
