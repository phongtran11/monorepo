import { ProductStatus } from '@lam-thinh-ecommerce/shared';

/**
 * Repository-level filter contract for paginated product queries.
 * Defined here (not in dto/) so the repository layer stays independent of transport shapes.
 */
export interface ProductFilter {
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
  status?: ProductStatus;
}
