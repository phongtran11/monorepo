import { CreateCategoryDto, UpdateCategoryDto } from '@api/category/dto';
import { Category } from '@api/category/entities/category.entity';
import { CategoryRepository } from '@api/category/repositories/category.repository';
import { CloudinaryService } from '@api/cloudinary/service/cloudinary.service';
import { TempUploadService } from '@api/cloudinary/service/temp-upload.service';
import { formatYearMonth, slugify } from '@lam-thinh-ecommerce/shared';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Service for managing categories.
 */
@Injectable()
export class CategoryService {
  /**
   * Creates an instance of the CategoryService.
   *
   * @param categoryRepository - The repository for category database operations.
   * @param tempUploadService - The service to handle temporary uploads.
   * @param cloudinaryService - The service to handle cloudinary operations.
   * @param dataSource - The TypeORM data source for transaction support.
   */
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly tempUploadService: TempUploadService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Retrieves all categories in a tree structure.
   *
   * @returns A list of category trees.
   */
  async findAllTree(): Promise<Category[]> {
    const trees = await this.categoryRepository.findTrees();

    return this.sortCategoriesRecursive(trees);
  }

  /**
   * Recursively sorts categories and their children by displayOrder.
   *
   * @param categories - The list of categories to sort.
   * @returns The sorted list of categories.
   */
  private sortCategoriesRecursive(categories: Category[]): Category[] {
    return categories
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
      .map((category) => {
        if (category.children && category.children.length > 0) {
          category.children = this.sortCategoriesRecursive(category.children);
        }
        return category;
      });
  }

  /**
   * Retrieves a single category by its ID.
   *
   * @param id - The ID of the category to retrieve.
   * @returns The found category.
   * @throws NotFoundException if the category is not found.
   */
  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent'],
    });

    if (!category) {
      throw new NotFoundException('Danh mục không tồn tại');
    }

    return category;
  }

  /**
   * Creates a new category with optional image attachment.
   *
   * Pattern: Pre-process all external → DB transaction
   * - External services (Redis, Cloudinary) called BEFORE transaction
   * - Transaction only contains DB operations (minimizes lock time)
   * - If external services fail, no DB changes occur
   * - If DB fails, Cloudinary image is orphaned (acceptable - can be cleaned by scheduler)
   *
   * @param dto - The data for creating the category.
   * @param userId - The ID of the authenticated user (required if imageId is provided).
   * @returns The newly created category.
   * @throws ConflictException if the slug already exists.
   * @throws NotFoundException if parent category or temp upload not found.
   */
  async create(dto: CreateCategoryDto, userId: string): Promise<Category> {
    const slug = slugify(dto.name);

    // Step 1: Validate slug (read-only, no lock)
    const existingSlug = await this.categoryRepository.findOne({
      where: { slug },
      withDeleted: true,
    });

    if (existingSlug) {
      throw new ConflictException('Slug danh mục đã tồn tại');
    }

    // Step 2: Pre-process image - ALL external operations BEFORE transaction
    let finalImagePublicId: string | null = null;
    let finalImageUrl: string | null = null;

    if (dto.imageId) {
      // 2a. Consume temp upload (Redis)
      const { publicId } = await this.tempUploadService.consumeTempMeta(
        dto.imageId,
        userId,
      );

      // 2b. Move to permanent location
      // Pattern: uploads/category/{year-month}/{uuid}
      const uploadBatch = formatYearMonth();

      const moved = await this.cloudinaryService.moveToPermanent(
        publicId,
        `uploads/category/${uploadBatch}`,
      );

      finalImagePublicId = moved.publicId;
      finalImageUrl = moved.secureUrl;
    }

    // Step 3: Database transaction - ONLY DB operations, no external calls
    try {
      return await this.dataSource.transaction(async (manager) => {
        const categoryRepository = manager.getRepository(Category);

        // Prepare category entity with final image URLs
        const category = categoryRepository.create({
          name: dto.name,
          slug,
          displayOrder: dto.displayOrder,
          imagePublicId: finalImagePublicId,
          imageUrl: finalImageUrl,
        });

        // Load parent if provided
        if (dto.parentId) {
          const parent = await categoryRepository.findOne({
            where: { id: dto.parentId },
          });

          if (!parent) {
            throw new NotFoundException('Danh mục cha không tồn tại');
          }

          category.parent = parent;
        }

        // Save category - transaction ends here with final image reference
        return categoryRepository.save(category);
      });
    } catch (error) {
      // Rollback: delete permanent image if DB transaction failed
      if (finalImagePublicId) {
        await this.cloudinaryService.deleteAsset(finalImagePublicId);
      }
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Slug danh mục đã tồn tại');
      }
      throw error;
    }
  }

  /**
   * Updates an existing category.
   *
   * @param id - The ID of the category to update.
   * @param dto - The data for updating the category.
   * @param userId - The ID of the authenticated user (required if imageId is provided).
   * @returns The updated category.
   * @throws ConflictException if the new slug already exists for another category.
   */
  async update(
    id: string,
    dto: UpdateCategoryDto,
    userId: string,
  ): Promise<Category> {
    // Pre-process image BEFORE transaction (same pattern as create)
    let newImagePublicId: string | null = null;
    let newImageUrl: string | null = null;

    if (dto.imageId) {
      const { publicId } = await this.tempUploadService.consumeTempMeta(
        dto.imageId,
        userId,
      );
      const uploadBatch = formatYearMonth();
      const moved = await this.cloudinaryService.moveToPermanent(
        publicId,
        `uploads/category/${uploadBatch}`,
      );
      newImagePublicId = moved.publicId;
      newImageUrl = moved.secureUrl;
    }

    let oldImagePublicId: string | null = null;

    try {
      const result = await this.dataSource.transaction(async (manager) => {
        const categoryRepo = manager.getRepository(Category);

        const category = await categoryRepo.findOne({
          where: { id },
          relations: ['parent'],
        });

        if (!category) {
          throw new NotFoundException('Danh mục không tồn tại');
        }

        // Track old image for post-transaction cleanup
        if (dto.imageId !== undefined) {
          oldImagePublicId = category.imagePublicId;
        }

        if (dto.name && dto.name !== category.name) {
          const slug = slugify(dto.name);
          const existing = await categoryRepo.findOne({
            where: { slug },
            withDeleted: true,
          });

          if (existing && existing.id !== id) {
            throw new ConflictException('Slug danh mục đã tồn tại');
          }
          category.name = dto.name;
          category.slug = slug;
        }

        if (dto.displayOrder !== undefined) {
          category.displayOrder = dto.displayOrder;
        }

        // Apply new image if provided
        if (dto.imageId !== undefined) {
          category.imagePublicId = newImagePublicId;
          category.imageUrl = newImageUrl;
        }

        if (dto.parentId !== undefined) {
          if (dto.parentId === null) {
            category.parent = null;
          } else {
            if (dto.parentId === id) {
              throw new BadRequestException(
                'Danh mục không thể là cha của chính nó',
              );
            }

            const parent = await categoryRepo.findOne({
              where: { id: dto.parentId },
            });

            if (!parent) {
              throw new NotFoundException('Danh mục cha không tồn tại');
            }

            const descendants =
              await this.categoryRepository.findDescendants(category);

            if (descendants.some((d) => d.id === dto.parentId)) {
              throw new BadRequestException(
                'Danh mục cha không thể là con của danh mục hiện tại',
              );
            }

            category.parent = parent;
          }
        }

        return categoryRepo.save(category);
      });

      // Post-transaction: delete old Cloudinary image (best-effort)
      if (oldImagePublicId) {
        await this.cloudinaryService.deleteAsset(oldImagePublicId);
      }

      return result;
    } catch (error) {
      // Rollback: delete newly moved image if DB transaction failed
      if (newImagePublicId) {
        await this.cloudinaryService.deleteAsset(newImagePublicId);
      }
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Slug danh mục đã tồn tại');
      }
      throw error;
    }
  }

  /**
   * Checks whether an error is a PostgreSQL unique constraint violation (code 23505).
   *
   * @param error - The error to check.
   * @returns True if the error is a unique constraint violation.
   */
  private isUniqueConstraintError(error: unknown): boolean {
    return (error as { code?: string })?.code === '23505';
  }

  /**
   * Removes a category using soft remove.
   *
   * @param id - The ID of the category to remove.
   */
  async remove(id: string): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['children'],
    });

    if (!category) {
      throw new NotFoundException('Danh mục không tồn tại');
    }

    if (category.children && category.children.length > 0) {
      throw new ConflictException(
        'Không thể xóa danh mục có chứa danh mục con',
      );
    }

    await this.categoryRepository.softRemove(category);
  }
}
