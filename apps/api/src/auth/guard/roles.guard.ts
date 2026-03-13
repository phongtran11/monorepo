import { AuthRequest } from '@api/auth/jwt.type';
import { ROLES_KEY } from '@api/common';
import { Role } from '@lam-thinh-ecommerce/shared';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Guard that checks if the authenticated user has one of the required roles.
 * Roles are defined via the `@Roles()` decorator.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * Determines if the current user has one of the required roles to access the resource.
   *
   * @param context - The execution context of the request.
   * @returns A boolean indicating if access is allowed.
   * @throws ForbiddenException if the user does not have any of the required roles.
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // No @Roles() decorator -> public access (if no JwtGuard) or allow all roles
    }

    const { user } = context.switchToHttp().getRequest<AuthRequest>();

    if (!user) {
      return false; // User not found from request
    }

    // Checking if the user has one of the required roles
    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập tài nguyên này.',
      );
    }

    return true;
  }
}
