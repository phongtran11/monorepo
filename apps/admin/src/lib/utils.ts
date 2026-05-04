import { ApiResponse } from '@lam-thinh-ecommerce/shared';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function buildUrl(apiUrl: string, path: string): URL {
  const base = apiUrl.replace(/\/$/, '');
  const suffix = path.replace(/^\//, '');
  return new URL(`${base}/${suffix}`);
}

export function makeErrorResponse<T>(
  statusCode: number,
  message: string,
  code: string,
): ApiResponse<T> {
  return {
    success: false,
    statusCode,
    message,
    code,
  };
}

import { ApiErrorResponse, ERROR_CODES } from '@lam-thinh-ecommerce/shared';
import { FieldValues, Path, UseFormSetError } from 'react-hook-form';

export function handleApiFormError<TFieldValues extends FieldValues>(
  errorResponse: ApiErrorResponse,
  setError: UseFormSetError<TFieldValues>,
  setGlobalError?: (message: string) => void,
) {
  if (
    errorResponse.code === ERROR_CODES.VALIDATION_ERROR &&
    errorResponse.errors
  ) {
    errorResponse.errors.forEach((err) => {
      setError(err.field as Path<TFieldValues>, {
        type: 'server',
        message: err.message,
      });
    });
  } else if (setGlobalError) {
    setGlobalError(errorResponse.message);
  }
}
