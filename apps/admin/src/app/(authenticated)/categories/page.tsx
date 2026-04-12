import { apis } from '@admin/lib/api';
import { API_ENDPOINTS, COOKIES } from '@admin/lib/constants';
import { CategoryPage } from '@admin/modules/category';
import { Category } from '@admin/modules/category/types/category.type';
import { decodeJwtPayload } from '@admin/proxy/jwt';
import { Permission, RolePermissionsMap } from '@lam-thinh-ecommerce/shared';
import { cookies } from 'next/headers';

export default async function CategoriesRoute() {
  const [result, cookieStore] = await Promise.all([
    apis.get<Category[]>(API_ENDPOINTS.CATEGORIES.BASE),
    cookies(),
  ]);

  const categories = result.success && result.data ? result.data : [];

  const accessToken = cookieStore.get(COOKIES.ACCESS_TOKEN)?.value;
  const payload = accessToken ? decodeJwtPayload(accessToken) : null;
  const permissions: Permission[] = payload
    ? RolePermissionsMap[payload.role]
    : [];

  return (
    <CategoryPage
      categories={categories}
      canCreate={permissions.includes(Permission.CREATE_CATEGORY)}
      canUpdate={permissions.includes(Permission.UPDATE_CATEGORY)}
      canDelete={permissions.includes(Permission.DELETE_CATEGORY)}
    />
  );
}
