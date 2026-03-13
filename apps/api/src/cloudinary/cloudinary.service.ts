import { Env } from '@api/config';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  TransformationOptions,
  UploadApiErrorResponse,
  UploadApiResponse,
  v2 as cloudinary,
} from 'cloudinary';
import * as streamifier from 'streamifier';

import { UploadResponseDto } from './dto/upload-response.dto';

/**
 * Service for handling media uploads and deletions using Cloudinary.
 */
@Injectable()
export class CloudinaryService {
  /**
   * The default folder where images will be uploaded if no folder is specified.
   */
  private defaultFolder: string;

  /**
   * Creates an instance of the CloudinaryService.
   *
   * @param configService - The configuration service to access environment variables.
   */
  constructor(private readonly configService: ConfigService<Env>) {
    this.defaultFolder = configService.getOrThrow('CLOUDINARY_DEFAULT_FOLDER');
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
}
