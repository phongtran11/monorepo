import { randomUUID } from 'node:crypto';

import { CloudinaryService } from '@api/cloudinary/service/cloudinary.service';
import { RedisService } from '@api/common/redis/redis.service';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';

/**
 * Metadata stored in Redis for a temporary upload.
 */
export interface TempUploadMeta {
  /** The public ID of the uploaded asset in Cloudinary. */
  publicId: string;
  /** The secure URL to access the uploaded asset. */
  secureUrl: string;
  /** The ID of the user who uploaded the asset. */
  userId: string;
}

/**
 * Service for managing temporary file uploads.
 */
@Injectable()
export class TempUploadService {
  private readonly REDIS_PREFIX = 'temp_upload:';
  private readonly TTL_24H = 24 * 60 * 60;
  private readonly logger = new Logger(TempUploadService.name);

  /**
   * Creates an instance of the TempUploadService.
   *
   * @param cloudinaryService - Service to interact with Cloudinary.
   * @param redisService - Service to interact with Redis.
   */
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Saves temporary upload metadata to Redis after uploading to Cloudinary.
   *
   * @param userId - The ID of the user uploading the file.
   * @param file - The file to upload.
   * @returns The tempId, tempUrl, and expiration time.
   */
  async saveTempMeta(userId: string, file: Express.Multer.File) {
    this.logger.debug(`Saving temp meta for user ${userId}`);

    const { publicId, secureUrl } = await this.cloudinaryService.uploadToTemp(
      file.buffer,
      userId,
    );

    const tempId = randomUUID();
    const meta: TempUploadMeta = { publicId, secureUrl, userId };

    this.logger.debug(`Saving temp meta: ${JSON.stringify(meta)}`);

    await this.redisService.set(
      `${this.REDIS_PREFIX}${tempId}`,
      JSON.stringify(meta),
      this.TTL_24H,
    );

    return {
      tempId,
      tempUrl: secureUrl,
      expiresIn: this.TTL_24H,
    };
  }

  /**
   * Consumes temporary upload metadata from Redis.
   * Validates ownership and deletes the key after retrieval.
   *
   * @param tempId - The temporary ID.
   * @param userId - The ID of the user consuming the metadata.
   * @returns The metadata.
   */
  async consumeTempMeta(
    tempId: string,
    userId: string,
  ): Promise<TempUploadMeta> {
    const key = `${this.REDIS_PREFIX}${tempId}`;
    const data = await this.redisService.get(key);

    if (!data) {
      throw new BadRequestException('Mã upload không tồn tại hoặc đã hết hạn');
    }

    const meta = JSON.parse(data) as TempUploadMeta;

    this.logger.debug(`Consuming temp meta: ${JSON.stringify(meta)}`);

    if (meta.userId !== userId) {
      throw new BadRequestException('Bạn không có quyền sử dụng mã upload này');
    }

    await this.redisService.del(key);
    return meta;
  }

  /**
   * Cancels a temporary upload by deleting the Cloudinary asset and Redis key.
   *
   * @param tempId - The temporary ID.
   * @param userId - The ID of the user cancelling the upload.
   */
  async cancelTemp(tempId: string, userId: string): Promise<void> {
    const key = `${this.REDIS_PREFIX}${tempId}`;
    const data = await this.redisService.get(key);

    if (!data) {
      throw new BadRequestException('Mã upload không tồn tại hoặc đã hết hạn');
    }

    const meta = JSON.parse(data) as TempUploadMeta;

    this.logger.debug(`Canceling temp meta: ${JSON.stringify(meta)}`);

    if (meta.userId !== userId) {
      throw new BadRequestException('Bạn không có quyền hủy mã upload này');
    }

    await this.cloudinaryService.deleteAsset(meta.publicId);
    await this.redisService.del(key);
  }
}
