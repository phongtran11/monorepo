import { IMAGE_STATUS, ImageResourceType } from '@api/cloudinary/constants';
import { Image } from '@api/cloudinary/entities';
import { ImageRepository } from '@api/cloudinary/repositories';
import { CloudinaryService } from '@api/cloudinary/service/cloudinary.service';
import { ImageResult } from '@api/cloudinary/types';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';

/**
 * Service for managing the shared images table.
 * Handles registration, verification, lifecycle transitions, and deletion.
 */
@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);

  constructor(
    private readonly imageRepository: ImageRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Verifies a Cloudinary asset exists and saves it as a pending image record.
   * Called immediately after the browser uploads to Cloudinary.
   */
  async register(
    userId: string,
    publicId: string,
    secureUrl: string,
  ): Promise<ImageResult> {
    await this.cloudinaryService.verifyAsset(publicId);

    const image = this.imageRepository.create({
      userId,
      publicId,
      secureUrl,
      status: IMAGE_STATUS.PENDING,
      resourceType: null,
      resourceId: null,
      sortOrder: 0,
    });

    const saved = await this.imageRepository.save(image);
    return this.toResult(saved);
  }

  /**
   * Maps an image entity to a domain result interface.
   */
  private toResult(image: Image): ImageResult {
    return {
      id: image.id,
      publicId: image.publicId,
      secureUrl: image.secureUrl,
      sortOrder: image.sortOrder,
      resourceId: image.resourceId,
    };
  }

  /**
   * Links a set of images to a resource and marks them as permanent.
   * Images not in the new list that were previously linked to this resource are deleted.
   *
   * The index position of each imageId in the array determines sortOrder (0 = primary).
   */
  async markPermanent(
    imageIds: string[],
    resourceType: ImageResourceType,
    resourceId: string,
    userId: string,
  ): Promise<ImageResult[]> {
    const images = await this.imageRepository.findByIds(imageIds);

    for (const imageId of imageIds) {
      const image = images.find((img) => img.id === imageId);
      if (!image) {
        throw new BadRequestException(`Ảnh không tồn tại: ${imageId}`);
      }
      if (image.userId !== userId) {
        throw new BadRequestException('Bạn không có quyền sử dụng ảnh này');
      }
    }

    const oldImages = await this.imageRepository.findPermanentForResource(
      resourceType,
      resourceId,
    );

    const newIdSet = new Set(imageIds);
    const toDelete = oldImages.filter((img) => !newIdSet.has(img.id));
    if (toDelete.length > 0) {
      await this.imageRepository.remove(toDelete);
      await Promise.all(
        toDelete.map((img) => this.cloudinaryService.deleteAsset(img.publicId)),
      );
    }

    const ordered = imageIds.map((id) => images.find((img) => img.id === id)!);
    for (let i = 0; i < ordered.length; i++) {
      ordered[i].status = IMAGE_STATUS.PERMANENT;
      ordered[i].resourceType = resourceType;
      ordered[i].resourceId = resourceId;
      ordered[i].sortOrder = i;
    }

    const saved = await this.imageRepository.save(ordered);
    return saved.map((img) => this.toResult(img));
  }

  /**
   * Deletes all images linked to a resource (Cloudinary + DB).
   * Call this when the owning resource is deleted.
   */
  async deleteForResource(
    resourceType: ImageResourceType,
    resourceId: string,
  ): Promise<void> {
    const images = await this.imageRepository.findAllForResource(
      resourceType,
      resourceId,
    );

    if (images.length > 0) {
      await this.imageRepository.remove(images);
      await Promise.all(
        images.map((img) => this.cloudinaryService.deleteAsset(img.publicId)),
      );
    }
  }

  /**
   * Finds all permanent images linked to a resource, ordered by sortOrder.
   */
  async findForResource(
    resourceType: ImageResourceType,
    resourceId: string,
  ): Promise<ImageResult[]> {
    const images = await this.imageRepository.findPermanentForResource(
      resourceType,
      resourceId,
    );
    return images.map((img) => this.toResult(img));
  }

  /**
   * Batch-loads permanent images for multiple resources in a single query.
   * Eliminates N+1 when building list responses.
   */
  async findForResources(
    resourceType: ImageResourceType,
    resourceIds: string[],
  ): Promise<ImageResult[]> {
    const images = await this.imageRepository.findPermanentForResources(
      resourceType,
      resourceIds,
    );
    return images.map((img) => this.toResult(img));
  }

  /**
   * Deletes all pending images older than the given threshold.
   * Called by the hourly cron job to clean up abandoned uploads.
   */
  async cleanupPendingOrphans(olderThanMs = 60 * 60 * 1000): Promise<void> {
    const cutoff = new Date(Date.now() - olderThanMs);
    const orphans = await this.imageRepository.findPendingOlderThan(cutoff);

    this.logger.log(`Cleaning up ${orphans.length} orphaned pending images`);

    for (const image of orphans) {
      await this.cloudinaryService.deleteAsset(image.publicId);
      await this.imageRepository.remove(image);
    }
  }
}
