import { FULL_API_URL_V1 } from '@web/lib/constants';

import { ApiError } from './api-error';
import type {
  ApiResponse,
  FetcherOptions,
  HttpMethod,
  TokenPair,
} from './fetcher.type';

const DEFAULT_TIMEOUT = 30_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build the full URL by prepending the API base and appending query params. */
function buildUrl(path: string, params?: FetcherOptions['params']): string {
  const base = path.startsWith('http') ? path : `${FULL_API_URL_V1}${path}`;

  if (!params) return base;

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  }

  const qs = searchParams.toString();
  return qs ? `${base}?${qs}` : base;
}

/** Merge default headers with user-supplied headers and optional auth token. */
function buildHeaders(token?: string, headers?: HeadersInit): HeadersInit {
  const merged: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (token) {
    merged['Authorization'] = `Bearer ${token}`;
  }

  return merged;
}

// ---------------------------------------------------------------------------
// Token refresh
// ---------------------------------------------------------------------------

/**
 * Call the backend refresh endpoint and return a new token pair.
 * Returns `null` when the refresh fails for any reason.
 */
async function requestTokenRefresh(
  refreshToken: string,
): Promise<TokenPair | null> {
  try {
    const response = await fetch(`${FULL_API_URL_V1}/auth/refresh`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refreshToken}`,
      },
    });

    if (!response.ok) return null;

    const result: ApiResponse<TokenPair> = await response.json();
    const { accessToken, refreshToken: newRefresh } = result.data;

    if (accessToken && newRefresh) return result.data;

    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Core request (single attempt)
// ---------------------------------------------------------------------------

/** Execute a single HTTP request and return the parsed response. */
async function executeRequest<T>(
  method: HttpMethod,
  url: string,
  token: string | undefined,
  options: FetcherOptions,
): Promise<ApiResponse<T>> {
  const {
    body,
    timeout = DEFAULT_TIMEOUT,
    next: nextOptions,
    signal: externalSignal,
    // Destructure to exclude custom keys from restInit
    token: _token,
    params: _params,
    headers: userHeaders,
    auth: _auth,
    ...restInit
  } = options;

  const headers = buildHeaders(token, userHeaders);

  // Timeout handling via AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  if (externalSignal) {
    externalSignal.addEventListener('abort', () => controller.abort(), {
      once: true,
    });
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      next: nextOptions,
      ...restInit,
    });

    const result: ApiResponse<T> = await response.json().catch(() => ({
      success: false,
      statusCode: response.status,
      message: 'Lỗi máy chủ',
      data: null as T,
      error: null,
    }));

    if (!response.ok) {
      throw new ApiError(response.status, result as ApiResponse);
    }

    return result;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(408, {
        success: false,
        statusCode: 408,
        message: 'Yêu cầu đã hết thời gian chờ. Vui lòng thử lại.',
        data: null,
        error: 'Request Timeout',
      });
    }

    throw new ApiError(0, {
      success: false,
      statusCode: 0,
      message: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
      data: null,
      error: (error as Error).message || 'Network Error',
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

// ---------------------------------------------------------------------------
// Public fetcher
// ---------------------------------------------------------------------------

/**
 * Fetch wrapper that targets the backend API.
 *
 * - Prepends `FULL_API_URL_V1` to relative paths.
 * - Serializes `body` to JSON automatically.
 * - Deserializes the response into `ApiResponse<T>`.
 * - Throws `ApiError` on non-2xx responses.
 * - Supports request timeout via `AbortController`.
 * - **Automatic token refresh**: when `auth` is provided and the request
 *   returns 401, the fetcher refreshes the access token once and retries.
 *
 * @example
 * ```ts
 * // Simple request
 * const res = await fetcher<User[]>('GET', '/users', { token });
 *
 * // With automatic refresh
 * const res = await fetcher<User[]>('GET', '/users', {
 *   token: accessToken,
 *   auth: {
 *     refreshToken,
 *     onRefreshed: async (tokens) => {
 *       const cookieStore = await cookies();
 *       cookieStore.set('access_token', tokens.accessToken, { ... });
 *       cookieStore.set('refresh_token', tokens.refreshToken, { ... });
 *     },
 *   },
 * });
 * ```
 */
export async function fetcher<T = unknown>(
  method: HttpMethod,
  path: string,
  options: FetcherOptions = {},
): Promise<ApiResponse<T>> {
  const url = buildUrl(path, options.params);

  try {
    return await executeRequest<T>(method, url, options.token, options);
  } catch (error) {
    // Attempt refresh only on 401 when auth config is provided
    if (error instanceof ApiError && error.isUnauthorized && options.auth) {
      const tokens = await requestTokenRefresh(options.auth.refreshToken);

      if (!tokens) throw error;

      // Notify caller so they can persist the new tokens
      await options.auth.onRefreshed(tokens);

      // Retry the original request with the fresh access token
      return executeRequest<T>(method, url, tokens.accessToken, options);
    }

    throw error;
  }
}

// ---------------------------------------------------------------------------
// Convenience methods
// ---------------------------------------------------------------------------

/** Send a `GET` request. */
fetcher.get = <T = unknown>(path: string, options?: FetcherOptions) =>
  fetcher<T>('GET', path, options);

/** Send a `POST` request. */
fetcher.post = <T = unknown>(path: string, options?: FetcherOptions) =>
  fetcher<T>('POST', path, options);

/** Send a `PUT` request. */
fetcher.put = <T = unknown>(path: string, options?: FetcherOptions) =>
  fetcher<T>('PUT', path, options);

/** Send a `PATCH` request. */
fetcher.patch = <T = unknown>(path: string, options?: FetcherOptions) =>
  fetcher<T>('PATCH', path, options);

/** Send a `DELETE` request. */
fetcher.delete = <T = unknown>(path: string, options?: FetcherOptions) =>
  fetcher<T>('DELETE', path, options);
