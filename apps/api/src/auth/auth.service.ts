import { AccountStatus } from '@lam-thinh-ecommerce/shared/constants';
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
import { User } from '../user/user.entity';
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
      throw new ConflictException('Email đã tồn tại');
    }

    const hashedPassword = await argon2.hash(dto.password, {
      secret: Buffer.from(
        this.configService.getOrThrow('PASSWORD_HASH_SECRET'),
      ),
    });
    const user = await this.userService.create(dto.email, hashedPassword);

    return this.generateTokens(user, ip, userAgent);
  }

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const user = await this.userService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại');
    }

    if (user.status === AccountStatus.BANNED) {
      throw new UnauthorizedException('Tài khoản của bạn đã bị khoá');
    }

    const isPasswordValid = await argon2.verify(user.password, dto.password, {
      secret: Buffer.from(
        this.configService.getOrThrow('PASSWORD_HASH_SECRET'),
      ),
    });

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    return this.generateTokens(user, ip, userAgent);
  }

  private async generateTokens(user: User, ip?: string, userAgent?: string) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };

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
      userId: user.id,
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
      throw new UnauthorizedException(
        'Phiên đăng nhập đã hết hạn hoặc không hợp lệ',
      );
    }

    const user = await this.userService.findById(userId);
    if (!user || user.status === AccountStatus.BANNED) {
      await this.sessionRepository.remove(session);
      throw new UnauthorizedException('Tài khoản không tồn tại hoặc bị khoá');
    }

    const isTokenValid = await argon2.verify(session.refreshToken, rawToken, {
      secret: Buffer.from(
        this.configService.getOrThrow('PASSWORD_HASH_SECRET'),
      ),
    });
    if (!isTokenValid) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    await this.sessionRepository.remove(session);

    return this.generateTokens(user, ip, userAgent);
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
