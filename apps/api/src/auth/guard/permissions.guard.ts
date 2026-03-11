import {
  Permission,
  RolePermissionsMap,
} from '@lam-thinh-ecommerce/shared/constants';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PERMISSIONS_KEY } from '../../common/decorator/permissions.decorator';
import { AuthRequest } from '../jwt.type';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

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
