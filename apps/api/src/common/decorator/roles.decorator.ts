import { Role } from '@lam-thinh-ecommerce/shared';
import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key used to store role requirements on handlers.
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator that sets the roles required to access a controller or method.
 *
 * @param roles List of Role values that are allowed.
 * @returns A NestJS custom decorator that stores role metadata.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
