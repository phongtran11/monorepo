import type { ApiResponse } from './fetcher.type';

/**
 * Represents an error returned by the backend API.
 *
 * Provides structured access to the HTTP status, backend message, and the
 * full response body so callers can handle errors with type-safety.
 */
export class ApiError extends Error {
  /** HTTP status code (e.g. 400, 401, 404, 500). */
  readonly status: number;

  /** Full response body returned by the backend (if parseable). */
  readonly response: ApiResponse | null;

  constructor(status: number, response: ApiResponse | null) {
    const message = response?.message || `Request failed with status ${status}`;
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
  }

  /** Whether the error is an authentication failure (401). */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  /** Whether the error is a forbidden access (403). */
  get isForbidden(): boolean {
    return this.status === 403;
  }

  /** Whether the error is a not-found response (404). */
  get isNotFound(): boolean {
    return this.status === 404;
  }
}
