import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';
import ms from 'ms';

import { Env } from '../config';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SessionRepository } from './session.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<Env>,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async register(dto: RegisterDto, ip?: string, userAgent?: string) {
    const existing = await this.userService.findByEmail(dto.email);

    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await argon2.hash(dto.password, {
      secret: Buffer.from(
        this.configService.getOrThrow('PASSWORD_HASH_SECRET'),
      ),
    });
    const user = await this.userService.create(dto.email, hashedPassword);

    return this.generateTokens(user.id, user.email, ip, userAgent);
  }

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const user = await this.userService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await argon2.verify(user.password, dto.password, {
      secret: Buffer.from(
        this.configService.getOrThrow('PASSWORD_HASH_SECRET'),
      ),
    });

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user.id, user.email, ip, userAgent);
  }

  private async generateTokens(
    userId: string,
    email: string,
    ip?: string,
    userAgent?: string,
  ) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.getOrThrow('JWT_ACCESS_EXPIRATION'),
    });

    const jti = randomUUID();
    const refreshTokenPayload = { ...payload, jti };

    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.getOrThrow('JWT_REFRESH_EXPIRATION'),
    });

    const hashedRefreshToken = await argon2.hash(refreshToken, {
      secret: Buffer.from(
        this.configService.getOrThrow('PASSWORD_HASH_SECRET'),
      ),
    });

    // parse expiration duration to save in db
    const expiresAt = new Date(
      Date.now() + ms(this.configService.getOrThrow('JWT_REFRESH_EXPIRATION')),
    );

    const session = this.sessionRepository.create({
      id: jti,
      userId,
      refreshToken: hashedRefreshToken,
      ip,
      userAgent,
      expiresAt,
    });

    await this.sessionRepository.save(session);

    return { accessToken, refreshToken };
  }

  async refreshToken(
    userId: string,
    email: string,
    jti: string,
    rawToken: string,
    ip?: string,
    userAgent?: string,
  ) {
    const session = await this.sessionRepository.findOne({
      where: { id: jti, userId },
    });

    if (!session || new Date() > session.expiresAt) {
      if (session) {
        await this.sessionRepository.remove(session);
      }
      throw new UnauthorizedException('Session expired or invalid');
    }

    const isTokenValid = await argon2.verify(session.refreshToken, rawToken, {
      secret: Buffer.from(
        this.configService.getOrThrow('PASSWORD_HASH_SECRET'),
      ),
    });
    if (!isTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.sessionRepository.remove(session);

    return this.generateTokens(userId, email, ip, userAgent);
  }

  async logout(userId: string, jti: string) {
    const session = await this.sessionRepository.findOne({
      where: { id: jti, userId },
    });

    if (session) {
      await this.sessionRepository.remove(session);
    }
  }
}
