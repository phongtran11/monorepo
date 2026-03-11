import { randomUUID } from 'node:crypto';

import { registerAs } from '@nestjs/config';
import { Params } from 'nestjs-pino';

export const loggerConfig = registerAs(
  'logger',
  (): Params => ({
    pinoHttp: {
      genReqId: (): string => {
        return randomUUID();
      },
      level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
      transport:
        process.env.NODE_ENV !== 'production'
          ? {
              target: 'pino-pretty',
              options: {
                singleLine: true,
                colorize: true,
                translateTime: 'yyyy-mm-dd HH:MM:ss.l o',
              },
            }
          : undefined,
      // Auto logging configuration
      autoLogging: true,
    },
  }),
);
