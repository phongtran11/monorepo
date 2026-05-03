import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import {
  appConfig,
  cloudinaryConfig,
  databaseConfig,
  jwtConfig,
  loggerConfig,
  redisConfig,
  validate,
} from './config';
import { DatabaseModule, JwtConfigModule, PinoLoggerModule } from './lib';
import { CloudinaryModule } from './lib/cloudinary/cloudinary.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoryModule } from './modules/category/category.module';
import { ImageModule } from './modules/image/image.module';
import { ProductModule } from './modules/product/product.module';
import { UploadModule } from './modules/upload/upload.module';

/**
 * Root module for the NestJS application.
 * Handles global configuration, logging, database connection, and JWT setup.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [
        appConfig,
        databaseConfig,
        jwtConfig,
        loggerConfig,
        cloudinaryConfig,
        redisConfig,
      ],
      validate,
    }),
    PinoLoggerModule.register(),
    DatabaseModule,
    JwtConfigModule,
    AuthModule,
    CategoryModule,
    CloudinaryModule,
    ImageModule,
    ProductModule,
    UploadModule,
  ],
})
export class AppModule {}
