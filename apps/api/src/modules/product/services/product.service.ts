import { IMAGE_RESOURCE_TYPE } from '@api/modules/image/constants';
import { ImageService } from '@api/modules/image/services/image.service';
import { ImageResult } from '@api/modules/image/types';
import { ERROR_CODES, slugify } from '@lam-thinh-ecommerce/shared';
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, QueryFailedError } from 'typeorm';

import {
  BulkDeleteProductDto,
  CreateProductDto,
  ProductQueryDto,
  UpdateProductDto,
} from '../dto';
import { Product } from '../entities/product.entity';
import { ProductPort } from '../ports/product.port';
import { ProductRepository } from '../repositories/product.repository';
import {
  PaginatedProductsResult,
  ProductImageResult,
  ProductResult,
} from '../types';

/**
 * Service for managing products.
 */
@Injectable()
export class ProductService implements ProductPort {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    private readonly productRepository: ProductRepository,
    private readonly imageService: ImageService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Retrieves a paginated list of products with optional filtering.
   */
  async findAll(query: ProductQueryDto): Promise<PaginatedProductsResult> {
    const page = query.page;
    const limit = query.limit;

    const [products, total] = await this.productRepository.findPaginated({
      page,
      limit,
      search: query.search,
      categoryId: query.categoryId,
      status: query.status,
    });

    const images = await this.imageService.findForResources(
      IMAGE_RESOURCE_TYPE.PRODUCT,
      products.map((p) => p.id),
    );

    const imagesByProduct = new Map<string, ImageResult[]>();
    for (const img of images) {
      if (!img.resourceId) continue;
      const list = imagesByProduct.get(img.resourceId) ?? [];
      list.push(img);
      imagesByProduct.set(img.resourceId, list);
    }

    const items = products.map((p) =>
      this.toResult(p, imagesByProduct.get(p.id) ?? []),
    );

    return { items, total, page, limit };
  }

  /**
   * Retrieves a single product by its ID, including images.
   *
   * @throws NotFoundException if the product is not found.
   */
  async findOne(id: string): Promise<ProductResult> {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundException(ERROR_CODES.PRODUCT_NOT_FOUND);
    }

    const images = await this.imageService.findForResource('product', id);
    return this.toResult(product, images);
  }

  /**
   * Creates a new product, then links any provided images as permanent.
   */
  async create(dto: CreateProductDto, userId: string): Promise<ProductResult> {
    const slug = slugify(dto.name);

    await this.assertSlugAvailable(slug);
    await this.assertSkuAvailable(dto.sku);

    let product: Product;
    try {
      product = await this.dataSource.transaction(async (manager) => {
        const productRepo = manager.getRepository(Product);

        const newProduct = productRepo.create({
          name: dto.name,
          slug,
          sku: dto.sku,
          shortDescription: dto.shortDescription ?? null,
          description: dto.description ?? null,
          price: dto.price,
          compareAtPrice: dto.compareAtPrice ?? null,
          stock: dto.stock ?? 0,
          status: dto.status,
          categoryId: dto.categoryId,
        });

        return productRepo.save(newProduct);
      });
    } catch (error) {
      if (error instanceof QueryFailedError && error.name === '23503') {
        throw new NotFoundException(ERROR_CODES.CATEGORY_NOT_FOUND);
      }
      throw error;
    }

    let images: ImageResult[] = [];
    if (dto.imageIds && dto.imageIds.length > 0) {
      try {
        images = await this.imageService.markPermanent(
          dto.imageIds,
          'product',
          product.id,
          userId,
        );
      } catch (error) {
        this.logger.error(
          `Failed to mark images permanent for product ${product.id}`,
          error,
        );
        throw error;
      }
    }

    return this.toResult(product, images);
  }

  /**
   * Updates an existing product. If `imageIds` is provided, the image set is fully replaced.
   */
  async update(
    id: string,
    dto: UpdateProductDto,
    userId: string,
  ): Promise<ProductResult> {
    let product: Product;
    try {
      product = await this.dataSource.transaction(async (manager) => {
        const productRepo = manager.getRepository(Product);

        const existing = await productRepo.findOne({ where: { id } });

        if (!existing) {
          throw new NotFoundException(ERROR_CODES.PRODUCT_NOT_FOUND);
        }

        if (dto.name && dto.name !== existing.name) {
          const newSlug = slugify(dto.name);
          const slugConflict = await productRepo.findOne({
            where: { slug: newSlug },
            withDeleted: true,
          });
          if (slugConflict && slugConflict.id !== id) {
            throw new ConflictException(ERROR_CODES.PRODUCT_SLUG_EXISTS);
          }
          existing.name = dto.name;
          existing.slug = newSlug;
        }

        if (dto.sku && dto.sku !== existing.sku) {
          const skuConflict = await productRepo.findOne({
            where: { sku: dto.sku },
            withDeleted: true,
          });
          if (skuConflict && skuConflict.id !== id) {
            throw new ConflictException(ERROR_CODES.PRODUCT_SKU_EXISTS);
          }
          existing.sku = dto.sku;
        }

        if (dto.categoryId) {
          existing.categoryId = dto.categoryId;
        }

        if (dto.shortDescription !== undefined)
          existing.shortDescription = dto.shortDescription ?? null;
        if (dto.description !== undefined)
          existing.description = dto.description ?? null;
        if (dto.price !== undefined) existing.price = dto.price;
        if (dto.compareAtPrice !== undefined)
          existing.compareAtPrice = dto.compareAtPrice ?? null;
        if (dto.stock !== undefined) existing.stock = dto.stock;
        if (dto.status !== undefined) existing.status = dto.status;

        return productRepo.save(existing);
      });
    } catch (error) {
      if (error instanceof QueryFailedError && error.message === '23503') {
        throw new NotFoundException(ERROR_CODES.CATEGORY_NOT_FOUND);
      }
      throw error;
    }

    let images: ImageResult[];
    if (dto.imageIds && dto.imageIds.length > 0) {
      images = await this.imageService.markPermanent(
        dto.imageIds,
        'product',
        product.id,
        userId,
      );
    } else {
      images = await this.imageService.findForResource('product', product.id);
    }

    return this.toResult(product, images);
  }

  /**
   * Soft-removes multiple products. Images remain until hard delete or manual cleanup.
   */
  async bulkRemove(dto: BulkDeleteProductDto): Promise<void> {
    const products = await this.productRepository.findByIds(dto.ids);
    if (products.length === 0) return;

    for (const product of products) {
      await this.imageService.deleteForResource('product', product.id);
    }

    await this.productRepository.softRemove(products);
  }

  /**
   * Soft-removes a product and deletes its Cloudinary images.
   */
  async remove(id: string): Promise<void> {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundException(ERROR_CODES.PRODUCT_NOT_FOUND);
    }

    await this.imageService.deleteForResource('product', id);
    await this.productRepository.softRemove(product);
  }

  /**
   * Maps a product entity and its images to a domain result interface.
   */
  private toResult(product: Product, images: ImageResult[]): ProductResult {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      shortDescription: product.shortDescription,
      description: product.description,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      stock: product.stock,
      status: product.status,
      categoryId: product.categoryId,
      images: images.map((img) => this.toImageResult(img)),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  /**
   * Maps an image entity to a domain image result interface.
   */
  private toImageResult(image: ImageResult): ProductImageResult {
    return {
      id: image.id,
      secureUrl: image.secureUrl,
      sortOrder: image.sortOrder,
    };
  }

  private async assertSlugAvailable(slug: string): Promise<void> {
    const existing = await this.productRepository.findBySlug(slug);
    if (existing) {
      throw new ConflictException(ERROR_CODES.PRODUCT_SLUG_EXISTS);
    }
  }

  private async assertSkuAvailable(sku: string): Promise<void> {
    const existing = await this.productRepository.findBySku(sku);
    if (existing) {
      throw new ConflictException(ERROR_CODES.PRODUCT_SKU_EXISTS);
    }
  }

  /**
   * Returns true if any active product references one of the given category IDs.
   * Implements ProductPort — used by CategoryService for deletion guards.
   */
  async hasProductsInCategories(categoryIds: string[]): Promise<boolean> {
    const count = await this.productRepository
      .createQueryBuilder('product')
      .where('product.categoryId IN (:...categoryIds)', { categoryIds })
      .getCount();

    return count > 0;
  }
}
