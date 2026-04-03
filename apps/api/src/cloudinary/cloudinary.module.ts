import { CleanupScheduler } from '@api/cloudinary/cleanup.scheduler';
import { CloudinaryProvider } from '@api/cloudinary/cloudinary.provider';
import { CloudinaryService } from '@api/cloudinary/service/cloudinary.service';
import { TempUploadService } from '@api/cloudinary/service/temp-upload.service';
import { UploadController } from '@api/cloudinary/upload.controller';
import { RedisModule } from '@api/common';
import { Global, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

/**
 * Global module for Cloudinary integration, providing image upload and management services.
 */
@Global()
@Module({
  imports: [ScheduleModule.forRoot(), RedisModule],
  controllers: [UploadController],
  providers: [
    CloudinaryProvider,
    CloudinaryService,
    TempUploadService,
    CleanupScheduler,
  ],
  exports: [CloudinaryProvider, CloudinaryService, TempUploadService],
})
export class CloudinaryModule {}
