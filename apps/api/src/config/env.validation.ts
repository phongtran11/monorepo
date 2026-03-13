import { z } from 'zod';

/**
 * Zod schema for environment variable validation.
 */
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

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),
  CLOUDINARY_DEFAULT_FOLDER: z.string().default('uploads'),
});

/**
 * Type inferred from the environment schema.
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Validate environment variables at startup.
 * Throws a detailed error if any required variable is missing or invalid.
 *
 * @param config A record of environment variables to validate.
 * @returns The validated and typed environment configuration.
 * @throws {Error} Detailed error message if validation fails.
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
