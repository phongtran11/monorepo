import { apis } from '@admin/lib/api';
import { API_ENDPOINTS } from '@admin/lib/constants';
import { Category } from '@admin/modules/category/types/category.type';
import { ProductPage } from '@admin/modules/product';
import {
  PaginatedProducts,
  ProductQuery,
} from '@admin/modules/product/types/product.type';

interface ProductsRouteProps {
  searchParams: Promise<ProductQuery>;
}

export default async function ProductsRoute({
  searchParams,
}: ProductsRouteProps) {
  const params = await searchParams;

  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page);
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  if (params.categoryId) query.set('categoryId', params.categoryId);

  const endpoint = query.toString()
    ? `${API_ENDPOINTS.PRODUCTS.BASE}?${query.toString()}`
    : API_ENDPOINTS.PRODUCTS.BASE;

  const [productsResult, categoriesResult] = await Promise.all([
    apis.get<PaginatedProducts>(endpoint),
    apis.get<Category[]>(API_ENDPOINTS.CATEGORIES.BASE),
  ]);

  const data: PaginatedProducts =
    productsResult.success && productsResult.data
      ? productsResult.data
      : { items: [], total: 0, page: 1, limit: 20 };

  const categories =
    categoriesResult.success && categoriesResult.data
      ? categoriesResult.data
      : [];

  return <ProductPage data={data} categories={categories} />;
}
