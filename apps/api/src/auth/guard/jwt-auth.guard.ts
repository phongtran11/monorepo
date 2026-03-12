import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard that validates the JWT access token for authentication.
 * Extends the NestJS AuthGuard with the 'jwt' strategy.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
