import { randomUUID } from 'node:crypto';
import { IncomingMessage } from 'node:http';

import { registerAs } from '@nestjs/config';
import { Params } from 'nestjs-pino';

export const LOGGER_CONFIG_TOKEN = 'logger';

/**
 * Logger configuration object.
 * Configures nestjs-pino with custom settings for request tracking and pretty-printing.
 */
export const loggerConfig = registerAs(
  'logger',
  (): Params => ({
    pinoHttp: {
      genReqId: (): string => {
        return randomUUID();
      },
      serializers: {
        req(req: IncomingMessage & { id?: string }) {
          return {
            id: req.id,
            method: req.method,
            url: req.url,
          };
        },
      },
      level:
        process.env.LOG_LEVEL ??
        (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
      transport:
        process.env.NODE_ENV !== 'production'
          ? {
              targets: [
                {
                  target: 'pino-pretty',
                  options: {
                    singleLine: false,
                    colorize: true,
                    translateTime: 'yyyy-mm-dd HH:MM:ss.l o',
                  },
                },
              ],
            }
          : undefined,
    },
    forRoutes: ['{*path}'],
  }),
);

export type LoggerConfig = ReturnType<typeof loggerConfig>;
