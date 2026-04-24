/**
 * Port interface for cross-module access to category domain operations.
 * Inject this abstract class instead of CategoryService when crossing module boundaries.
 */
export abstract class CategoryPort {
  abstract exists(id: string): Promise<boolean>;
}
