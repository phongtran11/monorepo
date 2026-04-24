import { ApiResponseDto } from '@api/lib/common/dto';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Global exception filter for handling HTTP exceptions.
 * Automatically wraps error responses into a standard ApiResponseDto format.
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

    const errorMessage =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as { message: unknown })?.message
          ? Array.isArray((exceptionResponse as { message: unknown }).message)
            ? (exceptionResponse as { message: string[] }).message.join(', ')
            : (exceptionResponse as { message: string }).message
          : exception.message ||
            JSON.stringify(exceptionResponse) ||
            'Lỗi không xác định';

    response.status(status).json(ApiResponseDto.error(errorMessage, status));
  }
}
