import { registerAs } from '@nestjs/config';

export const DATABASE_CONFIG_TOKEN = 'database';

/**
 * Database configuration object.
 * Contains the connection URL and other database-specific settings.
 */
export const databaseConfig = registerAs(DATABASE_CONFIG_TOKEN, () => ({
  url: process.env.DATABASE_URL!,
}));

export type DatabaseConfig = ReturnType<typeof databaseConfig>;
