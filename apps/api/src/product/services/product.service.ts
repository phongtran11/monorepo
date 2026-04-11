import { Category } from '@api/category/entities/category.entity';
import { CloudinaryService } from '@api/cloudinary/service/cloudinary.service';
import { TempUploadService } from '@api/cloudinary/service/temp-upload.service';
import {
  CreateProductDto,
  ProductQueryDto,
  UpdateProductDto,
} from '@api/product/dto';
import { Product } from '@api/product/entities/product.entity';
import { ProductImage } from '@api/product/entities/product-image.entity';
import { ProductRepository } from '@api/product/repositories/product.repository';
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
 * Result of moving a temp-uploaded image to its permanent location.
 */
interface MovedImage {
  publicId: string;
  secureUrl: string;
}

/**
 * Paginated query result for products.
 */
export interface PaginatedProducts {
  items: Product[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Service for managing products.
 */
@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  /**
   * Creates an instance of the ProductService.
   *
   * @param productRepository - The repository for product database operations.
   * @param tempUploadService - The service to handle temporary uploads.
   * @param cloudinaryService - The service to handle cloudinary operations.
   * @param dataSource - The TypeORM data source for transaction support.
   */
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly tempUploadService: TempUploadService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Retrieves a paginated list of products with optional filtering.
   *
   * @param query - Pagination and filter parameters.
   * @returns The paginated products.
   */
  async findAll(query: ProductQueryDto): Promise<PaginatedProducts> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.images', 'images')
      .orderBy('product.createdAt', 'DESC')
      .addOrderBy('images.sortOrder', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.categoryId) {
      qb.andWhere('product.categoryId = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    if (query.status) {
      qb.andWhere('product.status = :status', { status: query.status });
    }

    if (query.search) {
      qb.andWhere('(product.name ILIKE :search OR product.sku ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const [items, total] = await qb.getManyAndCount();

    return { items, total, page, limit };
  }

  /**
   * Retrieves a single product by its ID.
   *
   * @param id - The ID of the product to retrieve.
   * @returns The found product.
   * @throws NotFoundException if the product is not found.
   */
  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['images', 'category'],
      order: { images: { sortOrder: 'ASC' } },
    });

    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    return product;
  }

  /**
   * Creates a new product with optional images.
   *
   * Pattern: Pre-process all external → DB transaction
   * - External services (Redis, Cloudinary) called BEFORE transaction
   * - Transaction only contains DB operations
   * - On failure, moved images are deleted to avoid orphans
   *
   * @param dto - The data for creating the product.
   * @param userId - The ID of the authenticated user (required for image ownership).
   * @returns The newly created product with images.
   */
  async create(dto: CreateProductDto, userId: string): Promise<Product> {
    const slug = slugify(dto.name);

    // Step 1: Validate uniqueness (slug / SKU) — read-only
    await this.assertSlugAvailable(slug);
    await this.assertSkuAvailable(dto.sku);

    // Step 2: Pre-process images — ALL external ops BEFORE transaction
    const movedImages = await this.consumeAndMoveImages(
      dto.imageIds ?? [],
      userId,
    );

    // Step 3: DB transaction — only DB operations
    try {
      return await this.dataSource.transaction(async (manager) => {
        const productRepo = manager.getRepository(Product);
        const imageRepo = manager.getRepository(ProductImage);
        const categoryRepo = manager.getRepository(Category);

        const category = await categoryRepo.findOne({
          where: { id: dto.categoryId },
        });

        if (!category) {
          throw new NotFoundException('Danh mục không tồn tại');
        }

        const product = productRepo.create({
          name: dto.name,
          slug,
          sku: dto.sku,
          shortDescription: dto.shortDescription ?? null,
          description: dto.description ?? null,
          price: dto.price,
          compareAtPrice: dto.compareAtPrice ?? null,
          stock: dto.stock ?? 0,
          status: dto.status,
          categoryId: category.id,
        });

        const saved = await productRepo.save(product);

        if (movedImages.length > 0) {
          const images = movedImages.map((img, idx) =>
            imageRepo.create({
              imageUrl: img.secureUrl,
              imagePublicId: img.publicId,
              sortOrder: idx,
              productId: saved.id,
            }),
          );
          saved.images = await imageRepo.save(images);
        } else {
          saved.images = [];
        }

        return saved;
      });
    } catch (error) {
      await this.rollbackMovedImages(movedImages);
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Slug hoặc SKU sản phẩm đã tồn tại');
      }
      throw error;
    }
  }

  /**
   * Updates an existing product. If `imageIds` is provided, the existing image
   * set is fully replaced with the new one.
   *
   * @param id - The ID of the product to update.
   * @param dto - The data for updating the product.
   * @param userId - The ID of the authenticated user.
   * @returns The updated product with images.
   */
  async update(
    id: string,
    dto: UpdateProductDto,
    userId: string,
  ): Promise<Product> {
    // Step 1: Pre-process new images (if any) BEFORE transaction
    const movedImages =
      dto.imageIds !== undefined
        ? await this.consumeAndMoveImages(dto.imageIds, userId)
        : [];

    const oldImagePublicIds: string[] = [];

    try {
      const result = await this.dataSource.transaction(async (manager) => {
        const productRepo = manager.getRepository(Product);
        const imageRepo = manager.getRepository(ProductImage);
        const categoryRepo = manager.getRepository(Category);

        const product = await productRepo.findOne({
          where: { id },
          relations: ['images'],
        });

        if (!product) {
          throw new NotFoundException('Sản phẩm không tồn tại');
        }

        if (dto.name && dto.name !== product.name) {
          const newSlug = slugify(dto.name);
          const existing = await productRepo.findOne({
            where: { slug: newSlug },
            withDeleted: true,
          });
          if (existing && existing.id !== id) {
            throw new ConflictException('Slug sản phẩm đã tồn tại');
          }
          product.name = dto.name;
          product.slug = newSlug;
        }

        if (dto.sku !== undefined && dto.sku !== product.sku) {
          const existing = await productRepo.findOne({
            where: { sku: dto.sku },
            withDeleted: true,
          });
          if (existing && existing.id !== id) {
            throw new ConflictException('SKU sản phẩm đã tồn tại');
          }
          product.sku = dto.sku;
        }

        if (dto.shortDescription !== undefined) {
          product.shortDescription = dto.shortDescription;
        }
        if (dto.description !== undefined) {
          product.description = dto.description;
        }
        if (dto.price !== undefined) {
          product.price = dto.price;
        }
        if (dto.compareAtPrice !== undefined) {
          product.compareAtPrice = dto.compareAtPrice;
        }
        if (dto.stock !== undefined) {
          product.stock = dto.stock;
        }
        if (dto.status !== undefined) {
          product.status = dto.status;
        }

        if (
          dto.categoryId !== undefined &&
          dto.categoryId !== product.categoryId
        ) {
          const category = await categoryRepo.findOne({
            where: { id: dto.categoryId },
          });
          if (!category) {
            throw new NotFoundException('Danh mục không tồn tại');
          }
          product.categoryId = category.id;
        }

        // Replace image set when imageIds is explicitly provided
        if (dto.imageIds !== undefined) {
          if (product.images && product.images.length > 0) {
            for (const oldImage of product.images) {
              oldImagePublicIds.push(oldImage.imagePublicId);
            }
            await imageRepo.remove(product.images);
          }

          if (movedImages.length > 0) {
            const newImages = movedImages.map((img, idx) =>
              imageRepo.create({
                imageUrl: img.secureUrl,
                imagePublicId: img.publicId,
                sortOrder: idx,
                productId: product.id,
              }),
            );
            product.images = await imageRepo.save(newImages);
          } else {
            product.images = [];
          }
        }

        await productRepo.save(product);
        return product;
      });

      // Post-transaction: delete old Cloudinary images (best-effort)
      for (const publicId of oldImagePublicIds) {
        await this.cloudinaryService.deleteAsset(publicId);
      }

      return result;
    } catch (error) {
      await this.rollbackMovedImages(movedImages);
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Slug hoặc SKU sản phẩm đã tồn tại');
      }
      throw error;
    }
  }

  /**
   * Soft-removes a product. Cloudinary images are retained and can be cleaned
   * up by a scheduler or during hard delete.
   *
   * @param id - The ID of the product to remove.
   */
  async remove(id: string): Promise<void> {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    await this.productRepository.softRemove(product);
  }

  /**
   * Consumes a batch of temp uploads and moves them to the permanent folder.
   * If any step fails, already-moved images are rolled back.
   *
   * @param imageIds - Temporary upload IDs.
   * @param userId - Owner of the temp uploads.
   * @returns The moved images in the same order as the input IDs.
   */
  private async consumeAndMoveImages(
    imageIds: string[],
    userId: string,
  ): Promise<MovedImage[]> {
    if (imageIds.length === 0) return [];

    const moved: MovedImage[] = [];
    const uploadBatch = formatYearMonth();

    try {
      for (const imageId of imageIds) {
        const { publicId } = await this.tempUploadService.consumeTempMeta(
          imageId,
          userId,
        );
        const result = await this.cloudinaryService.moveToPermanent(
          publicId,
          `uploads/product/${uploadBatch}`,
        );
        moved.push(result);
      }
      return moved;
    } catch (error) {
      await this.rollbackMovedImages(moved);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Lỗi xử lý ảnh sản phẩm: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Best-effort cleanup of Cloudinary assets that were moved but whose
   * enclosing operation failed.
   *
   * @param images - The moved images to delete.
   */
  private async rollbackMovedImages(images: MovedImage[]): Promise<void> {
    for (const img of images) {
      try {
        await this.cloudinaryService.deleteAsset(img.publicId);
      } catch (err) {
        this.logger.error(
          `Failed to rollback image ${img.publicId}`,
          err as Error,
        );
      }
    }
  }

  /**
   * Asserts that the given slug is not used by any product (including soft-deleted).
   *
   * @param slug - The slug to check.
   */
  private async assertSlugAvailable(slug: string): Promise<void> {
    const existing = await this.productRepository.findOne({
      where: { slug },
      withDeleted: true,
    });
    if (existing) {
      throw new ConflictException('Slug sản phẩm đã tồn tại');
    }
  }

  /**
   * Asserts that the given SKU is not used by any product (including soft-deleted).
   *
   * @param sku - The SKU to check.
   */
  private async assertSkuAvailable(sku: string): Promise<void> {
    const existing = await this.productRepository.findOne({
      where: { sku },
      withDeleted: true,
    });
    if (existing) {
      throw new ConflictException('SKU sản phẩm đã tồn tại');
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
}
