import { LOGGER_CONFIG_TOKEN, LoggerConfig } from '@api/config';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

/**
 * Wraps nestjs-pino's LoggerModule with config sourced from ConfigService.
 * Use PinoLoggerModule.register() to conditionally enable pino based on environment.
 */
@Module({})
export class PinoLoggerModule {
  static register(): DynamicModule {
    const isProd = process.env.NODE_ENV === 'production';

    return {
      module: PinoLoggerModule,
      imports: isProd
        ? [
            LoggerModule.forRootAsync({
              inject: [ConfigService],
              useFactory: (configService: ConfigService) =>
                configService.getOrThrow<LoggerConfig>(LOGGER_CONFIG_TOKEN),
            }),
          ]
        : [],
    };
  }
}
