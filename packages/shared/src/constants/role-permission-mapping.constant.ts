import { Permission } from './permission.constant.js';
import { Role } from './role.constant.js';

export const RolePermissionsMap: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    Permission.READ_USERS,
    Permission.CREATE_USER,
    Permission.UPDATE_USER,
    Permission.DELETE_USER,
    Permission.READ_ORDERS,
    Permission.UPDATE_ORDER,
    Permission.MANAGE_SYSTEM,
  ],
  [Role.STAFF]: [Permission.READ_ORDERS, Permission.UPDATE_ORDER],
  [Role.CUSTOMER]: [],
};
