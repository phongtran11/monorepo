import { Logger } from '@nestjs/common';
import { Logger as TypeOrmLogger } from 'typeorm';

/**
 * Custom database logger that implements TypeORM's Logger interface.
 * Uses NestJS's Logger to output database activities like queries, errors, and migrations.
 */
export class DBLogger implements TypeOrmLogger {
  private readonly logger = new Logger('TypeORM');

  /**
   * Logs a database query.
   *
   * @param query The SQL query being executed.
   * @param parameters Optional parameters for the query.
   */
  logQuery(query: string, parameters?: any[]) {
    const formatted = this.formatQuery(query, parameters);
    this.logger.debug(`${formatted}`);
  }

  /**
   * Logs a failed database query.
   *
   * @param error The error message or Error object.
   * @param query The SQL query that failed.
   * @param parameters Optional parameters for the failed query.
   */
  logQueryError(error: string | Error, query: string, parameters?: any[]) {
    const formatted = this.formatQuery(query, parameters);
    this.logger.error(`[FAILED QUERY] ${formatted}`);
    this.logger.error(`[ERROR] ${error}`);
  }

  /**
   * Logs a slow database query.
   *
   * @param time The time taken by the query in milliseconds.
   * @param query The SQL query that was slow.
   * @param parameters Optional parameters for the slow query.
   */
  logQuerySlow(time: number, query: string, parameters?: any[]) {
    const formatted = this.formatQuery(query, parameters);
    this.logger.warn(`[SLOW QUERY - ${time}ms] ${formatted}`);
  }

  /**
   * Logs schema build progress.
   *
   * @param message Message related to schema construction.
   */
  logSchemaBuild(message: string) {
    this.logger.log(`[SCHEMA] ${message}`);
  }

  /**
   * Logs migration progress.
   *
   * @param message Message related to database migration.
   */
  logMigration(message: string) {
    this.logger.log(`[MIGRATION] ${message}`);
  }

  /**
   * Generic logging method for TypeORM events.
   *
   * @param level The log level ('log', 'info', or 'warn').
   * @param message The message to log.
   */
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

  /**
   * Formats a query by substituting placeholders ($1, $2, ...) with their actual parameter values.
   * This is intended for logging and debugging purposes.
   *
   * @param query The SQL query with placeholders.
   * @param parameters Optional array of parameters.
   * @returns The formatted query string.
   */
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
