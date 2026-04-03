import { logger } from '@admin/lib/server/logger';

const API_BASE_URL =
  'https://monorepo-production-3759.up.railway.app/api/v1';

interface ServerFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  error: string | null;
}

/**
 * Server-side fetch utility with structured JSON logging via pino.
 * Only use inside server functions (`createServerFn` handlers).
 */
export async function serverFetch<T>(
  path: string,
  options: ServerFetchOptions = {},
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${path}`;
  const method = options.method ?? 'GET';
  const start = performance.now();

  logger.info({ method, url }, '--> %s %s', method, path);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const duration = Math.round(performance.now() - start);
    const data: ApiResponse<T> = await response.json();

    if (!response.ok || !data.success) {
      logger.error(
        { method, url, status: response.status, duration, error: data.error ?? data.message },
        '<-- %s %s %d (%dms)',
        method,
        path,
        response.status,
        duration,
      );
      throw new Error(data.message ?? `Request failed with status ${response.status}`);
    }

    logger.info(
      { method, url, status: response.status, duration },
      '<-- %s %s %d (%dms)',
      method,
      path,
      response.status,
      duration,
    );

    return data;
  } catch (error) {
    if (error instanceof Error && !error.message.includes('Request failed')) {
      const duration = Math.round(performance.now() - start);
      logger.error(
        { method, url, duration, err: error.message },
        '<-- %s %s NETWORK_ERROR (%dms)',
        method,
        path,
        duration,
      );
    }
    throw error;
  }
}
