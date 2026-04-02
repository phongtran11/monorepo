import { UploadResponseDto } from '@api/cloudinary/dto';
import { CLOUDINARY_CONFIG_TOKEN, CloudinaryConfig } from '@api/config';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  TransformationOptions,
  UploadApiErrorResponse,
  UploadApiResponse,
  v2 as cloudinary,
} from 'cloudinary';
import * as streamifier from 'streamifier';

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
   * Uploads a single image from buffer to Cloudinary.
   *
   * @param file - Express.Multer.File object containing the image buffer.
   * @param folder - Cloudinary folder name (uses default if not provided).
   * @returns UploadResponseDto containing uploaded image details.
   */
  async uploadImage(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<UploadResponseDto> {
    return new Promise((resolve, reject) => {
      let isResolved = false;

      const handleReject = (error: Error | UploadApiErrorResponse) => {
        if (!isResolved) {
          isResolved = true;
          reject(
            new BadRequestException(
              `Lỗi tải ảnh lên Cloudinary: ${error.message}`,
            ),
          );
        }
      };

      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: folder || this.defaultFolder },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error) {
            handleReject(error);
          } else if (!result) {
            handleReject(new Error('Cloudinary upload returned no result'));
          } else {
            if (!isResolved) {
              isResolved = true;
              resolve({
                publicId: result.public_id,
                url: result.secure_url,
                width: result.width,
                height: result.height,
                format: result.format,
              });
            }
          }
        },
      );

      const readStream = streamifier.createReadStream(file.buffer);

      readStream.on('error', (error) => handleReject(error));
      uploadStream.on('error', (error) => handleReject(error));

      readStream.pipe(uploadStream);
    });
  }

  /**
   * Uploads multiple images in parallel to Cloudinary.
   *
   * @param files - Array of image files (Express.Multer.File).
   * @param folder - Cloudinary folder name.
   * @returns Array of UploadResponseDto.
   */
  async uploadMultipleImages(
    files: Express.Multer.File[],
    folder?: string,
  ): Promise<UploadResponseDto[]> {
    const results = await Promise.allSettled(
      files.map((file) => this.uploadImage(file, folder)),
    );

    const fulfilled = results
      .filter(
        (r): r is PromiseFulfilledResult<UploadResponseDto> =>
          r.status === 'fulfilled',
      )
      .map((r) => r.value);

    const rejected = results.filter(
      (r): r is PromiseRejectedResult => r.status === 'rejected',
    );

    if (rejected.length > 0) {
      // Cleanup successful uploads if any failed
      if (fulfilled.length > 0) {
        await this.deleteMultipleImages(fulfilled.map((f) => f.publicId));
      }

      throw new BadRequestException(
        `Lỗi khi tải nhiều ảnh lên Cloudinary: ${rejected.length} ảnh thất bại`,
      );
    }

    return fulfilled;
  }

  /**
   * Deletes an image from Cloudinary by its public ID.
   *
   * @param publicId - Public ID of the image to delete.
   * @returns Deletion result ('ok' or 'not found').
   */
  async deleteImage(publicId: string): Promise<'ok' | 'not found'> {
    try {
      const result = (await cloudinary.uploader.destroy(publicId)) as {
        result: 'ok' | 'not found';
      };
      return result.result;
    } catch (error) {
      throw new BadRequestException(
        `Lỗi khi xóa ảnh trên Cloudinary: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Deletes multiple images from Cloudinary by their public IDs.
   *
   * @param publicIds - Array of public IDs to delete.
   */
  async deleteMultipleImages(publicIds: string[]): Promise<void> {
    if (!publicIds || publicIds.length === 0) return;

    try {
      await cloudinary.api.delete_resources(publicIds);
    } catch (error) {
      throw new BadRequestException(
        `Lỗi khi xóa nhiều ảnh trên Cloudinary: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Generates an image URL with transformation parameters.
   *
   * @param publicId - Public ID of the image.
   * @param options - Resize, crop, quality, format, etc.
   * @returns Processed image URL.
   */
  generateTransformUrl(
    publicId: string,
    options: TransformationOptions,
  ): string {
    return cloudinary.url(publicId, options);
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
      const uploadStream = cloudinary.uploader.upload_stream(
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
              new BadRequestException('Cloudinary upload returned no result'),
            );
          }
          resolve({
            publicId: result.public_id,
            secureUrl: result.secure_url,
          });
        },
      );

      streamifier.createReadStream(buffer).pipe(uploadStream);
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

      const result = (await cloudinary.uploader.rename(publicId, newPublicId, {
        overwrite: true,
        invalidate: true,
      })) as UploadApiResponse;

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
