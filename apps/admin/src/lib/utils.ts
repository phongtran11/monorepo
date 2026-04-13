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
  error: string,
): ApiResponse<T> {
  return {
    success: false,
    statusCode,
    message,
    data: null as T,
    error,
  };
}
