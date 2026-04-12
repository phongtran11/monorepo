'server only';

import { ApiResponse, TokenPair } from '@lam-thinh-ecommerce/shared';
import { cookies } from 'next/headers';

import { API_ENDPOINTS, COOKIES } from './constants';
import { env } from './env';
import { Logger } from './logger';

export type ApiRequestInit<R = unknown> = Omit<RequestInit, 'body'> & {
  data?: R;
  timeout?: number;
};

type InternalRequestInit<R> = ApiRequestInit<R> & { _retry?: boolean };

const DEFAULT_TIMEOUT_MS = 30_000;

function makeErrorResponse<T>(
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

function buildUrl(apiUrl: string, path: string): URL {
  const base = apiUrl.replace(/\/$/, '');
  const suffix = path.replace(/^\//, '');
  return new URL(`${base}/${suffix}`);
}

type AbortScope = {
  signal: AbortSignal;
  dispose: () => void;
};

function createAbortScope(requestInit: ApiRequestInit): AbortScope {
  const controller = new AbortController();
  const { timeout = DEFAULT_TIMEOUT_MS, signal: externalSignal } = requestInit;

  const onExternalAbort = () => controller.abort(externalSignal?.reason);

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort(externalSignal.reason);
    } else {
      externalSignal.addEventListener('abort', onExternalAbort);
    }
  }

  const timeoutId = setTimeout(() => {
    controller.abort(new Error('Request Timeout'));
  }, timeout);

  return {
    signal: controller.signal,
    dispose: () => {
      clearTimeout(timeoutId);
      externalSignal?.removeEventListener('abort', onExternalAbort);
    },
  };
}

class TokenManager {
  private logger = new Logger('TokenManager');

  constructor(private readonly apiUrl: string) {}

  async getAccessToken() {
    try {
      const cookieStore = await cookies();
      return cookieStore.get(COOKIES.ACCESS_TOKEN)?.value;
    } catch {
      return null;
    }
  }

  async getRefreshToken() {
    try {
      const cookieStore = await cookies();
      return cookieStore.get(COOKIES.REFRESH_TOKEN)?.value;
    } catch {
      return null;
    }
  }

  async setTokens(tokens: TokenPair) {
    try {
      const cookieStore = await cookies();
      const baseCookie = {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
      };

      cookieStore.set(COOKIES.ACCESS_TOKEN, tokens.accessToken, {
        ...baseCookie,
        maxAge: tokens.accessTokenExpiresIn,
      });
      cookieStore.set(COOKIES.REFRESH_TOKEN, tokens.refreshToken, {
        ...baseCookie,
        maxAge: tokens.refreshTokenExpiresIn,
      });
      this.logger.info('Tokens successfully saved to cookies');
    } catch (e) {
      this.logger.error('Failed to set cookies during token refresh: %o', e);
    }
  }

  async clearTokens() {
    try {
      const cookieStore = await cookies();
      cookieStore.delete(COOKIES.ACCESS_TOKEN);
      cookieStore.delete(COOKIES.REFRESH_TOKEN);
      this.logger.info('Tokens successfully cleared from cookies');
    } catch (e) {
      this.logger.error('Failed to clear cookies: %o', e);
    }
  }

  async refreshTokens(): Promise<boolean> {
    this.logger.info('Starting silent token refresh');
    const refreshToken = await this.getRefreshToken();

    if (!refreshToken) {
      this.logger.warn('No refresh token found for silent refresh');
      return false;
    }

    try {
      const url = buildUrl(this.apiUrl, API_ENDPOINTS.AUTH.REFRESH);
      this.logger.debug('Fetching new access token from %s', url.toString());

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${refreshToken}`,
        },
      });

      if (!response.ok) {
        this.logger.error(
          'Refresh token request failed with status: %d',
          response.status,
        );
        await this.clearTokens();
        return false;
      }

      const result = (await response.json()) as ApiResponse<TokenPair>;
      if (result.success && result.data) {
        await this.setTokens(result.data);
        this.logger.info('Token refresh completed successfully');
        return true;
      }

      this.logger.warn(
        'Token refresh response failed in logic check. Clearing tokens.',
      );
      await this.clearTokens();
      return false;
    } catch (e) {
      this.logger.error('Token refresh network error: %o', e);
      return false;
    }
  }
}

export class Apis {
  private readonly apiUrl: string;
  private readonly logger = new Logger('API');
  private readonly tokenManager: TokenManager;

  constructor() {
    this.apiUrl = env.API_URL;
    this.tokenManager = new TokenManager(this.apiUrl);
  }

  private buildBody(requestInit: ApiRequestInit): BodyInit | null {
    if (requestInit.data instanceof FormData) {
      return requestInit.data;
    }
    if (requestInit.data) {
      return JSON.stringify(requestInit.data);
    }
    return null;
  }

  private async buildHeaders(requestInit: ApiRequestInit): Promise<Headers> {
    const headers = new Headers(requestInit.headers);

    if (requestInit.data instanceof FormData) {
      headers.delete('Content-Type');
    } else if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const token = await this.tokenManager.getAccessToken();

    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  private async executeFetch<R>(
    url: URL,
    requestInit: InternalRequestInit<R>,
    signal: AbortSignal,
  ): Promise<Response> {
    return fetch(url, {
      ...requestInit,
      signal,
      body: this.buildBody(requestInit),
      headers: await this.buildHeaders(requestInit),
    });
  }

  private async parseSuccessBody<T>(
    response: Response,
    url: URL,
  ): Promise<ApiResponse<T>> {
    const body = (await response
      .json()
      .catch(() => null)) as ApiResponse<T> | null;

    if (!body) {
      this.logger.error(
        'Failed to parse JSON response from %s',
        url.toString(),
      );
      return makeErrorResponse<T>(
        response.status,
        'Invalid JSON response',
        'parse_error',
      );
    }
    return body;
  }

  private async parseErrorBody<T>(
    response: Response,
    url: URL,
  ): Promise<ApiResponse<T>> {
    this.logger.error(
      'Request failed to %s with status %d',
      url.toString(),
      response.status,
    );
    const body = (await response
      .json()
      .catch(() => null)) as ApiResponse<T> | null;

    return (
      body ??
      makeErrorResponse<T>(
        response.status,
        response.statusText || 'API Error',
        'Failed to parse error response',
      )
    );
  }

  private handleCaughtError<T>(
    error: unknown,
    url: URL,
    signal: AbortSignal,
  ): ApiResponse<T> {
    const err = error as { message?: string; name?: string } | null;

    if (err?.message === 'Request Timeout') {
      this.logger.error('Request Timeout for %s', url.toString());
      return makeErrorResponse<T>(408, 'Request Timeout', err.message);
    }

    if (signal.aborted || err?.name === 'AbortError') {
      this.logger.warn('Request Aborted for %s', url.toString());
      return makeErrorResponse<T>(499, 'Request Aborted', 'aborted');
    }

    this.logger.error(
      'Network or Unknown Error on %s: %s',
      url.toString(),
      err?.message,
    );
    return makeErrorResponse<T>(
      500,
      err?.message || 'Unknown network error',
      'internal_error',
    );
  }

  private async retryAfterRefresh<T, R>(
    path: string,
    requestInit: InternalRequestInit<R>,
    url: URL,
    method: string,
  ): Promise<ApiResponse<T> | null> {
    this.logger.warn(
      'Token expired for %s, attempting silent refresh',
      url.toString(),
    );
    const refreshed = await this.tokenManager.refreshTokens();

    if (!refreshed) {
      this.logger.error('Refresh failed for %s, returning 401', url.toString());
      return null;
    }

    this.logger.info(
      'Refresh successful, automatically retrying %s request to %s',
      method,
      url.toString(),
    );
    return this.request<T, R>(path, { ...requestInit, _retry: true });
  }

  private async request<T, R>(
    path: string,
    requestInit: InternalRequestInit<R>,
  ): Promise<ApiResponse<T>> {
    const start = performance.now();
    const url = buildUrl(this.apiUrl, path);
    const method = requestInit.method || 'GET';
    const abort = createAbortScope(requestInit);

    this.logger.info('Sending %s request to %s', method, url.toString());

    try {
      const response = await this.executeFetch(url, requestInit, abort.signal);
      if (response.status === 401 && !requestInit._retry) {
        const retried = await this.retryAfterRefresh<T, R>(
          path,
          requestInit,
          url,
          method,
        );
        if (retried) return retried;
      }

      if (!response.ok) {
        return this.parseErrorBody<T>(response, url);
      }

      const body = await this.parseSuccessBody<T>(response, url);
      this.logger.info(
        '%s Request to %s succeeded in %dms',
        method,
        url.toString(),
        performance.now() - start,
      );
      return body;
    } catch (e: unknown) {
      return this.handleCaughtError<T>(e, url, abort.signal);
    } finally {
      abort.dispose();
    }
  }

  get<T, R = unknown>(path: string, requestInit: ApiRequestInit<R> = {}) {
    return this.request<T, R>(path, { ...requestInit, method: 'GET' });
  }

  post<T, R = unknown>(path: string, requestInit: ApiRequestInit<R> = {}) {
    return this.request<T, R>(path, { ...requestInit, method: 'POST' });
  }

  put<T, R = unknown>(path: string, requestInit: ApiRequestInit<R> = {}) {
    return this.request<T, R>(path, { ...requestInit, method: 'PUT' });
  }

  patch<T, R = unknown>(path: string, requestInit: ApiRequestInit<R> = {}) {
    return this.request<T, R>(path, { ...requestInit, method: 'PATCH' });
  }

  delete<T, R = unknown>(path: string, requestInit: ApiRequestInit<R> = {}) {
    return this.request<T, R>(path, { ...requestInit, method: 'DELETE' });
  }

  async setTokens(tokens: TokenPair) {
    return this.tokenManager.setTokens(tokens);
  }

  async clearTokens() {
    return this.tokenManager.clearTokens();
  }
}

export const apis = new Apis();
