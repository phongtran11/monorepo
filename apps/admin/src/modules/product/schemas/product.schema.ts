import { ProductStatus } from '@lam-thinh-ecommerce/shared';
import * as z from 'zod';

export const productSchema = z.object({
  name: z
    .string()
    .min(1, 'Tên sản phẩm không được để trống')
    .max(255, 'Tên tối đa 255 ký tự'),
  sku: z
    .string()
    .min(1, 'SKU không được để trống')
    .max(100, 'SKU tối đa 100 ký tự'),
  price: z.coerce.number().min(1, 'Giá phải > 0'),
  compareAtPrice: z.coerce.number().min(0).nullable().optional(),
  stock: z.coerce.number().int().min(0, 'Tồn kho phải >= 0').optional(),
  status: z.enum([
    ProductStatus.DRAFT,
    ProductStatus.ACTIVE,
    ProductStatus.ARCHIVED,
  ]),
  categoryId: z.string().min(1, 'Vui lòng chọn danh mục'),
  shortDescription: z.string().max(500, 'Tối đa 500 ký tự').optional(),
  description: z.string().optional(),
  imageIds: z.array(z.string()).optional(),
});

export type ProductSchema = z.infer<typeof productSchema>;
