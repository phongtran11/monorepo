import { JwtAuthGuard, PermissionsGuard } from '@api/auth/guard';
import type { AuthUser } from '@api/auth/jwt.type';
import {
  BulkDeleteCategoryDto,
  CategoryResponseDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '@api/category/dto';
import { CategoryService } from '@api/category/services/category.service';
import { CategoryResult } from '@api/category/types';
import { ApiResponseDto, ApiResponseOf, Permissions } from '@api/common';
import { CurrentUser } from '@api/common/decorator';
import { Permission } from '@lam-thinh-ecommerce/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

/**
 * Controller for managing categories.
 */
@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  /**
   * Creates an instance of the CategoryController.
   *
   * @param categoryService - The service for category operations.
   */
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * Retrieves all categories in a tree structure.
   *
   * @returns A list of category trees.
   */
  @Get()
  @ApiOperation({ summary: 'List all categories as a tree structure' })
  @ApiOkResponse({
    type: ApiResponseOf([CategoryResponseDto]),
  })
  async findAll(): Promise<ApiResponseDto<CategoryResult[]>> {
    const categories = await this.categoryService.findAllTree();
    return ApiResponseDto.success(categories);
  }

  /**
   * Creates a new category.
   * If imageId is provided, the image will be attached atomically.
   *
   * @param dto - The data to create the category.
   * @param user - The authenticated user.
   * @returns The newly created category.
   */
  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CREATE_CATEGORY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiCreatedResponse({ type: ApiResponseOf(CategoryResponseDto) })
  async create(
    @Body() dto: CreateCategoryDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ApiResponseDto<CategoryResult>> {
    const category = await this.categoryService.create(dto, user.id);
    return ApiResponseDto.success(category);
  }

  /**
   * Updates an existing category.
   *
   * @param id - The unique identifier of the category to update.
   * @param dto - The updated data.
   * @param user - The authenticated user.
   * @returns The updated category.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.UPDATE_CATEGORY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing category' })
  @ApiOkResponse({ type: ApiResponseOf(CategoryResponseDto) })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ApiResponseDto<CategoryResult>> {
    const category = await this.categoryService.update(id, dto, user.id);
    return ApiResponseDto.success(category);
  }

  /**
   * Removes multiple categories in a single request (soft delete).
   * All categories must exist and have no children.
   *
   * @param dto - The DTO containing the list of category IDs to delete.
   * @returns A success message with null data.
   */
  @Delete('bulk')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.DELETE_CATEGORY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk soft-delete categories' })
  @ApiOkResponse({
    type: ApiResponseDto,
    description: 'Successfully removed categories',
  })
  async bulkRemove(
    @Body() dto: BulkDeleteCategoryDto,
  ): Promise<ApiResponseDto<null>> {
    await this.categoryService.bulkRemove(dto);
    return ApiResponseDto.success(null);
  }

  /**
   * Removes a category (soft delete).
   *
   * @param id - The unique identifier of the category to remove.
   * @returns A success message with null data.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.DELETE_CATEGORY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete a category' })
  @ApiOkResponse({
    type: ApiResponseDto,
    description: 'Successfully removed category',
  })
  async remove(@Param('id') id: string): Promise<ApiResponseDto<null>> {
    await this.categoryService.remove(id);
    return ApiResponseDto.success(null);
  }
}
