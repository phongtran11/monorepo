import { CLOUDINARY_CONFIG_TOKEN, CloudinaryConfig } from '@api/config';
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

/**
 * Token used for injecting the Cloudinary instance.
 */
export const CLOUDINARY = 'CLOUDINARY';

/**
 * Provider for the Cloudinary instance, configuring it with credentials from the config service.
 */
export const CloudinaryProvider: Provider = {
  provide: CLOUDINARY,
  inject: [ConfigService],
  /**
   * Factory function to create and configure a Cloudinary instance.
   *
   * @param configService - The service used to retrieve configuration.
   * @returns The configured Cloudinary instance.
   */
  useFactory: (configService: ConfigService) => {
    const config = configService.getOrThrow<CloudinaryConfig>(
      CLOUDINARY_CONFIG_TOKEN,
    );
    return cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
    });
  },
};
