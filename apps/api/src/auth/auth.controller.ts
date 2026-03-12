import { ApiResponseDto, ApiResponseOf } from '@api/common';
import { RolePermissionsMap } from '@lam-thinh-ecommerce/shared';
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
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginDto, ProfileDto, RegisterDto, TokenDto } from './dto';
import { JwtAuthGuard, JwtRefreshAuthGuard } from './guard';
import type { AuthRequest, RefreshAuthRequest } from './jwt.type';

/**
 * Controller for handling authentication-related requests.
 * Provides endpoints for registration, login, profile retrieval, token refresh, and logout.
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Registers a new user.
   *
   * @param dto - The registration data transfer object.
   * @param ip - The IP address of the requester.
   * @param userAgent - The user agent string of the requester.
   * @returns A promise that resolves to an ApiResponseDto containing the authentication tokens.
   */
  @Post('register')
  @ApiCreatedResponse({ type: ApiResponseOf(TokenDto) })
  async register(
    @Body() dto: RegisterDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<ApiResponseDto<TokenDto>> {
    const data = await this.authService.register(dto, ip, userAgent);

    return ApiResponseDto.success(data);
  }

  /**
   * Authenticates a user and returns authentication tokens.
   *
   * @param dto - The login data transfer object.
   * @param ip - The IP address of the requester.
   * @param userAgent - The user agent string of the requester.
   * @returns A promise that resolves to an ApiResponseDto containing the authentication tokens.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: ApiResponseOf(TokenDto) })
  async login(
    @Body() dto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<ApiResponseDto<TokenDto>> {
    const data = await this.authService.login(dto, ip, userAgent);

    return ApiResponseDto.success(data);
  }

  /**
   * Retrieves the profile information of the currently authenticated user.
   *
   * @param req - The authenticated request object.
   * @returns An ApiResponseDto containing the user's profile and permissions.
   */
  @Get('profile')
  @ApiOkResponse({ type: ApiResponseOf(ProfileDto) })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getProfile(@Request() req: AuthRequest): ApiResponseDto<ProfileDto> {
    return ApiResponseDto.success({
      ...req.user,
      permissions: RolePermissionsMap[req.user.role] || [],
    });
  }

  /**
   * Refreshes the authentication tokens using a refresh token.
   *
   * @param req - The authenticated refresh request object.
   * @param ip - The IP address of the requester.
   * @param userAgent - The user agent string of the requester.
   * @returns A promise that resolves to an ApiResponseDto containing the new authentication tokens.
   */
  @Post('refresh')
  @UseGuards(JwtRefreshAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Request() req: RefreshAuthRequest,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const data = await this.authService.refreshToken(
      req.user.id,
      req.user.jti,
      req.user.refreshToken,
      ip,
      userAgent,
    );
    return ApiResponseDto.success(data);
  }

  /**
   * Logs out the user by invalidating the current session.
   *
   * @param req - The authenticated refresh request object.
   * @returns A promise that resolves to an ApiResponseDto indicating successful logout.
   */
  @Post('logout')
  @UseGuards(JwtRefreshAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: RefreshAuthRequest) {
    await this.authService.logout(req.user.id, req.user.jti);
    return ApiResponseDto.success(null);
  }
}
