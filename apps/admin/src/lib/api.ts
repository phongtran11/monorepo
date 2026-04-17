'server only';

import { ApiResponse } from '@lam-thinh-ecommerce/shared';
import { headers as getIncomingHeaders } from 'next/headers';

import {
  DEFAULT_TIMEOUT_MS,
  RESPONSE_ERROR_CODES,
  RESPONSE_ERROR_MESSAGES,
} from './constants';
import { env } from './env';
import { Logger } from './logger';
import { tokenManager } from './token-manager';
import { buildUrl, makeErrorResponse } from './utils';

export type ApiRequestInit<R = unknown> = Omit<RequestInit, 'body'> & {
  data?: R;
  timeout?: number;
};

type InternalRequestInit<R> = ApiRequestInit<R> & { _retry?: boolean };

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
    controller.abort(
      new Error(RESPONSE_ERROR_MESSAGES[RESPONSE_ERROR_CODES.REQUEST_TIMEOUT]),
    );
  }, timeout);

  return {
    signal: controller.signal,
    dispose: () => {
      clearTimeout(timeoutId);
      externalSignal?.removeEventListener('abort', onExternalAbort);
    },
  };
}

export class Apis {
  private readonly apiUrl: string;
  private readonly logger = new Logger('API');

  constructor() {
    this.apiUrl = env.API_URL;
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

    const token = await tokenManager.getAccessToken();

    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    try {
      const incoming = await getIncomingHeaders();
      const userAgent = incoming.get('user-agent');
      if (userAgent && !headers.has('user-agent')) {
        headers.set('user-agent', userAgent);
      }

      const ipAddress = incoming.get('x-forwarded-for');
      if (ipAddress && !headers.has('x-forwarded-for')) {
        headers.set('x-forwarded-for', ipAddress);
      }
    } catch {
      // outside a Next.js request context (e.g. build time)
    }

    return headers;
  }

  private async executeFetch<R>(
    url: URL,
    requestInit: InternalRequestInit<R>,
    signal: AbortSignal,
  ): Promise<Response> {
    this.logger.debug(
      '%s %s %s',
      requestInit.method,
      url.toString(),
      this.buildBody(requestInit) ?? '{}',
    );
    return fetch(url, {
      ...requestInit,
      signal,
      body: this.buildBody(requestInit),
      headers: await this.buildHeaders(requestInit),
    });
  }

  private async parseSuccessBody<T>(
    response: Response,
    url: string,
  ): Promise<ApiResponse<T>> {
    const body = (await response
      .json()
      .catch(() => null)) as ApiResponse<T> | null;

    if (!body) {
      this.logger.error('Invalid JSON response for %s', url.toString());
      return makeErrorResponse<T>(
        response.status,
        RESPONSE_ERROR_MESSAGES[RESPONSE_ERROR_CODES.INVALID_JSON],
        RESPONSE_ERROR_CODES.INVALID_JSON,
      );
    }
    return body;
  }

  private async parseErrorBody<T>(
    response: Response,
    url: string,
  ): Promise<ApiResponse<T>> {
    const body = (await response
      .json()
      .catch(() => null)) as ApiResponse<T> | null;

    if (!body) {
      this.logger.error('Invalid JSON response for %s', url.toString());
    }

    return (
      body ??
      makeErrorResponse<T>(
        response.status,
        RESPONSE_ERROR_MESSAGES[RESPONSE_ERROR_CODES.UNKNOWN_NETWORK_ERROR],
        RESPONSE_ERROR_CODES.UNKNOWN_NETWORK_ERROR,
      )
    );
  }

  private handleCaughtError<T>(
    error: unknown,
    url: URL,
    signal: AbortSignal,
  ): ApiResponse<T> {
    const err = error as { message?: string; name?: string } | null;
    if (
      err?.message ===
      RESPONSE_ERROR_MESSAGES[RESPONSE_ERROR_CODES.REQUEST_TIMEOUT]
    ) {
      this.logger.error('Request Timeout for %s', url.toString());
      return makeErrorResponse<T>(
        408,
        RESPONSE_ERROR_MESSAGES[RESPONSE_ERROR_CODES.REQUEST_TIMEOUT],
        RESPONSE_ERROR_CODES.REQUEST_TIMEOUT,
      );
    }

    if (signal.aborted || err?.name === 'AbortError') {
      this.logger.warn('Request Aborted for %s', url.toString());
      return makeErrorResponse<T>(
        499,
        RESPONSE_ERROR_MESSAGES[RESPONSE_ERROR_CODES.REQUEST_ABORTED],
        RESPONSE_ERROR_CODES.REQUEST_ABORTED,
      );
    }

    this.logger.error(
      'Network or Unknown Error on %s: %s',
      url.toString(),
      err?.message,
    );
    return makeErrorResponse<T>(
      500,
      err?.message ||
        RESPONSE_ERROR_MESSAGES[RESPONSE_ERROR_CODES.UNKNOWN_NETWORK_ERROR],
      RESPONSE_ERROR_CODES.UNKNOWN_NETWORK_ERROR,
    );
  }

  private async retryAfterRefresh<T, R>(
    path: string,
    requestInit: InternalRequestInit<R>,
    url: URL,
    method: string,
  ): Promise<ApiResponse<T> | null> {
    const refreshed = await tokenManager.refreshTokens();

    if (!refreshed) {
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
        return this.parseErrorBody<T>(response, url.toString());
      }

      const body = await this.parseSuccessBody<T>(response, url.toString());
      this.logger.info(
        '%s %s %i in %dms',
        method,
        url.toString(),
        response.status,
        Math.round(performance.now() - start),
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
}

export const apis = new Apis();
