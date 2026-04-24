import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  ExpressAdapter,
  NestExpressApplication,
} from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { APP_CONFIG_TOKEN, AppConfig } from './config';
import { bootstrapApp } from './lib/common';

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

  bootstrapApp(app);

  // Swagger with Bearer auth
  const config = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const env = app.get(ConfigService).getOrThrow<AppConfig>(APP_CONFIG_TOKEN);

  await app.listen(env.port ?? 3000, '0.0.0.0');
}
void bootstrap();
