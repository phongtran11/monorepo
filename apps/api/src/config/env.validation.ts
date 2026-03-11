import { z } from 'zod';

export const envSchema = z.object({
  // App
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3000),

  // Database
  DATABASE_URL: z.url(),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),

  // Password Hashing
  PASSWORD_HASH_SECRET: z.string().min(32),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validate environment variables at startup.
 * Throws a detailed error if any required variable is missing or invalid.
 */
export function validate(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(`Environment validation failed:\n${formatted}`);
  }

  return result.data;
}
