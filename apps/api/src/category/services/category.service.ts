import {
  BulkDeleteCategoryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '@api/category/dto';
import { Category } from '@api/category/entities/category.entity';
import { CategoryRepository } from '@api/category/repositories/category.repository';
import { Image } from '@api/cloudinary/entities';
import { ImageService } from '@api/cloudinary/service/image.service';
import { slugify } from '@lam-thinh-ecommerce/shared';
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

  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly imageService: ImageService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Retrieves all categories in a tree structure with their images.
   */
  async findAllTree(): Promise<Array<Category & { image: Image | null }>> {
    const trees = await this.categoryRepository.findTrees();
    const sorted = this.sortCategoriesRecursive(trees);
    return this.attachImages(sorted);
  }

  /**
   * Retrieves a single category by its ID, including its image.
   *
   * @throws NotFoundException if the category is not found.
   */
  async findOne(id: string): Promise<Category & { image: Image | null }> {
    const category = await this.categoryRepository.findById(id);

    if (!category) {
      throw new NotFoundException('Danh mục không tồn tại');
    }

    const images = await this.imageService.findForResource('category', id);
    return Object.assign(category, { image: images[0] ?? null });
  }

  /**
   * Creates a new category with optional image attachment.
   */
  async create(
    dto: CreateCategoryDto,
    userId: string,
  ): Promise<Category & { image: Image | null }> {
    const slug = slugify(dto.name);

    const existingSlug = await this.categoryRepository.findBySlug(slug);

    if (existingSlug && !existingSlug.deletedAt) {
      throw new ConflictException('Slug danh mục đã tồn tại');
    }

    const savedId = await this.dataSource.transaction(async (manager) => {
      const categoryRepository = manager.getRepository(Category);

      let parent: Category | null = null;
      if (dto.parentId) {
        parent = await categoryRepository.findOne({
          where: { id: dto.parentId },
        });

        if (!parent) {
          throw new NotFoundException('Danh mục cha không tồn tại');
        }
      }

      const treeRepository = manager.getTreeRepository(Category);

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
        toRestore.parent = parent;
        toRestore.deletedAt = null;

        const restored = await treeRepository.save(toRestore);
        return restored.id;
      }

      const category = treeRepository.create({
        name: dto.name,
        slug,
        displayOrder: dto.displayOrder,
        parent,
      });

      const saved = await treeRepository.save(category);
      return saved.id;
    });

    // TODO: Ask claude why not move this to transaction
    if (dto.imageId) {
      try {
        await this.imageService.markPermanent(
          [dto.imageId],
          'category',
          savedId,
          userId,
        );
      } catch (error) {
        this.logger.error(
          `Failed to mark image permanent for category ${savedId}`,
          error,
        );
        throw error;
      }
    }

    return this.findOne(savedId);
  }

  /**
   * Updates an existing category.
   */
  async update(
    id: string,
    dto: UpdateCategoryDto,
    userId: string,
  ): Promise<Category & { image: Image | null }> {
    const result = await this.dataSource.transaction(async (manager) => {
      const categoryRepo = manager.getRepository(Category);

      const category = await categoryRepo.findOne({
        where: { id },
        relations: ['parent'],
      });

      if (!category) {
        throw new NotFoundException('Danh mục không tồn tại');
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

    if (dto.imageId !== undefined) {
      if (dto.imageId) {
        await this.imageService.markPermanent(
          [dto.imageId],
          'category',
          id,
          userId,
        );
      } else {
        await this.imageService.deleteForResource('category', id);
      }
    }

    return this.findOne(result.id);
  }

  /**
   * Removes multiple categories atomically using soft remove.
   */
  async bulkRemove(dto: BulkDeleteCategoryDto): Promise<void> {
    const { ids } = dto;

    const categories = await this.categoryRepository.findByIds(ids);

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

    for (const category of categories) {
      await this.imageService.deleteForResource('category', category.id);
    }

    await this.categoryRepository.softRemove(categories);
  }

  /**
   * Removes a category using soft remove.
   */
  async remove(id: string): Promise<void> {
    const category = await this.categoryRepository.findById(id);

    if (!category) {
      throw new NotFoundException('Danh mục không tồn tại');
    }

    if (category.children && category.children.length > 0) {
      throw new ConflictException(
        'Không thể xóa danh mục có chứa danh mục con',
      );
    }

    await this.imageService.deleteForResource('category', id);
    await this.categoryRepository.softRemove(category);
  }

  /**
   * Recursively sorts categories and their children by displayOrder.
   */
  private sortCategoriesRecursive(categories: Category[]): Category[] {
    return categories
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
      .map((category) => {
        if (category.children?.length) {
          category.children = this.sortCategoriesRecursive(category.children);
        }
        return category;
      });
  }

  /**
   * Batch-loads images for an entire category tree and assigns them recursively.
   */
  private async attachImages(
    categories: Category[],
  ): Promise<Array<Category & { image: Image | null }>> {
    const allIds = this.collectIds(categories);
    const images = await this.imageService.findForResources('category', allIds);
    const imageMap = new Map(images.map((img) => [img.resourceId, img]));
    return this.assignImages(categories, imageMap);
  }

  /**
   * Recursively collects all category IDs from the tree.
   */
  private collectIds(categories: Category[]): string[] {
    return categories.flatMap((cat) => [
      cat.id,
      ...this.collectIds(cat.children ?? []),
    ]);
  }

  /**
   * Recursively assigns the matching image to each category node.
   */
  private assignImages(
    categories: Category[],
    imageMap: Map<string | null, Image>,
  ): Array<Category & { image: Image | null }> {
    return categories.map((cat) => {
      if (cat.children?.length) {
        cat.children = this.assignImages(cat.children, imageMap) as Category[];
      }
      return Object.assign(cat, { image: imageMap.get(cat.id) ?? null });
    });
  }
}
