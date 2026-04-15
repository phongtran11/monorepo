'use client';

import {
  Category,
  flattenCategories,
} from '@admin/modules/category/types/category.type';
import { useRouter } from 'next/navigation';

import { ProductHeader } from '../components/product-header';
import { ProductTable } from '../components/product-table';
import { PaginatedProducts, Product } from '../types/product.type';

interface ProductPageProps {
  data: PaginatedProducts;
  categories: Category[];
}

export function ProductPage({ data, categories }: ProductPageProps) {
  const router = useRouter();
  const flatCategories = flattenCategories(categories);

  function handleEdit(_product: Product) {
    // TODO: navigate to /products/:id/edit
  }

  return (
    <div className="flex flex-col gap-4">
      <ProductHeader
        count={data.total}
        onCreateClick={() => router.push('/products/create')}
      />

      <ProductTable
        data={data}
        categories={flatCategories}
        onEdit={handleEdit}
      />
    </div>
  );
}
