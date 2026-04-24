/**
 * Port interface for cross-module access to product domain operations.
 * Inject this abstract class instead of ProductService when crossing module boundaries.
 */
export abstract class ProductPort {
  abstract hasProductsInCategories(categoryIds: string[]): Promise<boolean>;
}
