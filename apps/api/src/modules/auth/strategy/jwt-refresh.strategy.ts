import { JWT_CONFIG_TOKEN, JwtConfig } from '@api/config';
import { ERROR_CODES } from '@lam-thinh-ecommerce/shared';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { RefreshAuthUser, RefreshTokenPayload } from '../jwt.type';

/**
 * Strategy for validating JWT refresh tokens.
 * Extracts the token from the Authorization header and validates its payload,
 * ensuring the token is still valid for a refresh operation.
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.getOrThrow<JwtConfig>(JWT_CONFIG_TOKEN).refreshSecret,
      passReqToCallback: true,
    });
  }

  /**
   * Validates the JWT refresh token payload and returns the refresh user information.
   *
   * @param req - The current request object.
   * @param payload - The decoded refresh token payload.
   * @returns The user information, including the refresh token.
   * @throws UnauthorizedException if the refresh token is missing or malformed.
   */
  validate(req: Request, payload: RefreshTokenPayload): RefreshAuthUser {
    const refreshToken = req.get('Authorization')?.replace('Bearer', '').trim();
    if (!refreshToken) {
      throw new UnauthorizedException(ERROR_CODES.INVALID_REFRESH_TOKEN_FORMAT);
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      status: payload.status,
      jti: payload.jti,
      refreshToken,
    };
  }
}
