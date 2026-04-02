/** Standard API response shape returned by the backend. */
export type ApiResponse<T = unknown> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  error: string | null;
};

/** HTTP methods supported by the fetcher. */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Token pair returned by the refresh endpoint. */
export type TokenPair = {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
};

/**
 * Authentication configuration for automatic token refresh.
 *
 * When provided, the fetcher will intercept 401 responses and attempt
 * to refresh the access token **once** before re-throwing the error.
 */
export type FetcherAuth = {
  /** The current refresh token used to obtain a new access token. */
  refreshToken: string;

  /**
   * Called after a successful token refresh.
   * Use this to persist the new tokens (e.g. update cookies).
   */
  onRefreshed: (tokens: TokenPair) => void | Promise<void>;
};

/** Options for the fetcher function. */
export type FetcherOptions = Omit<RequestInit, 'method' | 'body'> & {
  /** Request body — automatically serialized to JSON. */
  body?: unknown;

  /**
   * Bearer token for the `Authorization` header.
   * When provided, an `Authorization: Bearer <token>` header is added.
   */
  token?: string;

  /**
   * Query parameters appended to the URL.
   * `undefined` / `null` values are stripped automatically.
   */
  params?: Record<string, string | number | boolean | undefined | null>;

  /** Request timeout in milliseconds. Defaults to 30 000 ms. */
  timeout?: number;

  /** Next.js extended fetch options (revalidate, tags, etc.). */
  next?: NextFetchRequestConfig;

  /**
   * Authentication config for automatic token refresh on 401.
   * When set, a failed request (401) triggers a single refresh attempt
   * using `auth.refreshToken`, then retries the original request.
   */
  auth?: FetcherAuth;
};
