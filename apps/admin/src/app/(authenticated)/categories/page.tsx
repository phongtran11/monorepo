import { apis } from '@admin/lib/api';
import { API_ENDPOINTS } from '@admin/lib/constants';
import { CategoryPage } from '@admin/modules/category';
import { Category } from '@admin/modules/category/types/category.type';

export default async function CategoriesRoute() {
  const result = await apis.get<Category[]>(API_ENDPOINTS.CATEGORIES.BASE);
  const categories = result.success && result.data ? result.data : [];

  return <CategoryPage categories={categories} />;
}
