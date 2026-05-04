import {
  ERROR_CODES,
  ErrorCode,
  ErrorMessage,
} from '@lam-thinh-ecommerce/shared';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Global exception filter for handling HTTP exceptions.
 * Automatically wraps error responses into a standard format.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  /**
   * Catches and formats HTTP exceptions to provide a consistent error response structure.
   *
   * @param exception The HTTP exception that was caught.
   * @param host The execution context.
   */
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let code = 'INTERNAL_SERVER_ERROR';
    let message = ErrorMessage[ERROR_CODES.INTERNAL_SERVER_ERROR];
    let errors: Record<string, unknown>[] | undefined = undefined;

    if (typeof exceptionResponse === 'string') {
      if (exceptionResponse in ErrorMessage) {
        code = exceptionResponse;
        message = ErrorMessage[exceptionResponse as ErrorCode];
      } else {
        message = exceptionResponse;
      }
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null
    ) {
      const resObj = exceptionResponse as {
        message?: unknown;
        error?: unknown;
        errors?: Record<string, unknown>[];
      };
      if (
        resObj.message &&
        typeof resObj.message === 'string' &&
        resObj.message in ErrorMessage
      ) {
        code = resObj.message;
        message = ErrorMessage[resObj.message as ErrorCode];
        if (Array.isArray(resObj.errors)) {
          errors = resObj.errors;
        }
      } else if (resObj.message && typeof resObj.message === 'string') {
        message = resObj.message;
        // Basic mappings if needed, but we default to using exceptionResponse
      } else if (
        resObj.error &&
        typeof resObj.error === 'string' &&
        resObj.error in ErrorMessage
      ) {
        code = resObj.error;
        message = ErrorMessage[resObj.error as ErrorCode];
      }

      if (code === 'INTERNAL_SERVER_ERROR' && status !== 500) {
        if (status === 400) code = 'BAD_REQUEST';
        else if (status === 401) code = 'UNAUTHORIZED';
        else if (status === 403) code = 'FORBIDDEN';
        else if (status === 404) code = 'NOT_FOUND';
      }
    }

    response.status(status).json({
      statusCode: status,
      code,
      message,
      ...(errors && { errors }),
    });
  }
}
