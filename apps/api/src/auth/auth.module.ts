import { UserModule } from '@api/user/user.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Session } from './session.entity';
import { SessionRepository } from './session.repository';
import { JwtRefreshStrategy, JwtStrategy } from './strategy';

/**
 * Module for handling authentication and session management.
 * Provides services, controllers, and strategies for JWT-based auth.
 */
@Module({
  imports: [UserModule, TypeOrmModule.forFeature([Session])],
  controllers: [AuthController],
  providers: [AuthService, SessionRepository, JwtStrategy, JwtRefreshStrategy],
  exports: [AuthService, SessionRepository],
})
export class AuthModule {}
