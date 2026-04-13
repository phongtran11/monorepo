import {
  BulkDeleteCategoryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '@api/category/dto';
import { Category } from '@api/category/entities/category.entity';
import { CategoryRepository } from '@api/category/repositories/category.repository';
import { CloudinaryService } from '@api/cloudinary/service/cloudinary.service';
import { TempUploadService } from '@api/cloudinary/service/temp-upload.service';
import { formatYearMonth, slugify } from '@lam-thinh-ecommerce/shared';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Service for managing categories.
 */
@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

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

    if (existingSlug && !existingSlug.deletedAt) {
      throw new ConflictException('Slug danh mục đã tồn tại');
    }

    // Step 2: Pre-process image - ALL external operations BEFORE transaction
    const image = await this.resolveImage(dto.imageId, userId);

    // Step 3: Database transaction - ONLY DB operations, no external calls
    try {
      const savedId = await this.dataSource.transaction(async (manager) => {
        const categoryRepository = manager.getRepository(Category);

        // Load parent if provided
        let parent: Category | null = null;
        if (dto.parentId) {
          parent = await categoryRepository.findOne({
            where: { id: dto.parentId },
          });

          if (!parent) {
            throw new NotFoundException('Danh mục cha không tồn tại');
          }
        }

        // Use tree-aware repository so TypeORM recalculates mpath on save
        const treeRepository = manager.getTreeRepository(Category);

        // Restore soft-deleted category: reuse the same ID but reset all data
        // Must go through treeRepository.save() — plain update() skips mpath recalculation
        if (existingSlug?.deletedAt) {
          const toRestore = await treeRepository.findOne({
            where: { id: existingSlug.id },
            withDeleted: true,
          });

          if (!toRestore) {
            throw new NotFoundException('Danh mục không tồn tại');
          }

          toRestore.name = dto.name;
          toRestore.displayOrder = dto.displayOrder ?? toRestore.displayOrder;
          toRestore.imagePublicId = image?.publicId ?? null;
          toRestore.imageUrl = image?.url ?? null;
          toRestore.parent = parent;
          toRestore.deletedAt = null;

          const restored = await treeRepository.save(toRestore);
          return restored.id;
        }

        // Create new category — treeRepository.save() sets mpath based on parent
        const category = treeRepository.create({
          name: dto.name,
          slug,
          displayOrder: dto.displayOrder,
          imagePublicId: image?.publicId ?? null,
          imageUrl: image?.url ?? null,
          parent,
        });

        const saved = await treeRepository.save(category);
        return saved.id;
      });

      return this.findOne(savedId);
    } catch (error) {
      // Rollback: delete permanent image if DB transaction failed
      if (image) {
        await this.cloudinaryService.deleteAsset(image.publicId);
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
    const newImage = await this.resolveImage(dto.imageId, userId);

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
          category.imagePublicId = newImage?.publicId ?? null;
          category.imageUrl = newImage?.url ?? null;
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
      if (newImage) {
        this.cloudinaryService.deleteAsset(newImage.publicId).catch((err) => {
          this.logger.error(`Failed to delete image ${newImage.publicId}`, err);
        });
      }

      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Slug danh mục đã tồn tại');
      }
      throw error;
    }
  }

  /**
   * Consumes a temporary upload and moves it to the permanent category folder.
   * Returns null if no imageId is provided.
   *
   * @param imageId - The temporary upload ID (optional).
   * @param userId - The ID of the authenticated user.
   * @returns The permanent publicId and url, or null.
   */
  private async resolveImage(
    imageId: string | undefined,
    userId: string,
  ): Promise<{ publicId: string; url: string } | null> {
    if (!imageId) return null;

    const { publicId } = await this.tempUploadService.consumeTempMeta(
      imageId,
      userId,
    );

    const moved = await this.cloudinaryService.moveToPermanent(
      publicId,
      `uploads/category/${formatYearMonth()}`,
    );

    return { publicId: moved.publicId, url: moved.secureUrl };
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
   * Removes multiple categories atomically using soft remove.
   * All categories must exist and have no children.
   *
   * @param dto - The DTO containing the list of category IDs to delete.
   * @throws NotFoundException if any ID does not exist.
   * @throws ConflictException if any category has children.
   */
  async bulkRemove(dto: BulkDeleteCategoryDto): Promise<void> {
    const { ids } = dto;

    const categories = await this.categoryRepository.find({
      where: ids.map((id) => ({ id })),
      relations: ['children'],
    });

    if (categories.length !== ids.length) {
      const foundIds = new Set(categories.map((c) => c.id));
      const missing = ids.find((id) => !foundIds.has(id));
      throw new NotFoundException(`Danh mục không tồn tại: ${missing}`);
    }

    const withChildren = categories.find(
      (c) => c.children && c.children.length > 0,
    );
    if (withChildren) {
      throw new ConflictException(
        `Không thể xóa danh mục có chứa danh mục con: ${withChildren.name}`,
      );
    }

    await this.categoryRepository.softRemove(categories);
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
