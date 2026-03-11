import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { JwtRefreshAuthGuard } from './guard/jwt-refresh-auth.guard';
import { AuthUser, RefreshAuthUser } from './jwt.type';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(
    @Body() dto: RegisterDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.register(dto, ip, userAgent);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(
    @Body() dto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.login(dto, ip, userAgent);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getProfile(@Request() req: { user: AuthUser }) {
    return req.user;
  }

  @Post('refresh')
  @UseGuards(JwtRefreshAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  refresh(
    @Request()
    req: {
      user: RefreshAuthUser;
    },
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.refreshToken(
      req.user.id,
      req.user.email,
      req.user.jti,
      req.user.refreshToken,
      ip,
      userAgent,
    );
  }

  @Post('logout')
  @UseGuards(JwtRefreshAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  logout(
    @Request()
    req: {
      user: RefreshAuthUser;
    },
  ) {
    return this.authService.logout(req.user.id, req.user.jti);
  }
}
