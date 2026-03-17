import { CreateCategoryDto, UpdateCategoryDto } from '@api/category/dto';
import { Category } from '@api/category/entities/category.entity';
import { CategoryRepository } from '@api/category/repositories/category.repository';
import { slugify } from '@lam-thinh-ecommerce/shared';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

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
    const trees = await this.categoryRepository.findTrees({
      relations: ['children'],
    });

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
   * Creates a new category.
   *
   * @param dto - The data for creating the category.
   * @returns The newly created category.
   * @throws ConflictException if the slug already exists.
   */
  async create(dto: CreateCategoryDto): Promise<Category> {
    const slug = slugify(dto.name);
    const existing = await this.categoryRepository.findOne({
      where: { slug },
      withDeleted: true,
    });

    if (existing) {
      throw new ConflictException('Slug danh mục đã tồn tại');
    }

    const category = this.categoryRepository.create({
      name: dto.name,
      slug,
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
        withDeleted: true,
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('Slug danh mục đã tồn tại');
      }
      category.name = dto.name;
      category.slug = slug;
    }

    if (dto.displayOrder !== undefined)
      category.displayOrder = dto.displayOrder;

    if (dto.parentId !== undefined) {
      if (dto.parentId === null) {
        category.parent = null;
      } else {
        if (dto.parentId === id) {
          throw new BadRequestException(
            'Danh mục không thể là cha của chính nó',
          );
        }

        const parent = await this.findOne(dto.parentId);

        const descendants =
          await this.categoryRepository.findDescendants(category);
        const isDescendant = descendants.some(
          (desc) => desc.id === dto.parentId,
        );

        if (isDescendant) {
          throw new BadRequestException(
            'Danh mục cha không thể là con của danh mục hiện tại',
          );
        }

        category.parent = parent;
      }
    }

    return this.categoryRepository.save(category);
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
