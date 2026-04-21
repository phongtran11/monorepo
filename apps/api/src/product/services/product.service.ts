import { Category } from '@api/category/entities/category.entity';
import { Image } from '@api/cloudinary/entities';
import { ImageService } from '@api/cloudinary/service/image.service';
import {
  BulkDeleteProductDto,
  CreateProductDto,
  ProductQueryDto,
  UpdateProductDto,
} from '@api/product/dto';
import { Product } from '@api/product/entities/product.entity';
import { ProductRepository } from '@api/product/repositories/product.repository';
import { slugify } from '@lam-thinh-ecommerce/shared';
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Paginated query result for products.
 */
export interface PaginatedProducts {
  items: Array<Product & { images: Image[] }>;
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

  constructor(
    private readonly productRepository: ProductRepository,
    private readonly imageService: ImageService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Retrieves a paginated list of products with optional filtering.
   */
  async findAll(query: ProductQueryDto): Promise<PaginatedProducts> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [products, total] = await this.productRepository.findPaginated({
      page,
      limit,
      search: query.search,
      categoryId: query.categoryId,
      status: query.status,
    });

    const images = await this.imageService.findForResources(
      'product',
      products.map((p) => p.id),
    );

    const imagesByProduct = new Map<string, Image[]>();
    for (const img of images) {
      if (!img.resourceId) continue;
      const list = imagesByProduct.get(img.resourceId) ?? [];
      list.push(img);
      imagesByProduct.set(img.resourceId, list);
    }

    const items = products.map((p) =>
      Object.assign(p, { images: imagesByProduct.get(p.id) ?? [] }),
    );

    return { items, total, page, limit };
  }

  /**
   * Retrieves a single product by its ID, including images.
   *
   * @throws NotFoundException if the product is not found.
   */
  async findOne(id: string): Promise<Product & { images: Image[] }> {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    const images = await this.imageService.findForResource('product', id);
    return Object.assign(product, { images });
  }

  /**
   * Creates a new product, then links any provided images as permanent.
   */
  async create(
    dto: CreateProductDto,
    userId: string,
  ): Promise<Product & { images: Image[] }> {
    const slug = slugify(dto.name);

    await this.assertSlugAvailable(slug);
    await this.assertSkuAvailable(dto.sku);

    const product = await this.dataSource.transaction(async (manager) => {
      const productRepo = manager.getRepository(Product);
      const categoryRepo = manager.getRepository(Category);

      const category = await categoryRepo.findOne({
        where: { id: dto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Danh mục không tồn tại');
      }

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
        categoryId: category.id,
      });

      return productRepo.save(newProduct);
    });

    let images: Image[] = [];
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

    return Object.assign(product, { images });
  }

  /**
   * Updates an existing product. If `imageIds` is provided, the image set is fully replaced.
   */
  async update(
    id: string,
    dto: UpdateProductDto,
    userId: string,
  ): Promise<Product & { images: Image[] }> {
    const product = await this.dataSource.transaction(async (manager) => {
      const productRepo = manager.getRepository(Product);
      const categoryRepo = manager.getRepository(Category);

      const existing = await productRepo.findOne({ where: { id } });

      if (!existing) {
        throw new NotFoundException('Sản phẩm không tồn tại');
      }

      if (dto.name && dto.name !== existing.name) {
        const newSlug = slugify(dto.name);
        const slugConflict = await productRepo.findOne({
          where: { slug: newSlug },
          withDeleted: true,
        });
        if (slugConflict && slugConflict.id !== id) {
          throw new ConflictException('Slug sản phẩm đã tồn tại');
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
          throw new ConflictException('SKU sản phẩm đã tồn tại');
        }
        existing.sku = dto.sku;
      }

      if (dto.categoryId && dto.categoryId !== existing.categoryId) {
        const category = await categoryRepo.findOne({
          where: { id: dto.categoryId },
        });
        if (!category) {
          throw new NotFoundException('Danh mục không tồn tại');
        }
        existing.categoryId = category.id;
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

    let images: Image[];
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

    return Object.assign(product, { images });
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
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    await this.imageService.deleteForResource('product', id);
    await this.productRepository.softRemove(product);
  }

  private async assertSlugAvailable(slug: string): Promise<void> {
    const existing = await this.productRepository.findBySlug(slug);
    if (existing) {
      throw new ConflictException('Slug sản phẩm đã tồn tại');
    }
  }

  private async assertSkuAvailable(sku: string): Promise<void> {
    const existing = await this.productRepository.findBySku(sku);
    if (existing) {
      throw new ConflictException('SKU sản phẩm đã tồn tại');
    }
  }
}
