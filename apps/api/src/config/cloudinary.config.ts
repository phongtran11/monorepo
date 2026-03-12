import { registerAs } from '@nestjs/config';

/**
 * Cloudinary configuration object.
 * Contains credentials and default settings for Cloudinary image service.
 */
export const cloudinaryConfig = registerAs('cloudinary', () => ({
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
  defaultFolder: process.env.CLOUDINARY_DEFAULT_FOLDER || 'uploads',
}));

/**
 * Type inferred from the Cloudinary configuration.
 */
export type CloudinaryConfig = ReturnType<typeof cloudinaryConfig>;
