import { CloudinaryProvider } from '@api/cloudinary/cloudinary.provider';
import { Image } from '@api/cloudinary/entities';
import { ImageRepository } from '@api/cloudinary/repositories';
import { CloudinaryService } from '@api/cloudinary/service/cloudinary.service';
import { ImageService } from '@api/cloudinary/service/image.service';
import { ImageCleanupService } from '@api/cloudinary/service/image-cleanup.service';
import { Global, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

/**
 * Global infrastructure module for Cloudinary integration.
 * Provides asset verification, image lifecycle management, and scheduled cleanup.
 * Images are tracked in the shared `images` table with lifecycle status (pending → permanent).
 */
@Global()
@Module({
  imports: [ScheduleModule.forRoot(), TypeOrmModule.forFeature([Image])],
  providers: [
    CloudinaryProvider,
    CloudinaryService,
    ImageRepository,
    ImageService,
    ImageCleanupService,
  ],
  exports: [CloudinaryProvider, CloudinaryService, ImageService],
})
export class CloudinaryModule {}
