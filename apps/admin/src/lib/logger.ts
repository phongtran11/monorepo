import pino from 'pino';

import { env } from './env';

export class Logger {
  private logger: pino.Logger;

  constructor(private name: string) {
    this.logger = pino({
      name: this.name,
      level:
        env.LOG_LEVEL ?? (env.NODE_ENV === 'production' ? 'info' : 'debug'),
      transport:
        env.NODE_ENV === 'production'
          ? undefined
          : {
              target: 'pino-pretty',
              options: {
                singleLine: false,
                colorize: true,
                translateTime: 'yyyy-mm-dd HH:MM:ss.l o',
              },
            },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log(message: string, ...args: any[]) {
    this.logger.info(message, ...args);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error(message: string, ...args: any[]) {
    this.logger.error(message, ...args);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn(message: string, ...args: any[]) {
    this.logger.warn(message, ...args);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info(message: string, ...args: any[]) {
    this.logger.info(message, ...args);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debug(message: string, ...args: any[]) {
    this.logger.debug(message, ...args);
  }
}
