import { NestFactory } from '@nestjs/core';
import {
  ExpressAdapter,
  NestExpressApplication,
} from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';
import { bootstrapApp } from './common';

/**
 * Bootstraps the NestJS application.
 * Configures the application with Logger, Swagger, and compression.
 *
 * @returns {Promise<void>}
 */
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(),
    { bufferLogs: true },
  );

  app.useLogger(app.get(Logger));

  bootstrapApp(app);

  app.use(compression);

  // Swagger with Bearer auth
  const config = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
