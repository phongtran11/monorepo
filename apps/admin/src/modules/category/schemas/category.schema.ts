import * as z from 'zod';

export const categorySchema = z.object({
  name: z.string().min(1, 'Tên danh mục không được để trống'),
  displayOrder: z.coerce.number().int().min(0).optional(),
  parentId: z.string().optional(),
  imageId: z.string().optional(),
});

export type CategorySchema = z.infer<typeof categorySchema>;
