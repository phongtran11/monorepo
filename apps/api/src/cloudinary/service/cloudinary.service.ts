import { CLOUDINARY_CONFIG_TOKEN, CloudinaryConfig } from '@api/config';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';

/**
 * Service for handling media uploads and deletions using Cloudinary.
 */
@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  /**
   * The default folder where images will be uploaded if no folder is specified.
   */
  private defaultFolder: string;

  /**
   * Creates an instance of the CloudinaryService.
   *
   * @param configService - The configuration service to access environment variables.
   */
  constructor(private readonly configService: ConfigService) {
    this.defaultFolder = this.configService.getOrThrow<CloudinaryConfig>(
      CLOUDINARY_CONFIG_TOKEN,
    ).defaultFolder;
  }

  /**
   * Uploads an image from buffer to the temporary folder.
   *
   * @param buffer - The image buffer to upload.
   * @param userId - The ID of the user uploading the file.
   * @returns The public ID and secure URL of the uploaded image.
   */
  async uploadToTemp(
    buffer: Buffer,
    userId: string,
  ): Promise<{ publicId: string; secureUrl: string }> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'temp',
            tags: ['temp', `user_${userId}`],
          },
          (error, result) => {
            if (error) {
              return reject(
                new BadRequestException(
                  `Lỗi tải ảnh tạm lên Cloudinary: ${error.message}`,
                ),
              );
            }
            if (!result) {
              return reject(
                new BadRequestException(
                  'Kết quả tải ảnh tạm lên Cloudinary không hợp lệ',
                ),
              );
            }
            resolve({
              publicId: result.public_id,
              secureUrl: result.secure_url,
            });
          },
        )
        .end(buffer);
    });
  }

  /**
   * Moves a temporary asset to a permanent location.
   *
   * @param publicId - The public ID of the temporary asset.
   * @param destinationFolder - The destination folder path.
   * @returns The updated public ID and secure URL.
   */
  async moveToPermanent(
    publicId: string,
    destinationFolder: string,
  ): Promise<{ publicId: string; secureUrl: string }> {
    try {
      const fileName = publicId.split('/').pop();
      const newPublicId = `${destinationFolder}/${fileName}`;

      this.logger.debug(`Moving ${publicId} to ${newPublicId}`);

      const result = (await cloudinary.uploader.rename(publicId, newPublicId, {
        overwrite: true,
        invalidate: true,
      })) as UploadApiResponse;

      this.logger.debug(`Moved ${publicId} to permanent folder`);

      await cloudinary.uploader.remove_tag('temp', [result.public_id]);

      return { publicId: result.public_id, secureUrl: result.secure_url };
    } catch (error) {
      throw new BadRequestException(
        `Lỗi khi di chuyển ảnh Cloudinary: ${(error as Error).message}`,
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
