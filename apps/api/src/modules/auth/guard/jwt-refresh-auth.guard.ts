import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard that validates the JWT refresh token for authentication.
 * Extends the NestJS AuthGuard with the 'jwt-refresh' strategy.
 */
@Injectable()
export class JwtRefreshAuthGuard extends AuthGuard('jwt-refresh') {}
