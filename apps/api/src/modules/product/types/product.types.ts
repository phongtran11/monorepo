import { ProductStatus } from '@lam-thinh-ecommerce/shared';

/**
 * Domain result interface for a single product image.
 */
export interface ProductImageResult {
  id: string;
  secureUrl: string;
  sortOrder: number;
}

/**
 * Domain result interface for a single product.
 */
export interface ProductResult {
  id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string | null;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  status: ProductStatus;
  categoryId: string;
  images: ProductImageResult[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Domain result interface for paginated product queries.
 */
export interface PaginatedProductsResult {
  items: ProductResult[];
  total: number;
  page: number;
  limit: number;
}
