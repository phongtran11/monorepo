import { Module } from '@nestjs/common';

import { UploadController } from './upload.controller';

/**
 * Module for handling image upload registration.
 * ImageService is available via the global CloudinaryModule — no explicit import needed.
 */
@Module({
  controllers: [UploadController],
})
export class UploadModule {}
