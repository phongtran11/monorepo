import { CLOUDINARY_CONFIG_TOKEN, CloudinaryConfig } from '@api/config';
import { ERROR_CODES } from '@lam-thinh-ecommerce/shared';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

import { UploadSignature } from './types/cloudinary.types';

/**
 * Service for handling media uploads and deletions using Cloudinary.
 */
@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly uploadFolder: string;
  private readonly apiKey: string;

  /**
   * Creates an instance of the CloudinaryService.
   *
   * @param configService - The configuration service to access environment variables.
   */
  constructor(private readonly configService: ConfigService) {
    const config = this.configService.getOrThrow<CloudinaryConfig>(
      CLOUDINARY_CONFIG_TOKEN,
    );
    this.uploadFolder = config.defaultFolder;
    this.apiKey = config.apiKey;
  }

  /**
   * Generates a short-lived signed upload signature for direct browser uploads.
   * The signature covers the folder and timestamp — expires after 1 hour per Cloudinary spec.
   * The api_secret never leaves the server.
   */
  generateSignature(): UploadSignature {
    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = { folder: this.uploadFolder, timestamp };
    const cloudinaryConfig = this.configService.getOrThrow<CloudinaryConfig>(
      CLOUDINARY_CONFIG_TOKEN,
    );
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      cloudinaryConfig.apiSecret,
    );
    return {
      cloudName: cloudinaryConfig.cloudName,
      signature,
      timestamp,
      apiKey: this.apiKey,
      folder: this.uploadFolder,
    };
  }

  /**
   * Verifies that a Cloudinary asset exists and belongs to the allowed upload folder.
   * Throws BadRequestException if the asset does not exist or is outside the allowed folder.
   *
   * @param publicId - The Cloudinary public ID to verify.
   */
  async verifyAsset(publicId: string): Promise<void> {
    if (!publicId.startsWith(this.uploadFolder + '/')) {
      throw new BadRequestException(ERROR_CODES.INVALID_IMAGE_FILE);
    }

    try {
      await cloudinary.api.resource(publicId);
    } catch {
      throw new BadRequestException(ERROR_CODES.IMAGE_NOT_FOUND);
    }
  }

  /**
   * Deletes an asset from Cloudinary.
   *
   * @param publicId - The public ID of the asset to delete.
   */
  async deleteAsset(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      this.logger.error(`Failed to delete asset ${publicId}`, error);
    }
  }
}
