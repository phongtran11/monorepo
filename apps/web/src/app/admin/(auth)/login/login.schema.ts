import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('Email không hợp lệ.').min(1, 'Email không được để trống.'),
  password: z
    .string()
    .min(1, 'Mật khẩu không được để trống.')
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
