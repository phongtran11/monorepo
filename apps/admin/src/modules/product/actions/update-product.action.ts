'use server';

import { withRevalidate } from '@admin/lib/action-utils';
import { apis } from '@admin/lib/api';
import { API_ENDPOINTS } from '@admin/lib/constants';

import { ProductSchema } from '../schemas/product.schema';
import { Product } from '../types/product.type';
import { toNullableField } from '@lam-thinh-ecommerce/shared';

export async function updateProductAction(id: string, data: ProductSchema) {
  return withRevalidate('/products', () =>
    apis.patch<Product, ProductSchema>(`${API_ENDPOINTS.PRODUCTS.BASE}/${id}`, {
      data: {
        ...data,
        compareAtPrice: toNullableField(data.compareAtPrice),
        shortDescription: toNullableField(data.shortDescription),
        description: toNullableField(data.description),
        imageIds: toNullableField(data.imageIds),
      },
    }),
  );
}
