import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Session } from './session.entity';
import { SessionRepository } from './session.repository';
import { JwtStrategy } from './strategy/jwt.strategy';
import { JwtRefreshStrategy } from './strategy/jwt-refresh.strategy';

@Module({
  imports: [UserModule, TypeOrmModule.forFeature([Session])],
  controllers: [AuthController],
  providers: [AuthService, SessionRepository, JwtStrategy, JwtRefreshStrategy],
  exports: [AuthService, SessionRepository],
})
export class AuthModule {}
