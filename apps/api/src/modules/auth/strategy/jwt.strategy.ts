import { JWT_CONFIG_TOKEN, JwtConfig } from '@api/config';
import { AuthUser, JwtPayload } from '@api/modules/auth/jwt.type';
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
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.getOrThrow<JwtConfig>(JWT_CONFIG_TOKEN).accessSecret,
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
