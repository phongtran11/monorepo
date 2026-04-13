import { Permission, Role } from '@lam-thinh-ecommerce/shared';

/**
 * Roles that are permitted to access the admin dashboard.
 * CUSTOMER accounts are rejected at the middleware layer.
 */
export const ADMIN_ALLOWED_ROLES: Role[] = [Role.ADMIN, Role.STAFF];

/**
 * Route-prefix → required permissions map.
 * Middleware enforces these before the request reaches the page.
 */
export const ROUTE_PERMISSIONS: Record<string, Permission[]> = {
  '/users': [Permission.READ_USERS],
  '/products': [Permission.READ_PRODUCTS, Permission.CREATE_PRODUCT],
  '/categories': [Permission.READ_CATEGORIES],
  '/orders': [Permission.READ_ORDERS],
};

export const COOKIES = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  CATEGORIES: {
    BASE: '/categories',
  },
  UPLOAD: {
    TEMP: '/upload/temp',
    SIGN: '/upload/sign',
    REGISTER: '/upload/temp/register',
    CANCEL: (tempId: string) => `/upload/cancel/${tempId}`,
  },
};

export const DEFAULT_TIMEOUT_MS = 30_000;

export const RESPONSE_ERROR_CODES = {
  INVALID_JSON: 'parse_error',
  REQUEST_TIMEOUT: 'request_timeout',
  REQUEST_ABORTED: 'aborted',
  UNKNOWN_NETWORK_ERROR: 'internal_error',
};

export const RESPONSE_ERROR_MESSAGES = {
  [RESPONSE_ERROR_CODES.INVALID_JSON]: 'Invalid JSON response',
  [RESPONSE_ERROR_CODES.REQUEST_TIMEOUT]: 'Request Timeout',
  [RESPONSE_ERROR_CODES.REQUEST_ABORTED]: 'Request Aborted',
  [RESPONSE_ERROR_CODES.UNKNOWN_NETWORK_ERROR]: 'Unknown network error',
} as const;
