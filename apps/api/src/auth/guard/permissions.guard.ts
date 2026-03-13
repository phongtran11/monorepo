import { AuthRequest } from '@api/auth/jwt.type';
import { PERMISSIONS_KEY } from '@api/common';
import { Permission, RolePermissionsMap } from '@lam-thinh-ecommerce/shared';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Guard that checks if the authenticated user has the required permissions.
 * Permissions are defined via the `@Permissions()` decorator.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * Determines if the current user has permission to access the resource.
   *
   * @param context - The execution context of the request.
   * @returns A boolean indicating if access is allowed.
   * @throws ForbiddenException if the user lacks any of the required permissions.
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true; // No @Permissions() decorator -> public access (if no JwtGuard) or allow all
    }

    const { user } = context.switchToHttp().getRequest<AuthRequest>();

    if (!user) {
      return false; // User not found from request
    }

    // Checking if the user has the required permissions based on their role
    const userPermissions = RolePermissionsMap[user.role] || [];
    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'Bạn không có quyền thực hiện hành động này.',
      );
    }

    return true;
  }
}
