'use server';

import { withRevalidate } from '@admin/lib/action-utils';
import { apis } from '@admin/lib/api';
import { API_ENDPOINTS } from '@admin/lib/constants';

import { ProductSchema } from '../schemas/product.schema';
import { Product } from '../types/product.type';

export async function createProductAction(data: ProductSchema) {
  return withRevalidate('products', () =>
    apis.post<Product, ProductSchema>(API_ENDPOINTS.PRODUCTS.CREATE, {
      data,
    }),
  );
}
