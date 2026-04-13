import { apis } from '@admin/lib/api';
import { API_ENDPOINTS } from '@admin/lib/constants';
import {
  Category,
  flattenCategories,
} from '@admin/modules/category/types/category.type';
import { CreateProductPage } from '@admin/modules/product';

export default async function ProductCreateRoute() {
  const result = await apis.get<Category[]>(API_ENDPOINTS.CATEGORIES.BASE);
  const categories = result.success && result.data ? result.data : [];

  return <CreateProductPage categories={flattenCategories(categories)} />;
}
