import { CloudinaryService } from '@api/lib/cloudinary/cloudinary.service';
import { IMAGE_RESOURCE_TYPE } from '@api/modules/image/constants';
import { ImageService } from '@api/modules/image/services';
import { ImageResult } from '@api/modules/image/types';
import { ProductPort } from '@api/modules/product/ports/product.port';
import { ERROR_CODES, slugify } from '@lam-thinh-ecommerce/shared';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';

import { Category } from '../entities/category.entity';
import { CategoryPort } from '../ports/category.port';
import { CategoryRepository } from '../repositories/category.repository';
import {
  BulkDeleteCategoryCommand,
  CategoryImageResult,
  CategoryResult,
  CreateCategoryCommand,
  UpdateCategoryCommand,
} from '../types';

/**
 * Service for managing categories.
 */
@Injectable()
export class CategoryService implements CategoryPort {
  private readonly logger = new Logger(CategoryService.name);

  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly imageService: ImageService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly dataSource: DataSource,
    private readonly productPort: ProductPort,
  ) {}

  /**
   * Retrieves all categories in a tree structure with their images.
   */
  async findAllTree(): Promise<CategoryResult[]> {
    const trees = await this.categoryRepository.findTrees();
    const sorted = this.sortCategoriesRecursive(trees);
    return this.attachImages(sorted);
  }

  /**
   * Retrieves a single category by its ID, including its image.
   *
   * @throws NotFoundException if the category is not found.
   */
  async findOne(id: string): Promise<CategoryResult> {
    const category = await this.categoryRepository.findById(id);

    if (!category) {
      throw new NotFoundException(ERROR_CODES.CATEGORY_NOT_FOUND);
    }

    const images = await this.imageService.findForResource('category', id);
    return this.toResult(category, images[0] ?? null);
  }

  /**
   * Creates a new category with optional image attachment.
   *
   * Follows the external-before-transaction pattern:
   * 1. Resolve the target category ID before opening the transaction.
   * 2. Call markPermanent (Cloudinary + DB) before the transaction so the DB lock time is minimal.
   * 3. On transaction failure, roll back the just-marked image by deleting the Cloudinary asset.
   */
  async create(
    command: CreateCategoryCommand,
    userId: string,
  ): Promise<CategoryResult> {
    const slug = slugify(command.name);

    const existingSlug = await this.categoryRepository.findBySlug(slug);

    if (existingSlug && !existingSlug.deletedAt) {
      throw new ConflictException(ERROR_CODES.CATEGORY_SLUG_EXISTS);
    }

    // Resolve the category ID before the transaction so markPermanent can run first.
    // Restore path: reuse the soft-deleted record's existing ID.
    // Create path: generate a new UUID upfront.
    const resolvedId = existingSlug?.deletedAt ? existingSlug.id : randomUUID();

    let markedImage: ImageResult[] | null = null;
    if (command.imageId) {
      markedImage = await this.imageService.markPermanent(
        [command.imageId],
        IMAGE_RESOURCE_TYPE.CATEGORY,
        resolvedId,
        userId,
      );
    }

    try {
      await this.dataSource.transaction(async (manager) => {
        const categoryRepository = manager.getRepository(Category);

        let parent: Category | null = null;
        if (command.parentId) {
          parent = await categoryRepository.findOne({
            where: { id: command.parentId },
          });

          if (!parent) {
            throw new NotFoundException(ERROR_CODES.PARENT_CATEGORY_NOT_FOUND);
          }
        }

        const treeRepository = manager.getTreeRepository(Category);

        if (existingSlug?.deletedAt) {
          const toRestore = await treeRepository.findOne({
            where: { id: existingSlug.id },
            withDeleted: true,
          });

          if (!toRestore) {
            throw new NotFoundException(ERROR_CODES.CATEGORY_NOT_FOUND);
          }

          toRestore.name = command.name;
          toRestore.displayOrder =
            command.displayOrder ?? toRestore.displayOrder;
          toRestore.parent = parent;
          toRestore.deletedAt = null;

          await treeRepository.save(toRestore);
          return;
        }

        const category = treeRepository.create({
          id: resolvedId,
          name: command.name,
          slug,
          displayOrder: command.displayOrder,
          parent,
        });

        await treeRepository.save(category);
      });
    } catch (error) {
      if (markedImage) {
        await Promise.allSettled(
          markedImage.map((img) =>
            this.cloudinaryService.deleteAsset(img.publicId),
          ),
        );
      }
      throw error;
    }

    return this.findOne(resolvedId);
  }

  /**
   * Updates an existing category.
   */
  async update(
    id: string,
    command: UpdateCategoryCommand,
    userId: string,
  ): Promise<CategoryResult> {
    let deletedImages: ImageResult[] = [];

    await this.dataSource.transaction(async (manager) => {
      const category =
        await this.categoryRepository.findByIdForUpdateInTransaction(
          id,
          manager,
        );

      if (!category) {
        throw new NotFoundException(ERROR_CODES.CATEGORY_NOT_FOUND);
      }

      if (command.name && command.name !== category.name) {
        const slug = slugify(command.name);
        const existing =
          await this.categoryRepository.findBySlugForUpdateInTransaction(
            slug,
            manager,
          );

        if (existing && existing.id !== id) {
          throw new ConflictException(ERROR_CODES.CATEGORY_SLUG_EXISTS);
        }
        category.name = command.name;
        category.slug = slug;
      }

      if (command.displayOrder !== undefined) {
        category.displayOrder = command.displayOrder;
      }

      if (command.parentId !== undefined) {
        if (command.parentId === null) {
          category.parent = null;
        } else {
          if (command.parentId === id) {
            throw new BadRequestException(
              ERROR_CODES.CANNOT_MAKE_CATEGORY_ITS_OWN_PARENT,
            );
          }

          const parent = await this.categoryRepository.findByIdInTransaction(
            command.parentId,
            manager,
          );

          if (!parent) {
            throw new NotFoundException(ERROR_CODES.PARENT_CATEGORY_NOT_FOUND);
          }

          const descendants =
            await this.categoryRepository.findDescendantsInTransaction(
              category,
              manager,
            );

          if (descendants.some((d) => d.id === command.parentId)) {
            throw new BadRequestException(
              ERROR_CODES.CANNOT_SET_CHILD_AS_PARENT,
            );
          }

          category.parent = parent;
        }
      }

      await this.categoryRepository.saveInTransaction(category, manager);

      if (command.imageToAdd) {
        const result = await this.imageService.markPermanentInDbInTransaction(
          [command.imageToAdd],
          IMAGE_RESOURCE_TYPE.CATEGORY,
          id,
          userId,
          manager,
        );
        deletedImages = result.deleted;
      } else if (command.imageToRemove) {
        deletedImages =
          await this.imageService.deleteForResourceInDbInTransaction(
            IMAGE_RESOURCE_TYPE.CATEGORY,
            id,
            manager,
          );
      }
    });

    await this.imageService.deleteFromCloudinary(deletedImages);

    return this.findOne(id);
  }

  /**
   * Returns true if a category with the given ID exists (not soft-deleted).
   * Implements CategoryPort — used by ProductService for validation.
   */
  async exists(id: string): Promise<boolean> {
    const category = await this.categoryRepository.findById(id);
    return category !== null;
  }

  /**
   * Removes multiple categories atomically using soft remove.
   */
  async bulkRemove(command: BulkDeleteCategoryCommand): Promise<void> {
    const { ids } = command;

    const categories = await this.categoryRepository.findByIds(ids);

    if (categories.length !== ids.length) {
      throw new NotFoundException(ERROR_CODES.CATEGORY_NOT_FOUND);
    }

    const withChildren = categories.find(
      (c) => c.children && c.children.length > 0,
    );
    if (withChildren) {
      throw new ConflictException(ERROR_CODES.CATEGORY_HAS_CHILDREN);
    }

    const hasProducts = await this.productPort.hasProductsInCategories(ids);
    if (hasProducts) {
      throw new ConflictException(ERROR_CODES.CATEGORY_HAS_PRODUCTS);
    }

    for (const category of categories) {
      await this.imageService.deleteForResource(
        IMAGE_RESOURCE_TYPE.CATEGORY,
        category.id,
      );
    }

    await this.categoryRepository.softRemove(categories);
  }

  /**
   * Removes a category using soft remove.
   */
  async remove(id: string): Promise<void> {
    const category = await this.categoryRepository.findById(id);

    if (!category) {
      throw new NotFoundException(ERROR_CODES.CATEGORY_NOT_FOUND);
    }

    if (category.children && category.children.length > 0) {
      throw new ConflictException(ERROR_CODES.CATEGORY_HAS_CHILDREN);
    }

    const hasProducts = await this.productPort.hasProductsInCategories([id]);
    if (hasProducts) {
      throw new ConflictException(ERROR_CODES.CATEGORY_HAS_PRODUCTS);
    }

    await this.imageService.deleteForResource(IMAGE_RESOURCE_TYPE.CATEGORY, id);
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
   * Maps a category entity and its image to a domain result interface.
   */
  private toResult(
    category: Category,
    image: ImageResult | null,
  ): CategoryResult {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      displayOrder: category.displayOrder,
      image: this.toImageResult(image),
      children: category.children?.map((child) => this.toResult(child, null)),
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  /**
   * Maps an image result to a category image result interface.
   */
  private toImageResult(image: ImageResult | null): CategoryImageResult | null {
    if (!image) return null;
    return { id: image.id, secureUrl: image.secureUrl };
  }

  /**
   * Batch-loads images for an entire category tree and maps to domain results.
   */
  private async attachImages(
    categories: Category[],
  ): Promise<CategoryResult[]> {
    const allIds = this.collectIds(categories);
    const images = await this.imageService.findForResources('category', allIds);
    const imageMap = new Map(images.map((img) => [img.resourceId, img]));
    return this.mapWithImages(categories, imageMap);
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
   * Recursively maps category entities to domain results, assigning images from the map.
   */
  private mapWithImages(
    categories: Category[],
    imageMap: Map<string | null, ImageResult>,
  ): CategoryResult[] {
    return categories.map((cat) => {
      const image = imageMap.get(cat.id) ?? null;
      const children = cat.children?.length
        ? this.mapWithImages(cat.children, imageMap)
        : undefined;
      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        displayOrder: cat.displayOrder,
        image: this.toImageResult(image),
        children,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
      };
    });
  }
}
