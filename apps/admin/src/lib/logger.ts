import pino from 'pino';

export class Logger {
  private logger: pino.Logger;

  constructor(private name: string) {
    this.logger = pino({
      name: this.name,
      level:
        process.env.LOG_LEVEL || process.env.NODE_ENV === 'production'
          ? 'info'
          : 'debug',
      transport:
        process.env.NODE_ENV === 'production'
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

  log(message: string, ...args: any[]) {
    this.logger.info(message, ...args);
  }

  error(message: string, ...args: any[]) {
    this.logger.error(message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.logger.warn(message, ...args);
  }

  info(message: string, ...args: any[]) {
    this.logger.info(message, ...args);
  }

  debug(message: string, ...args: any[]) {
    this.logger.debug(message, ...args);
  }
}
