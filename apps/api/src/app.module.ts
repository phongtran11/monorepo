import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { appConfig, databaseConfig, Env, jwtConfig, validate } from './config';

@Module({
  imports: [
    // Global config from .env with Zod validation
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig, databaseConfig, jwtConfig],
      validate,
    }),

    // TypeORM with Neon PostgreSQL
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Env>) => ({
        type: 'postgres',
        url: configService.getOrThrow('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: configService.getOrThrow('NODE_ENV') !== 'production',
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
  ],
})
export class AppModule {}
