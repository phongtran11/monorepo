import { Permission } from '@lam-thinh-ecommerce/shared';
import { FolderTree, Home, Package } from 'lucide-react';

export interface RouteConfig {
  path: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  permissions: Permission[];
}

/**
 * Route configuration for breadcrumbs and navigation.
 * Routes are matched in order — more specific paths must come before pattern paths.
 */
export const ROUTES: RouteConfig[] = [
  { path: '/', label: 'Trang chủ', icon: Home, permissions: [] },
  {
    path: '/products',
    label: 'Sản phẩm',
    icon: Package,
    permissions: [Permission.READ_PRODUCTS],
  },
  {
    path: '/products/create',
    label: 'Tạo mới',
    permissions: [Permission.CREATE_PRODUCT],
  },
  {
    path: '/products/:id',
    label: 'Chi tiết',
    permissions: [Permission.READ_PRODUCTS],
  },
  {
    path: '/products/:id/edit',
    label: 'Chỉnh sửa',
    permissions: [Permission.UPDATE_PRODUCT],
  },
  {
    path: '/categories',
    label: 'Danh mục',
    icon: FolderTree,
    permissions: [Permission.READ_CATEGORIES],
  },
];

/**
 * Match a route path pattern against an actual path.
 * Supports :param tokens (matches any non-empty segment).
 */
function matchRoute(routePath: string, actualPath: string): boolean {
  const routeSegments = routePath.split('/').filter(Boolean);
  const actualSegments = actualPath.split('/').filter(Boolean);
  if (routeSegments.length !== actualSegments.length) return false;
  return routeSegments.every(
    (seg, i) => seg.startsWith(':') || seg === actualSegments[i],
  );
}

/**
 * Get breadcrumb items for a given pathname.
 * Builds a hierarchy from root to current path.
 */
export function getBreadcrumbs(pathname: string): Array<{
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}> {
  const breadcrumbs: Array<{
    label: string;
    href?: string;
    icon?: React.ComponentType<{ className?: string }>;
  }> = [{ label: ROUTES[0].label, href: '/', icon: ROUTES[0].icon }];

  const segments = pathname.split('/').filter(Boolean);
  let currentPath = '';

  for (let i = 0; i < segments.length; i++) {
    currentPath += `/${segments[i]}`;

    // Exact match first
    let route = ROUTES.find((r) => r.path === currentPath);

    // Pattern match (handles :id tokens)
    if (!route) {
      route = ROUTES.find(
        (r) => r.path !== '/' && matchRoute(r.path, currentPath),
      );
    }

    if (route) {
      breadcrumbs.push({
        label: route.label,
        href: currentPath,
        icon: route.icon,
      });
    } else {
      breadcrumbs.push({
        label: segments[i].charAt(0).toUpperCase() + segments[i].slice(1),
        href: currentPath,
      });
    }
  }

  return breadcrumbs;
}
