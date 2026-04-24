import { HttpExceptionFilter } from '@api/lib/common/filter';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import compression from 'compression';
import { Logger } from 'nestjs-pino';

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

  // Logger
  app.useLogger(app.get(Logger));
}
