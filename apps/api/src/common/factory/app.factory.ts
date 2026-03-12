import { HttpExceptionFilter } from '@api/common/filter';
import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';

/**
 * Configures a NestJS application with standard global middleware, pipes, filters, and settings.
 *
 * @param app The NestJS application instance to bootstrap.
 * @returns {void}
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
      transform: true,
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => {
          return Object.values(error.constraints ?? {}).join(', ');
        });
        return new BadRequestException(messages.join('; '));
      },
    }),
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());
}
