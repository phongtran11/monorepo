import { Image, ImageStatus } from '@api/cloudinary/entities';
import { ImageRepository } from '@api/cloudinary/repositories';
import { CloudinaryService } from '@api/cloudinary/service/cloudinary.service';
import { ResourceType } from '@api/common/constants';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { In, LessThan } from 'typeorm';

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
  ): Promise<Image> {
    await this.cloudinaryService.verifyAsset(publicId);

    const image = this.imageRepository.create({
      userId,
      publicId,
      secureUrl,
      status: 'pending',
      resourceType: null,
      resourceId: null,
      sortOrder: 0,
    });

    return this.imageRepository.save(image);
  }

  /**
   * Links a set of images to a resource and marks them as permanent.
   * Images not in the new list that were previously linked to this resource are deleted.
   *
   * The index position of each imageId in the array determines sortOrder (0 = primary).
   */
  async markPermanent(
    imageIds: string[],
    resourceType: ResourceType,
    resourceId: string,
    userId: string,
  ): Promise<Image[]> {
    const images = await this.imageRepository.find({
      where: imageIds.map((id) => ({ id })),
    });

    for (const imageId of imageIds) {
      const image = images.find((img) => img.id === imageId);
      if (!image) {
        throw new BadRequestException(`Ảnh không tồn tại: ${imageId}`);
      }
      if (image.userId !== userId) {
        throw new BadRequestException('Bạn không có quyền sử dụng ảnh này');
      }
    }

    const oldImages = await this.imageRepository.find({
      where: { resourceType, resourceId, status: 'permanent' as ImageStatus },
    });

    const newIdSet = new Set(imageIds);
    const toDelete = oldImages.filter((img) => !newIdSet.has(img.id));
    for (const img of toDelete) {
      await this.cloudinaryService.deleteAsset(img.publicId);
      await this.imageRepository.remove(img);
    }

    const ordered = imageIds.map((id) => images.find((img) => img.id === id)!);
    for (let i = 0; i < ordered.length; i++) {
      ordered[i].status = 'permanent';
      ordered[i].resourceType = resourceType;
      ordered[i].resourceId = resourceId;
      ordered[i].sortOrder = i;
    }

    return this.imageRepository.save(ordered);
  }

  /**
   * Deletes all images linked to a resource (Cloudinary + DB).
   * Call this when the owning resource is deleted.
   */
  async deleteForResource(
    resourceType: ResourceType,
    resourceId: string,
  ): Promise<void> {
    const images = await this.imageRepository.find({
      where: { resourceType, resourceId },
    });

    for (const image of images) {
      await this.cloudinaryService.deleteAsset(image.publicId);
    }

    if (images.length > 0) {
      await this.imageRepository.remove(images);
    }
  }

  /**
   * Finds all permanent images linked to a resource, ordered by sortOrder.
   */
  async findForResource(
    resourceType: ResourceType,
    resourceId: string,
  ): Promise<Image[]> {
    return this.imageRepository.find({
      where: { resourceType, resourceId, status: 'permanent' as ImageStatus },
      order: { sortOrder: 'ASC' },
    });
  }

  /**
   * Batch-loads permanent images for multiple resources in a single query.
   * Eliminates N+1 when building list responses.
   */
  async findForResources(
    resourceType: ResourceType,
    resourceIds: string[],
  ): Promise<Image[]> {
    if (resourceIds.length === 0) return [];
    return this.imageRepository.find({
      where: {
        resourceType,
        resourceId: In(resourceIds),
        status: 'permanent' as ImageStatus,
      },
      order: { sortOrder: 'ASC' },
    });
  }

  /**
   * Deletes all pending images older than the given threshold.
   * Called by the hourly cron job to clean up abandoned uploads.
   */
  async cleanupPendingOrphans(olderThanMs = 60 * 60 * 1000): Promise<void> {
    const cutoff = new Date(Date.now() - olderThanMs);

    const orphans = await this.imageRepository.find({
      where: { status: 'pending', createdAt: LessThan(cutoff) },
    });

    this.logger.debug(`Cleaning up ${orphans.length} orphaned pending images`);

    for (const image of orphans) {
      await this.cloudinaryService.deleteAsset(image.publicId);
      await this.imageRepository.remove(image);
    }
  }
}
