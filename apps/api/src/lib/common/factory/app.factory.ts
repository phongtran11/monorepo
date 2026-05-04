import { APP_CONFIG_TOKEN, AppConfig } from '@api/config';
import { ERROR_CODES } from '@lam-thinh-ecommerce/shared';
import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ValidationError } from 'class-validator';
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
      exceptionFactory: (errors) => {
        const formatErrors = (
          validationErrors: ValidationError[],
          prefix = '',
        ) => {
          let messages: { field: string; message: string }[] = [];
          for (const err of validationErrors) {
            const field = prefix ? `${prefix}.${err.property}` : err.property;
            if (err.constraints) {
              for (const key in err.constraints) {
                messages.push({
                  field,
                  message: err.constraints[key],
                });
              }
            }
            if (err.children && err.children.length > 0) {
              messages = messages.concat(formatErrors(err.children, field));
            }
          }
          return messages;
        };

        const flatErrors = formatErrors(errors);

        return new BadRequestException({
          message: ERROR_CODES.VALIDATION_ERROR,
          errors: flatErrors,
        });
      },
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
