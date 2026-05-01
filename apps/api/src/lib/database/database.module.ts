import {
  APP_CONFIG_TOKEN,
  AppConfig,
  DATABASE_CONFIG_TOKEN,
  DatabaseConfig,
} from '@api/config';
import { DBLogger } from '@api/lib/common';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

/**
 * Configures TypeORM with PostgreSQL using app and database config from ConfigService.
 */
@Module({
  imports: [
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
          ssl: true,
          extra: {
            ssl: { rejectUnauthorized: false },
            max: 20,
            idleTimeoutMillis: 30000,
          },
        };
      },
    }),
  ],
})
export class DatabaseModule {}
