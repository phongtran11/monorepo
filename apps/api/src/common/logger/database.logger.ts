import { Logger } from '@nestjs/common';
import { Logger as TypeOrmLogger } from 'typeorm';

export class DBLogger implements TypeOrmLogger {
  private readonly logger = new Logger('TypeORM');

  logQuery(query: string, parameters?: any[]) {
    const formatted = this.formatQuery(query, parameters);
    this.logger.debug(`[QUERY] ${formatted}`);
  }

  logQueryError(error: string | Error, query: string, parameters?: any[]) {
    const formatted = this.formatQuery(query, parameters);
    this.logger.error(`[FAILED QUERY] ${formatted}`);
    this.logger.error(`[ERROR] ${error}`);
  }

  logQuerySlow(time: number, query: string, parameters?: any[]) {
    const formatted = this.formatQuery(query, parameters);
    this.logger.warn(`[SLOW QUERY - ${time}ms] ${formatted}`);
  }

  logSchemaBuild(message: string) {
    this.logger.log(`[SCHEMA] ${message}`);
  }

  logMigration(message: string) {
    this.logger.log(`[MIGRATION] ${message}`);
  }

  log(level: 'log' | 'info' | 'warn', message: any) {
    switch (level) {
      case 'log':
      case 'info':
        this.logger.log(message);
        break;
      case 'warn':
        this.logger.warn(message);
        break;
    }
  }

  private formatQuery(query: string, parameters?: any[]): string {
    if (!parameters || !parameters.length) {
      return query;
    }

    try {
      // Simple regex to replace $1, $2, etc. with actual values
      // Note: This is for logging purposes and might not handle all edge cases (like strings containing $1)
      let formatted = query;
      parameters.forEach((param: unknown, index: number) => {
        const placeholder = `\\$${index + 1}(?![0-9])`; // Matches $1 but not $11
        let value: unknown = param;

        if (typeof param === 'string') {
          value = `'${param}'`;
        } else if (param instanceof Date) {
          value = `'${param.toISOString()}'`;
        } else if (param === null) {
          value = 'NULL';
        } else if (typeof param === 'object' && param !== null) {
          value = JSON.stringify(param);
        }

        formatted = formatted.replace(
          new RegExp(placeholder, 'g'),
          String(value),
        );
      });
      return formatted;
    } catch (_e) {
      // Fallback if formatting fails
      return `${query} -- Parameters: ${JSON.stringify(parameters)}`;
    }
  }
}
