import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(1, 'Tên danh mục không được để trống'),
  displayOrder: z.coerce
    .number()
    .int('Thứ tự phải là số nguyên')
    .min(0, 'Thứ tự phải >= 0'),
  parentId: z.string().nullable().optional(),
  imageId: z.string().nullable().optional(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
