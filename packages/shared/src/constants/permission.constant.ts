export const Permission = {
  // Users
  READ_USERS: 'read:users',
  CREATE_USER: 'create:user',
  UPDATE_USER: 'update:user',
  DELETE_USER: 'delete:user',

  // Orders
  READ_ORDERS: 'read:orders',
  UPDATE_ORDER: 'update:order',

  // System
  MANAGE_SYSTEM: 'manage:system',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];
