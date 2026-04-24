import { registerAs } from '@nestjs/config';

export const CLOUDINARY_CONFIG_TOKEN = 'cloudinary';

/**
 * Cloudinary configuration object.
 * Contains credentials and default settings for Cloudinary image service.
 */
export const cloudinaryConfig = registerAs(CLOUDINARY_CONFIG_TOKEN, () => ({
  cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
  apiKey: process.env.CLOUDINARY_API_KEY!,
  apiSecret: process.env.CLOUDINARY_API_SECRET!,
  defaultFolder: process.env.CLOUDINARY_DEFAULT_FOLDER!,
}));

/**
 * Type inferred from the Cloudinary configuration.
 */
export type CloudinaryConfig = ReturnType<typeof cloudinaryConfig>;
