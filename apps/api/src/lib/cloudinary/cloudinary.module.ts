import { Global, Module } from '@nestjs/common';

import { CloudinaryProvider } from './cloudinary.provider';
import { CloudinaryService } from './cloudinary.service';

/**
 * Global infrastructure module for the Cloudinary SDK.
 * Provides CloudinaryService for asset signing, verification, and deletion.
 */
@Global()
@Module({
  providers: [CloudinaryProvider, CloudinaryService],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
