import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';

import { AuthModule } from './auth/auth.module';
import { CategoryModule } from './category/category.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { DBLogger } from './common';
import {
  APP_CONFIG_TOKEN,
  AppConfig,
  appConfig,
  cloudinaryConfig,
  DATABASE_CONFIG_TOKEN,
  DatabaseConfig,
  databaseConfig,
  JWT_CONFIG_TOKEN,
  JwtConfig,
  jwtConfig,
  LOGGER_CONFIG_TOKEN,
  LoggerConfig,
  loggerConfig,
  redisConfig,
  validate,
} from './config';
import { ProductModule } from './product/product.module';

/**
 * Root module for the NestJS application.
 * Handles global configuration, logging, database connection, and JWT setup.
 */
@Module({
  imports: [
    // Global config from .env with Zod validation
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

    // Pino Logger
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.getOrThrow<LoggerConfig>(LOGGER_CONFIG_TOKEN),
    }),

    // TypeORM with Neon PostgreSQL
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.getOrThrow<DatabaseConfig>(
          DATABASE_CONFIG_TOKEN,
        );
        const appConfig = configService.getOrThrow<AppConfig>(APP_CONFIG_TOKEN);
        return {
          type: 'postgres',
          url: dbConfig.url,
          autoLoadEntities: true,
          synchronize: appConfig.nodeEnv !== 'production',
          logger: new DBLogger(),
        };
      },
    }),

    // JWT (global) — uses access token secret
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwtConfig = configService.getOrThrow<JwtConfig>(JWT_CONFIG_TOKEN);
        return {
          secret: jwtConfig.accessSecret,
        };
      },
    }),

    AuthModule,
    CategoryModule,
    CloudinaryModule,
    ProductModule,
  ],
})
export class AppModule {}
