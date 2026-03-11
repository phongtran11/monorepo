import { Role } from '@lam-thinh-ecommerce/shared/constants';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../../common/decorator/roles.decorator';
import { AuthRequest } from '../jwt.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

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
