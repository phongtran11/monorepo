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
  appConfig,
  cloudinaryConfig,
  databaseConfig,
  Env,
  jwtConfig,
  loggerConfig,
  validate,
} from './config';

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
      ],
      validate,
    }),

    // Pino Logger
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.getOrThrow('logger'),
    }),

    // TypeORM with Neon PostgreSQL
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Env>) => ({
        type: 'postgres',
        url: configService.getOrThrow('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: configService.getOrThrow('NODE_ENV') !== 'production',
        logger: new DBLogger(),
      }),
    }),

    // JWT (global) — uses access token secret
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Env>) => ({
        secret: configService.getOrThrow('JWT_ACCESS_SECRET'),
      }),
    }),

    AuthModule,
    CategoryModule,
    CloudinaryModule,
  ],
})
export class AppModule {}
