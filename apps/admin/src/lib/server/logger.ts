import pino from 'pino';

import { env } from '@admin/env';

/**
 * Server-side JSON logger powered by pino.
 *
 * Log level is controlled via the `LOG_LEVEL` environment variable.
 * Supported levels: trace | debug | info | warn | error | fatal | silent
 *
 * Output is always JSON — pipe through `pino-pretty` during local dev:
 *   pnpm dev | pino-pretty
 */
export const logger = pino({
  level: env.LOG_LEVEL,
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
});
