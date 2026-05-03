import { Injectable } from '@nestjs/common';
import { DataSource, In, LessThan, Repository } from 'typeorm';

import { IMAGE_STATUS, ImageResourceType } from '../constants';
import { Image } from '../entities';

/**
 * Repository for image record database operations.
 */
@Injectable()
export class ImageRepository extends Repository<Image> {
  constructor(protected dataSource: DataSource) {
    super(Image, dataSource.createEntityManager());
  }

  /**
   * Finds images by their IDs.
   */
  findByIds(ids: string[]): Promise<Image[]> {
    return this.find({ where: ids.map((id) => ({ id })) });
  }

  /**
   * Finds all permanent images linked to a resource, ordered by sortOrder.
   */
  findPermanentForResource(
    resourceType: ImageResourceType,
    resourceId: string,
  ): Promise<Image[]> {
    return this.find({
      where: { resourceType, resourceId, status: IMAGE_STATUS.PERMANENT },
      order: { sortOrder: 'ASC' },
    });
  }

  /**
   * Batch-finds permanent images for multiple resources in a single query.
   */
  findPermanentForResources(
    resourceType: ImageResourceType,
    resourceIds: string[],
  ): Promise<Image[]> {
    if (resourceIds.length === 0) return Promise.resolve([]);
    return this.find({
      where: {
        resourceType,
        resourceId: In(resourceIds),
        status: IMAGE_STATUS.PERMANENT,
      },
      order: { sortOrder: 'ASC' },
    });
  }

  /**
   * Finds all images linked to a resource regardless of status.
   */
  findAllForResource(
    resourceType: ImageResourceType,
    resourceId: string,
  ): Promise<Image[]> {
    return this.find({ where: { resourceType, resourceId } });
  }

  /**
   * Finds all pending images older than the given cutoff date.
   */
  findPendingOlderThan(cutoff: Date): Promise<Image[]> {
    return this.find({
      where: { status: IMAGE_STATUS.PENDING, createdAt: LessThan(cutoff) },
    });
  }
}
