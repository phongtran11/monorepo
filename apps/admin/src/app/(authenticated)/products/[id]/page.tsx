import { apis } from '@admin/lib/api';
import { API_ENDPOINTS } from '@admin/lib/constants';
import {
  Category,
  flattenCategories,
} from '@admin/modules/category/types/category.type';
import { DetailProductPage } from '@admin/modules/product';
import { Product } from '@admin/modules/product/types/product.type';
import { redirect } from 'next/navigation';

interface ProductDetailRouteProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailRoute({
  params,
}: ProductDetailRouteProps) {
  const { id } = await params;

  const [productResult, categoriesResult] = await Promise.all([
    apis.get<Product>(`${API_ENDPOINTS.PRODUCTS.BASE}/${id}`),
    apis.get<Category[]>(API_ENDPOINTS.CATEGORIES.BASE),
  ]);

  if (!productResult.success || !productResult.data) {
    redirect('/products');
  }

  const categories =
    categoriesResult.success && categoriesResult.data
      ? categoriesResult.data
      : [];

  return (
    <DetailProductPage
      product={productResult.data}
      categories={flattenCategories(categories)}
    />
  );
}
