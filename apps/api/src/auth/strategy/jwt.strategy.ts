import { AuthUser, JwtPayload } from '@api/auth/jwt.type';
import { Env } from '@api/config';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * Strategy for validating JWT access tokens.
 * Extracts the token from the Authorization header and validates its payload.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(jwt: ConfigService<Env>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwt.getOrThrow('JWT_ACCESS_SECRET'),
    });
  }

  /**
   * Validates the JWT payload and returns the authenticated user information.
   *
   * @param payload - The decoded JWT payload.
   * @returns The authenticated user object.
   */
  validate(payload: JwtPayload): AuthUser {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      status: payload.status,
    };
  }
}
