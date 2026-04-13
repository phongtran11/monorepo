'use server';

import { apis } from '@admin/lib/api';
import { API_ENDPOINTS } from '@admin/lib/constants';
import { revalidatePath } from 'next/cache';

import { ProductSchema } from '../schemas/product.schema';
import { Product } from '../types/product.type';

export async function createProductAction(data: ProductSchema) {
  const result = await apis.post<Product, object>(API_ENDPOINTS.PRODUCTS.BASE, {
    data: {
      name: data.name,
      sku: data.sku,
      price: data.price,
      compareAtPrice: data.compareAtPrice ?? null,
      stock: data.stock ?? 0,
      status: data.status,
      categoryId: data.categoryId,
      shortDescription: data.shortDescription || undefined,
      description: data.description || undefined,
      imageIds: data.imageId ? [data.imageId] : [],
    },
  });

  if (result.success) {
    revalidatePath('/products');
  }

  return result;
}
