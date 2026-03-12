import { slugify } from '@lam-thinh-ecommerce/shared';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Category } from './category.entity';
import { CategoryRepository } from './category.repository';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

/**
 * Service for managing categories.
 */
@Injectable()
export class CategoryService {
  /**
   * Creates an instance of the CategoryService.
   *
   * @param categoryRepository - The repository for category database operations.
   */
  constructor(private readonly categoryRepository: CategoryRepository) {}

  /**
   * Retrieves all categories in a tree structure.
   *
   * @returns A list of category trees.
   */
  async findAllTree(): Promise<Category[]> {
    return this.categoryRepository.findTrees({
      relations: ['children'],
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
   * Creates a new category.
   *
   * @param dto - The data for creating the category.
   * @returns The newly created category.
   * @throws ConflictException if the slug already exists.
   */
  async create(dto: CreateCategoryDto): Promise<Category> {
    const slug = slugify(dto.name);
    const existing = await this.categoryRepository.findOne({ where: { slug } });

    if (existing) {
      throw new ConflictException('Slug danh mục đã tồn tại');
    }

    const category = this.categoryRepository.create({
      name: dto.name,
      slug,
      logoPath: dto.logoPath,
      displayOrder: dto.displayOrder,
    });

    if (dto.parentId) {
      const parent = await this.findOne(dto.parentId);
      category.parent = parent;
    }

    return this.categoryRepository.save(category);
  }

  /**
   * Updates an existing category.
   *
   * @param id - The ID of the category to update.
   * @param dto - The data for updating the category.
   * @returns The updated category.
   * @throws ConflictException if the new slug already exists for another category.
   */
  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    if (dto.name && dto.name !== category.name) {
      const slug = slugify(dto.name);
      const existing = await this.categoryRepository.findOne({
        where: { slug },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('Slug danh mục đã tồn tại');
      }
      category.name = dto.name;
      category.slug = slug;
    }

    if (dto.logoPath !== undefined) category.logoPath = dto.logoPath;
    if (dto.displayOrder !== undefined)
      category.displayOrder = dto.displayOrder;

    if (dto.parentId !== undefined && dto.parentId !== null) {
      const parent = await this.findOne(dto.parentId);
      category.parent = parent;
    }

    return this.categoryRepository.save(category);
  }

  /**
   * Removes a category using soft remove.
   *
   * @param id - The ID of the category to remove.
   */
  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepository.softRemove(category);
  }
}
