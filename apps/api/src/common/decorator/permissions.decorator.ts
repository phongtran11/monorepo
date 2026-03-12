import { Permission } from '@lam-thinh-ecommerce/shared';
import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key used to store permission requirements on handlers.
 */
export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator that sets the permissions required to access a controller or method.
 *
 * @param permissions List of Permission values that are allowed.
 * @returns A NestJS custom decorator that stores permission metadata.
 */
export const Permissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
