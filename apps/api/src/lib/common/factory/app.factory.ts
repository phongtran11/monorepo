import { APP_CONFIG_TOKEN, AppConfig } from '@api/config';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import compression from 'compression';
import { Logger } from 'nestjs-pino';

import { HttpExceptionFilter } from '../filter';

/**
 * Configures a NestJS application with standard global middleware, pipes, filters, and settings.
 *
 * @param app The NestJS application instance to bootstrap.
 * @returns
 */
export function bootstrapApp(app: INestApplication) {
  // Global prefix
  app.setGlobalPrefix('api');

  // URI versioning (default v1)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      skipMissingProperties: false,
    }),
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Compression
  app.use(compression());

  // Use pino logger in production; NestJS built-in logger in development
  const { nodeEnv } = app
    .get(ConfigService)
    .getOrThrow<AppConfig>(APP_CONFIG_TOKEN);
  if (nodeEnv === 'production') {
    app.useLogger(app.get(Logger));
  }
}
