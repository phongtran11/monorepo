import { registerAs } from '@nestjs/config';

export const APP_CONFIG_TOKEN = 'app';

/**
 * Application configuration object.
 * Contains basic app settings like environment and port.
 */
export const appConfig = registerAs(APP_CONFIG_TOKEN, () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
}));

export type AppConfig = ReturnType<typeof appConfig>;
