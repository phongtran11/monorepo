import { apis } from '@admin/lib/api';
import { API_ENDPOINTS, COOKIES } from '@admin/lib/constants';
import { Category } from '@admin/modules/category/types/category.type';
import { ProductPage } from '@admin/modules/product';
import {
  PaginatedProducts,
  ProductQuery,
} from '@admin/modules/product/types/product.type';
import { decodeJwtPayload } from '@admin/proxy/jwt';
import { Permission, RolePermissionsMap } from '@lam-thinh-ecommerce/shared';
import { cookies } from 'next/headers';

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

  const [productsResult, categoriesResult, cookieStore] = await Promise.all([
    apis.get<PaginatedProducts>(endpoint),
    apis.get<Category[]>(API_ENDPOINTS.CATEGORIES.BASE),
    cookies(),
  ]);

  const data: PaginatedProducts =
    productsResult.success && productsResult.data
      ? productsResult.data
      : { items: [], total: 0, page: 1, limit: 20 };

  const categories =
    categoriesResult.success && categoriesResult.data
      ? categoriesResult.data
      : [];

  const accessToken = cookieStore.get(COOKIES.ACCESS_TOKEN)?.value;
  const payload = accessToken ? decodeJwtPayload(accessToken) : null;
  const permissions: Permission[] = payload
    ? RolePermissionsMap[payload.role]
    : [];

  return (
    <ProductPage
      data={data}
      categories={categories}
      canCreate={permissions.includes(Permission.CREATE_PRODUCT)}
      canUpdate={permissions.includes(Permission.UPDATE_PRODUCT)}
      canDelete={permissions.includes(Permission.DELETE_PRODUCT)}
    />
  );
}
