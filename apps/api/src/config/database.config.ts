import { registerAs } from '@nestjs/config';

/**
 * Database configuration object.
 * Contains the connection URL and other database-specific settings.
 */
export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
}));
