import {
  BulkDeleteCategoryCommand,
  CategoryResult,
  CreateCategoryCommand,
  UpdateCategoryCommand,
} from '../types';

/**
 * Port interface for cross-module access to category domain operations.
 * Inject this abstract class instead of CategoryService when crossing module boundaries.
 */
export abstract class CategoryPort {
  abstract findAllTree(): Promise<CategoryResult[]>;
  abstract findOne(id: string): Promise<CategoryResult>;
  abstract create(
    command: CreateCategoryCommand,
    userId: string,
  ): Promise<CategoryResult>;
  abstract update(
    id: string,
    command: UpdateCategoryCommand,
    userId: string,
  ): Promise<CategoryResult>;
  abstract exists(id: string): Promise<boolean>;
  abstract bulkRemove(command: BulkDeleteCategoryCommand): Promise<void>;
  abstract remove(id: string): Promise<void>;
}
