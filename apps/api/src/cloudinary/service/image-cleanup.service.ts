import { ImageService } from '@api/cloudinary/service/image.service';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

/**
 * Service that runs a periodic cron job to clean up orphaned pending images.
 * Images with status 'pending' older than 1 hour are deleted from both
 * Cloudinary and the database.
 */
@Injectable()
export class ImageCleanupService {
  private readonly logger = new Logger(ImageCleanupService.name);

  /**
   * Creates an instance of the ImageCleanupService.
   *
   * @param imageService - Service for image database operations.
   */
  constructor(private readonly imageService: ImageService) {}

  /**
   * Runs every hour to purge abandoned pending uploads.
   */
  @Cron('0 * * * *')
  async handlePendingImageCleanup(): Promise<void> {
    this.logger.debug('Running pending image cleanup cron');
    try {
      await this.imageService.cleanupPendingOrphans();
    } catch (error) {
      this.logger.error('Pending image cleanup failed', error);
    }
  }
}
