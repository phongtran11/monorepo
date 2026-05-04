import { Env } from '@api/config';
import { User } from '@api/modules/user/user.entity';
import { UserPort } from '@api/modules/user/user.port';
import { AccountStatus, ERROR_CODES } from '@lam-thinh-ecommerce/shared';
import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';
import ms from 'ms';
import { DataSource, EntityManager, IsNull } from 'typeorm';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TokenDto } from './dto/token.dto';
import {
  decryptReplayPayload,
  encryptReplayPayload,
} from './replay-payload.crypto';
import { Session } from './session.entity';
import { SessionRepository } from './session.repository';

const REPLAY_GRACE_MS = 30_000;

/**
 * Service providing authentication and authorization functionality.
 * Handles user registration, login, token generation, token refresh, and logout.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserPort,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<Env>,
    private readonly sessionRepository: SessionRepository,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Registers a new user and generates authentication tokens.
   */
  async register(dto: RegisterDto, ip?: string, userAgent?: string) {
    const existing = await this.userService.findByEmailWithDeleted(dto.email);

    if (existing) {
      throw new ConflictException(ERROR_CODES.EMAIL_ALREADY_EXISTS);
    }

    const hashedPassword = await argon2.hash(dto.password, {
      secret: Buffer.from(
        this.configService.getOrThrow('PASSWORD_HASH_SECRET'),
      ),
    });
    const user = await this.userService.create(dto.email, hashedPassword);

    return this.issueRootSession(user, ip, userAgent);
  }

  /**
   * Authenticates a user and generates authentication tokens.
   */
  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const user = await this.userService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException(ERROR_CODES.ACCOUNT_NOT_FOUND);
    }

    if (user.status === AccountStatus.BANNED) {
      throw new UnauthorizedException(ERROR_CODES.ACCOUNT_LOCKED);
    }

    const isPasswordValid = await argon2.verify(user.password, dto.password, {
      secret: Buffer.from(
        this.configService.getOrThrow('PASSWORD_HASH_SECRET'),
      ),
    });

    if (!isPasswordValid) {
      throw new UnauthorizedException(ERROR_CODES.INVALID_CREDENTIALS);
    }

    return this.issueRootSession(user, ip, userAgent);
  }

  /**
   * Issues the first session of a new rotation chain (login/register).
   * The session's chainId is set to its own id.
   */
  private async issueRootSession(
    user: User,
    ip?: string,
    userAgent?: string,
  ): Promise<TokenDto> {
    const { tokens, session } = await this.buildTokens(user);
    session.ip = ip ?? null;
    session.userAgent = userAgent ?? null;
    session.chainId = session.id;
    await this.sessionRepository.save(session);
    return tokens;
  }

  /**
   * Pure computation: builds a JWT access/refresh pair and a Session entity
   * (not yet persisted). Caller is responsible for setting chainId and
   * saving the row within whatever transaction is appropriate.
   */
  private async buildTokens(
    user: User,
  ): Promise<{ tokens: TokenDto; session: Session }> {
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
    const refreshToken = this.jwtService.sign(
      { ...payload, jti },
      {
        secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.getOrThrow('JWT_REFRESH_EXPIRATION'),
      },
    );

    const hashedRefreshToken = await argon2.hash(refreshToken, {
      secret: Buffer.from(
        this.configService.getOrThrow('PASSWORD_HASH_SECRET'),
      ),
    });

    const expiresAt = new Date(
      Date.now() + ms(this.configService.getOrThrow('JWT_REFRESH_EXPIRATION')),
    );

    const session = this.sessionRepository.create({
      id: jti,
      userId: user.id,
      refreshToken: hashedRefreshToken,
      expiresAt,
      rotatedAt: null,
      replayPayload: null,
      replayExpiresAt: null,
      revokedAt: null,
    });

    const accessTokenExpiresIn =
      Number(ms(this.configService.getOrThrow('JWT_ACCESS_EXPIRATION'))) / 1000;
    const refreshTokenExpiresIn =
      Number(ms(this.configService.getOrThrow('JWT_REFRESH_EXPIRATION'))) /
      1000;

    const tokens: TokenDto = {
      accessToken,
      accessTokenExpiresIn,
      refreshToken,
      refreshTokenExpiresIn,
    };

    return { tokens, session };
  }

  /**
   * Refreshes the authentication tokens using a valid refresh token.
   *
   * Implements single-use rotation with an idempotent replay window:
   *   - First concurrent request rotates the session and stores the new
   *     TokenDto encrypted in replay_payload.
   *   - Subsequent requests arriving within REPLAY_GRACE_MS decrypt and
   *     return the same payload, so all concurrent callers converge on one
   *     new refresh token.
   *   - Replays after the grace window are treated as reuse and revoke the
   *     entire session chain.
   *
   * The entire flow runs inside a transaction with SELECT ... FOR UPDATE on
   * the session row, so concurrent refreshes on the same session serialize
   * cleanly: the first rotates, the rest see rotatedAt set and take the
   * replay branch.
   */
  async refreshToken(
    userId: string,
    jti: string,
    rawToken: string,
    ip?: string,
    userAgent?: string,
  ): Promise<TokenDto> {
    return this.dataSource.transaction(async (manager) => {
      const session = await manager.findOne(Session, {
        where: { id: jti, userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!session) {
        throw new UnauthorizedException(
          'Phiên đăng nhập đã hết hạn hoặc không hợp lệ',
        );
      }

      if (session.revokedAt) {
        this.logger.warn(
          `Refresh attempted on revoked session ${jti} for user ${userId}`,
        );
        throw new UnauthorizedException(ERROR_CODES.SESSION_REVOKED);
      }

      if (new Date() > session.expiresAt) {
        throw new UnauthorizedException(ERROR_CODES.SESSION_EXPIRED);
      }

      const isTokenValid = await argon2.verify(session.refreshToken, rawToken, {
        secret: Buffer.from(
          this.configService.getOrThrow('PASSWORD_HASH_SECRET'),
        ),
      });
      if (!isTokenValid) {
        throw new UnauthorizedException(ERROR_CODES.INVALID_TOKEN);
      }

      if (session.rotatedAt) {
        return this.handleReplay(manager, session);
      }

      const user = await this.userService.findById(userId);
      if (!user || user.status === AccountStatus.BANNED) {
        await this.revokeChain(manager, session.chainId);
        throw new UnauthorizedException(
          ERROR_CODES.ACCOUNT_NOT_FOUND_OR_LOCKED,
        );
      }

      return this.rotateSession(manager, session, user, ip, userAgent);
    });
  }

  /**
   * Replay branch: the session has already been rotated. If we're still
   * inside the grace window, return the stored payload. Otherwise the old
   * token is being reused after its replacement took effect — treat as
   * compromise and revoke the chain.
   */
  private async handleReplay(
    manager: EntityManager,
    session: Session,
  ): Promise<TokenDto> {
    const withinGrace =
      session.replayExpiresAt !== null &&
      new Date() < session.replayExpiresAt &&
      session.replayPayload !== null;

    if (!withinGrace) {
      this.logger.warn(
        `Refresh token reuse detected on session ${session.id} (chain ${session.chainId}); revoking chain`,
      );
      await this.revokeChain(manager, session.chainId);
      throw new UnauthorizedException(
        'Phiên đăng nhập đã bị thu hồi do phát hiện sử dụng lại token',
      );
    }

    const secret = this.configService.getOrThrow<string>(
      'PASSWORD_HASH_SECRET',
    );
    return decryptReplayPayload(session.replayPayload!, secret);
  }

  /**
   * Fresh rotation branch: generate a new token pair, persist the new
   * session as part of the same chain, and stamp the old session with the
   * encrypted replay payload + grace deadline.
   */
  private async rotateSession(
    manager: EntityManager,
    oldSession: Session,
    user: User,
    ip?: string,
    userAgent?: string,
  ): Promise<TokenDto> {
    const { tokens, session: newSession } = await this.buildTokens(user);
    newSession.ip = ip ?? null;
    newSession.userAgent = userAgent ?? null;
    newSession.chainId = oldSession.chainId;

    await manager.save(Session, newSession);

    const secret = this.configService.getOrThrow<string>(
      'PASSWORD_HASH_SECRET',
    );
    oldSession.rotatedAt = new Date();
    oldSession.replayPayload = encryptReplayPayload(tokens, secret);
    oldSession.replayExpiresAt = new Date(Date.now() + REPLAY_GRACE_MS);
    await manager.save(Session, oldSession);

    return tokens;
  }

  /**
   * Marks every session in a rotation chain as revoked. Used on logout and
   * on reuse detection.
   */
  private async revokeChain(
    manager: EntityManager,
    chainId: string,
  ): Promise<void> {
    await manager.update(
      Session,
      { chainId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  /**
   * Logs out the user by revoking the entire rotation chain for the given
   * session, so no leaked/rotated token from the same login can still be
   * used.
   */
  async logout(userId: string, jti: string) {
    const session = await this.sessionRepository.findOne({
      where: { id: jti, userId },
    });

    if (!session) return;

    await this.sessionRepository.manager.transaction(async (manager) => {
      await this.revokeChain(manager, session.chainId);
    });
  }
}
