import { ApiResponseDto } from '@api/lib/common/dto';
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger';

/**
 * Mixin that creates a dynamic Swagger-compatible response class by wrapping a data type in ApiResponseDto.
 *
 * @param dataType The data type function or array of functions being returned in the response.
 * @param options Optional Swagger API property options.
 * @returns A class that extends ApiResponseDto with a typed data property.
 */
export function ApiResponseOf(
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  dataType: Function | Function[],
  options?: ApiPropertyOptions,
) {
  if (Array.isArray(dataType) && dataType.length === 0) {
    throw new Error(
      'dataType provided to ApiResponseOf must not be an empty array. Please provide a class or an array containing a class.',
    );
  }

  class ApiResponseClass extends ApiResponseDto<any> {
    @ApiProperty(
      Array.isArray(dataType)
        ? { type: () => dataType[0], isArray: true, ...options }
        : { type: () => dataType, ...options },
    )
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    data: any;
  }

  const typeName = Array.isArray(dataType)
    ? `${dataType[0].name}ListResponse`
    : `${dataType.name}Response`;

  Object.defineProperty(ApiResponseClass, 'name', { value: typeName });

  return ApiResponseClass;
}
