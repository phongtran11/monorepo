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
    CANCEL: (tempId: string) => `/upload/cancel/${tempId}`,
  },
};
