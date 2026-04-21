import { CLOUDINARY_CONFIG_TOKEN, CloudinaryConfig } from '@api/config';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

/**
 * Service for handling media uploads and deletions using Cloudinary.
 */
@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  /**
   * The folder prefix that all uploaded assets must belong to.
   */
  private readonly uploadFolder: string;

  /**
   * Creates an instance of the CloudinaryService.
   *
   * @param configService - The configuration service to access environment variables.
   */
  constructor(private readonly configService: ConfigService) {
    this.uploadFolder = this.configService.getOrThrow<CloudinaryConfig>(
      CLOUDINARY_CONFIG_TOKEN,
    ).defaultFolder;
  }

  /**
   * Verifies that a Cloudinary asset exists and belongs to the allowed upload folder.
   * Throws BadRequestException if the asset does not exist or is outside the allowed folder.
   *
   * @param publicId - The Cloudinary public ID to verify.
   */
  async verifyAsset(publicId: string): Promise<void> {
    if (!publicId.startsWith(this.uploadFolder + '/')) {
      throw new BadRequestException(
        `Asset phải nằm trong thư mục ${this.uploadFolder}`,
      );
    }

    try {
      await cloudinary.api.resource(publicId);
    } catch {
      throw new BadRequestException(
        'Asset không tồn tại trên Cloudinary hoặc đã bị xóa',
      );
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
