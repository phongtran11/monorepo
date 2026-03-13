/**
 * Fine-grained permissions for authorization.
 */
export const Permission = {
  // Users
  /** Permission to read user information */
  READ_USERS: 'read:users',
  /** Permission to create a new user */
  CREATE_USER: 'create:user',
  /** Permission to update existing user information */
  UPDATE_USER: 'update:user',
  /** Permission to delete a user */
  DELETE_USER: 'delete:user',

  // Orders
  /** Permission to read order information */
  READ_ORDERS: 'read:orders',
  /** Permission to update order status or details */
  UPDATE_ORDER: 'update:order',

  // Categories
  /** Permission to create a new product category */
  CREATE_CATEGORY: 'create:category',
  /** Permission to read category information */
  READ_CATEGORIES: 'read:categories',
  /** Permission to update category details */
  UPDATE_CATEGORY: 'update:category',
  /** Permission to delete a category */
  DELETE_CATEGORY: 'delete:category',

  // System
  /** Permission to perform system-wide management tasks */
  MANAGE_SYSTEM: 'manage:system',
} as const;

/**
 * Type representing the available permissions in the system.
 */
export type Permission = (typeof Permission)[keyof typeof Permission];
