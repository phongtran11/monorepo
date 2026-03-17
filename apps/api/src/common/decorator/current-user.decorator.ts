import { AuthUser } from '@api/auth/jwt.type';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Decorator to extract the current authenticated user from the request context.
 * Use with @JwtAuthGuard to ensure the request is authenticated.
 *
 * @example
 * async create(@CurrentUser() user: AuthUser) {
 *   // user is available
 * }
 */
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: AuthUser }>();
    return request.user;
  },
);
