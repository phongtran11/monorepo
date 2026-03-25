import { TokenDto } from '@api/auth/dto/token.dto';
import { Env } from '@api/config';
import { User } from '@api/user/user.entity';
import { UserService } from '@api/user/user.service';
import { AccountStatus } from '@lam-thinh-ecommerce/shared';
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

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SessionRepository } from './session.repository';

/**
 * Service providing authentication and authorization functionality.
 * Handles user registration, login, token generation, token refresh, and logout.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<Env>,
    private readonly sessionRepository: SessionRepository,
  ) {}

  /**
   * Registers a new user and generates authentication tokens.
   *
   * @param dto - The registration data.
   * @param ip - (Optional) The IP address of the user.
   * @param userAgent - (Optional) The user agent string of the user.
   * @returns A promise that resolves to the generated authentication tokens.
   * @throws ConflictException if the email already exists.
   */
  async register(dto: RegisterDto, ip?: string, userAgent?: string) {
    const existing = await this.userService.findByEmailWithDeleted(dto.email);

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

  /**
   * Authenticates a user and generates authentication tokens.
   *
   * @param dto - The login credentials.
   * @param ip - (Optional) The IP address of the user.
   * @param userAgent - (Optional) The user agent string of the user.
   * @returns A promise that resolves to the generated authentication tokens.
   * @throws UnauthorizedException if the user doesn't exist, is banned, or has incorrect credentials.
   */
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

  /**
   * Generates new access and refresh tokens for a user and saves the session.
   *
   * @param user - The user for whom to generate tokens.
   * @param ip - (Optional) The user's IP address.
   * @param userAgent - (Optional) The user's user agent string.
   * @returns A promise that resolves to the access and refresh tokens with expiration times.
   */
  private async generateTokens(
    user: User,
    ip?: string,
    userAgent?: string,
  ): Promise<TokenDto> {
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

    const accessTokenExpiresIn =
      Number(ms(this.configService.getOrThrow('JWT_ACCESS_EXPIRATION'))) / 1000; // convert to seconds
    const refreshTokenExpiresIn =
      Number(ms(this.configService.getOrThrow('JWT_REFRESH_EXPIRATION'))) /
      1000;

    return {
      accessToken,
      accessTokenExpiresIn,
      refreshToken,
      refreshTokenExpiresIn,
    };
  }

  /**
   * Refreshes the authentication tokens using a valid refresh token.
   *
   * @param userId - The ID of the user.
   * @param jti - The unique ID of the refresh token session.
   * @param rawToken - The raw refresh token string.
   * @param ip - (Optional) The new IP address.
   * @param userAgent - (Optional) The new user agent string.
   * @returns A promise that resolves to the new authentication tokens.
   * @throws UnauthorizedException if the session is invalid, expired, or the user is banned.
   */
  async refreshToken(
    userId: string,
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

  /**
   * Logs out the user by removing their current session.
   *
   * @param userId - The ID of the user.
   * @param jti - The unique ID of the session to remove.
   * @returns A promise that resolves when the session is removed.
   */
  async logout(userId: string, jti: string) {
    const session = await this.sessionRepository.findOne({
      where: { id: jti, userId },
    });

    if (session) {
      await this.sessionRepository.remove(session);
    }
  }
}
