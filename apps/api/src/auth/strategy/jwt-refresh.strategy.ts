import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Env } from 'src/config';

import { RefreshAuthUser, RefreshTokenPayload } from '../jwt.type';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private readonly configService: ConfigService<Env>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: RefreshTokenPayload): RefreshAuthUser {
    const refreshToken = req.get('Authorization')?.replace('Bearer', '').trim();
    if (!refreshToken)
      throw new UnauthorizedException('Refresh token malformed');

    return {
      id: payload.sub,
      email: payload.email,
      jti: payload.jti,
      refreshToken,
    };
  }
}
