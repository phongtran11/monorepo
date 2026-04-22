import { ProductStatus } from '@lam-thinh-ecommerce/shared';

export type ProductImage = {
  id: string;
  secureUrl: string;
  sortOrder: number;
};

export type Product = {
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
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
};

export type PaginatedProducts = {
  items: Product[];
  total: number;
  page: number;
  limit: number;
};

export type ProductQuery = {
  page?: string;
  search?: string;
  status?: string;
  categoryId?: string;
};

export const PRODUCT_STATUS_CONFIG = {
  [ProductStatus.DRAFT]: {
    label: 'Nháp',
    className: 'bg-muted text-muted-foreground',
  },
  [ProductStatus.ACTIVE]: {
    label: 'Đang bán',
    className:
      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  [ProductStatus.ARCHIVED]: {
    label: 'Lưu trữ',
    className:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
} as const;
