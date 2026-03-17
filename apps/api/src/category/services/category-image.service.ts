import { CategoryImageRepository } from '@api/category/repositories/category-image.repository';
import { CloudinaryService } from '@api/cloudinary/service/cloudinary.service';
import { TempUploadService } from '@api/cloudinary/service/temp-upload.service';
import { Injectable } from '@nestjs/common';

/**
 * Service for managing category images.
 */
@Injectable()
export class CategoryImageService {
  /**
   * Creates an instance of the CategoryImageService.
   *
   * @param categoryImageRepository - The repository for category image operations.
   * @param tempUploadService - The service to handle temporary uploads.
   * @param cloudinaryService - The service to handle cloudinary operations.
   */
  constructor(
    private readonly categoryImageRepository: CategoryImageRepository,
    private readonly tempUploadService: TempUploadService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Attaches a temporary image to a category.
   *
   * @param tempId - The temporary upload ID.
   * @param userId - The ID of the user.
   * @param categoryId - The ID of the category.
   * @returns The created and saved category image.
   */
  async attachImage(tempId: string, userId: string, categoryId: string) {
    // Pattern:
    // 1. Call tempUploadService.consumeTempMeta(tempId, userId)
    // 2. Call cloudinaryService.moveToPermament(publicId, 'uploads/category/{categoryId}')
    // 3. Save entity-specific image record vào DB
    // 4. Return saved record

    const { publicId, secureUrl } =
      await this.tempUploadService.consumeTempMeta(tempId, userId);

    const newPublicId = await this.cloudinaryService.moveToPermanent(
      publicId,
      `uploads/category/${categoryId}`,
    );

    const categoryImage = this.categoryImageRepository.create({
      url: secureUrl.replace(publicId, newPublicId),
      publicId: newPublicId,
      category: { id: categoryId },
      format: 'jpg',
      bytes: 0,
    });

    return await this.categoryImageRepository.save(categoryImage);
  }
}
