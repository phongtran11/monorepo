import { JWT_CONFIG_TOKEN, JwtConfig } from '@api/config';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

/**
 * Registers JwtModule globally using the access token secret from ConfigService.
 */
@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwtConfig = configService.getOrThrow<JwtConfig>(JWT_CONFIG_TOKEN);
        return { secret: jwtConfig.accessSecret };
      },
    }),
  ],
  exports: [JwtModule],
})
export class JwtConfigModule {}
