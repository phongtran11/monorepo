import { ApiProperty } from '@nestjs/swagger';

/**
 * Standard API response DTO used across the application.
 * @template T The type of the data returned in the response.
 */
export class ApiResponseDto<T> {
  /**
   * Indicates if the request was successful.
   * @example true
   */
  @ApiProperty({
    example: true,
    description: 'Indicates if the request was successful.',
  })
  success: boolean;

  /**
   * HTTP status code of the response.
   * @example 200
   */
  @ApiProperty({
    example: 200,
    description: 'HTTP status code of the response.',
  })
  statusCode: number;

  /**
   * Message providing more context about the response.
   * @example 'Request successful'
   */
  @ApiProperty({
    example: 'Request successful',
    description: 'Message providing more context about the response.',
  })
  message: string;

  /**
   * Data returned by the API.
   */
  @ApiProperty({ description: 'Data returned by the API.' })
  data: T;

  /**
   * Error message if the request failed, otherwise null.
   * @example null
   */
  @ApiProperty({
    example: null,
    nullable: true,
    description: 'Error message if the request failed, otherwise null.',
  })
  error: string | null;

  /**
   * Creates a successful API response.
   *
   * @param data The data to be returned.
   * @param message Optional success message.
   * @param statusCode Optional HTTP status code (defaults to 200).
   * @returns An ApiResponseDto instance representing a success.
   */
  static success<T>(
    data: T,
    message = 'Success',
    statusCode = 200,
  ): ApiResponseDto<T> {
    const res = new ApiResponseDto<T>();
    res.success = true;
    res.statusCode = statusCode;
    res.message = message;
    res.data = data;
    res.error = null;
    return res;
  }

  /**
   * Creates an error API response.
   *
   * @param message The error message.
   * @param statusCode Optional HTTP status code (defaults to 400).
   * @param error Optional detailed error message.
   * @returns An ApiResponseDto instance representing an error.
   */
  static error(
    message: string,
    statusCode = 400,
    error?: string,
  ): ApiResponseDto<null> {
    const res = new ApiResponseDto<null>();
    res.success = false;
    res.statusCode = statusCode;
    res.message = message;
    res.data = null;
    res.error = error ?? null;
    return res;
  }
}
