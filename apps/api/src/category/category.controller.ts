import { JwtAuthGuard, PermissionsGuard } from '@api/auth/guard';
import { ApiResponseDto, ApiResponseOf, Permissions } from '@api/common';
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

import { CategoryService } from './category.service';
import {
  CategoryResponseDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto';

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
   *
   * @param dto - The data to create the category.
   * @returns The newly created category.
   */
  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CREATE_CATEGORY)
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: ApiResponseOf(CategoryResponseDto) })
  async create(
    @Body() dto: CreateCategoryDto,
  ): Promise<ApiResponseDto<CategoryResponseDto>> {
    const category = await this.categoryService.create(dto);
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
