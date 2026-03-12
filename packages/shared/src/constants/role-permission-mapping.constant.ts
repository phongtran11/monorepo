import { Permission } from './permission.constant';
import { Role } from './role.constant';

export const RolePermissionsMap: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    Permission.READ_USERS,
    Permission.CREATE_USER,
    Permission.UPDATE_USER,
    Permission.DELETE_USER,
    Permission.READ_ORDERS,
    Permission.UPDATE_ORDER,
    Permission.CREATE_CATEGORY,
    Permission.READ_CATEGORIES,
    Permission.UPDATE_CATEGORY,
    Permission.DELETE_CATEGORY,
    Permission.MANAGE_SYSTEM,
  ],
  [Role.STAFF]: [
    Permission.READ_ORDERS,
    Permission.UPDATE_ORDER,
    Permission.CREATE_CATEGORY,
    Permission.READ_CATEGORIES,
    Permission.UPDATE_CATEGORY,
    Permission.DELETE_CATEGORY,
  ],
  [Role.CUSTOMER]: [Permission.READ_CATEGORIES],
};
