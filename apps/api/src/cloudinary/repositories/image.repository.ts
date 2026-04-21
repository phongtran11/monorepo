import { Image } from '@api/cloudinary/entities';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

/**
 * Repository for image record database operations.
 */
@Injectable()
export class ImageRepository extends Repository<Image> {
  /**
   * Creates an instance of the ImageRepository.
   *
   * @param dataSource - The data source for database operations.
   */
  constructor(protected dataSource: DataSource) {
    super(Image, dataSource.createEntityManager());
  }
}
