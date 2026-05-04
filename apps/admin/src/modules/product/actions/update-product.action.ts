'use server';

import { withRevalidate } from '@admin/lib/action-utils';
import { apis } from '@admin/lib/api';
import { API_ENDPOINTS } from '@admin/lib/constants';
import { generatePath } from '@admin/lib/routes';

import { ProductSchema } from '../schemas/product.schema';
import { Product } from '../types/product.type';

export async function updateProductAction(id: string, data: ProductSchema) {
  return withRevalidate('/products', () =>
    apis.patch<Product, ProductSchema>(
      generatePath(API_ENDPOINTS.PRODUCTS.UPDATE, { id }),
      {
        data,
      },
    ),
  );
}
