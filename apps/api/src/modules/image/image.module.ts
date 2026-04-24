import { Global, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Image } from './entities';
import { ImageRepository } from './repositories';
import { ImageService } from './services/image.service';
import { ImageCleanupService } from './services/image-cleanup.service';

/**
 * Global domain module for image lifecycle management.
 * Tracks Cloudinary assets in the shared `images` table.
 * Provides ImageService for registration, linking, and cleanup.
 */
@Global()
@Module({
  imports: [ScheduleModule.forRoot(), TypeOrmModule.forFeature([Image])],
  providers: [ImageRepository, ImageService, ImageCleanupService],
  exports: [ImageService],
})
export class ImageModule {}
