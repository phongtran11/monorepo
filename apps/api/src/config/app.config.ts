import { registerAs } from '@nestjs/config';

/**
 * Application configuration object.
 * Contains basic app settings like environment and port.
 */
export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
}));
