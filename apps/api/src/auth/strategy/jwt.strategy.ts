import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Env } from 'src/config';

import { AuthUser, JwtPayload } from '../jwt.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(jwt: ConfigService<Env>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwt.getOrThrow('JWT_ACCESS_SECRET'),
    });
  }

  validate(payload: JwtPayload): AuthUser {
    return { id: payload.sub, email: payload.email };
  }
}
