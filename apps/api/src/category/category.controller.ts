import { JwtAuthGuard, PermissionsGuard } from '@api/auth/guard';
import type { AuthUser } from '@api/auth/jwt.type';
import {
  CategoryResponseDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '@api/category/dto';
import { CategoryService } from '@api/category/services/category.service';
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
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

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
  @ApiOkResponse({
    type: ApiResponseOf([CategoryResponseDto]),
  })
  async findAll(): Promise<ApiResponseDto<CategoryResponseDto[]>> {
    const categories = await this.categoryService.findAllTree();
    return ApiResponseDto.success(
      plainToInstance(CategoryResponseDto, categories),
    );
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
  @ApiCreatedResponse({ type: ApiResponseOf(CategoryResponseDto) })
  async create(
    @Body() dto: CreateCategoryDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ApiResponseDto<CategoryResponseDto>> {
    const category = await this.categoryService.create(dto, user.id);
    return ApiResponseDto.success(
      plainToInstance(CategoryResponseDto, category),
    );
  }

  /**
   * Updates an existing category.
   *
   * @param id - The unique identifier of the category to update.
   * @param dto - The updated data.
   * @returns The updated category.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.UPDATE_CATEGORY)
  @ApiBearerAuth()
  @ApiOkResponse({ type: ApiResponseOf(CategoryResponseDto) })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<ApiResponseDto<CategoryResponseDto>> {
    const category = await this.categoryService.update(id, dto);
    return ApiResponseDto.success(
      plainToInstance(CategoryResponseDto, category),
    );
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
  @ApiOkResponse({
    type: ApiResponseDto,
    description: 'Successfully removed category',
  })
  async remove(@Param('id') id: string): Promise<ApiResponseDto<null>> {
    await this.categoryService.remove(id);
    return ApiResponseDto.success(null);
  }
}

// Base URL

// http://localhost:3000/api/v1/categories
// Headers

// Content-Type: application/json
// Authorization: Bearer YOUR_ACCESS_TOKEN (required for create, update, delete)
// Create category (root)
// Request body:
// {
// "name": "Dau nhot",
// "displayOrder": 1
// }
// Example response:
// {
// "success": true,
// "statusCode": 200,
// "message": "Success",
// "data": {
// "id": "f7f6f3ab-0f4b-4d87-9e16-86f2b59f6e81",
// "name": "Dau nhot",
// "slug": "dau-nhot",
// "displayOrder": 1,
// "createdAt": "2026-03-16T09:21:33.120Z",
// "updatedAt": "2026-03-16T09:21:33.120Z"
// },
// "error": null
// }

// Create category (child)
// Request body:
// {
// "name": "Dau dong co",
// "displayOrder": 2,
// "parentId": "f7f6f3ab-0f4b-4d87-9e16-86f2b59f6e81"
// }

// Get all categories (tree)
// GET /api/v1/categories

// Example response:
// {
// "success": true,
// "statusCode": 200,
// "message": "Success",
// "data": [
// {
// "id": "f7f6f3ab-0f4b-4d87-9e16-86f2b59f6e81",
// "name": "Dau nhot",
// "slug": "dau-nhot",
// "displayOrder": 1,
// "children": [
// {
// "id": "8650cf3f-7f74-45cc-9f7a-c088ee4a2b2f",
// "name": "Dau dong co",
// "slug": "dau-dong-co",
// "displayOrder": 2,
// "children": [],
// "createdAt": "2026-03-16T09:24:00.000Z",
// "updatedAt": "2026-03-16T09:24:00.000Z"
// }
// ],
// "createdAt": "2026-03-16T09:21:33.120Z",
// "updatedAt": "2026-03-16T09:21:33.120Z"
// }
// ],
// "error": null
// }

// Update category
// PATCH /api/v1/categories/8650cf3f-7f74-45cc-9f7a-c088ee4a2b2f
// Request body (rename + reorder):
// {
// "name": "Dau hop so",
// "displayOrder": 3
// }

// Request body (move to another parent):
// {
// "parentId": "another-parent-uuid"
// }

// Request body (remove parent, make root):
// {
// "parentId": null
// }

// Delete category
// DELETE /api/v1/categories/8650cf3f-7f74-45cc-9f7a-c088ee4a2b2f
// Example response:
// {
// "success": true,
// "statusCode": 200,
// "message": "Success",
// "data": null,
// "error": null
// }

// Common error examples

// Slug existed:
// {
// "statusCode": 409,
// "message": "Slug danh muc da ton tai",
// "error": "Conflict"
// }

// Delete category that still has children:
// {
// "statusCode": 409,
// "message": "Khong the xoa danh muc co chua danh muc con",
// "error": "Conflict"
// }

// If you want, I can also give you ready-to-import Postman collection JSON for these endpoints.
