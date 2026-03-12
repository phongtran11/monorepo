import { Env } from '@api/config';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: folder || this.defaultFolder },
        (error: UploadApiErrorResponse, result: UploadApiResponse) => {
          if (error) {
            reject(
              new HttpException(
                `Cloudinary upload error: ${error.message}`,
                HttpStatus.BAD_REQUEST,
              ),
            );
          } else {
            resolve({
              publicId: result.public_id,
              url: result.secure_url,
              width: result.width,
              height: result.height,
              format: result.format,
            });
          }
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
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
    try {
      const uploadPromises = files.map((file) =>
        this.uploadImage(file, folder),
      );
      return await Promise.all(uploadPromises);
    } catch (error) {
      throw new HttpException(
        'Error uploading multiple images to Cloudinary',
        HttpStatus.BAD_REQUEST,
        { cause: error },
      );
    }
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
      throw new HttpException(
        `Error deleting image from Cloudinary: ${(error as Error).message}`,
        HttpStatus.BAD_REQUEST,
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
      throw new HttpException(
        `Error deleting multiple images from Cloudinary: ${(error as Error).message}`,
        HttpStatus.BAD_REQUEST,
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
