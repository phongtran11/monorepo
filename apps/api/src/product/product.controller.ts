import { JwtAuthGuard, PermissionsGuard } from '@api/auth/guard';
import type { AuthUser } from '@api/auth/jwt.type';
import { ApiResponseDto, ApiResponseOf, Permissions } from '@api/common';
import { CurrentUser } from '@api/common/decorator';
import {
  BulkDeleteProductDto,
  CreateProductDto,
  PaginatedProductResponseDto,
  ProductQueryDto,
  ProductResponseDto,
  UpdateProductDto,
} from '@api/product/dto';
import { ProductService } from '@api/product/services/product.service';
import { PaginatedProductsResult, ProductResult } from '@api/product/types';
import { Permission } from '@lam-thinh-ecommerce/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
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
 * Controller for managing products.
 */
@ApiTags('Products')
@Controller('products')
export class ProductController {
  /**
   * Creates an instance of the ProductController.
   *
   * @param productService - The service for product operations.
   */
  constructor(private readonly productService: ProductService) {}

  /**
   * Retrieves a paginated list of products.
   *
   * @param query - Pagination and filter parameters.
   * @returns A paginated list of products.
   */
  @Get()
  @ApiOperation({ summary: 'List products (paginated, filterable)' })
  @ApiOkResponse({ type: ApiResponseOf(PaginatedProductResponseDto) })
  async findAll(
    @Query() query: ProductQueryDto,
  ): Promise<ApiResponseDto<PaginatedProductsResult>> {
    return ApiResponseDto.success(await this.productService.findAll(query));
  }

  /**
   * Retrieves a single product by its ID.
   *
   * @param id - The ID of the product to retrieve.
   * @returns The product.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a product by id' })
  @ApiOkResponse({ type: ApiResponseOf(ProductResponseDto) })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<ProductResult>> {
    return ApiResponseDto.success(await this.productService.findOne(id));
  }

  /**
   * Creates a new product.
   *
   * @param dto - The data to create the product.
   * @param user - The authenticated user.
   * @returns The newly created product.
   */
  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CREATE_PRODUCT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiCreatedResponse({ type: ApiResponseOf(ProductResponseDto) })
  async create(
    @Body() dto: CreateProductDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ApiResponseDto<ProductResult>> {
    return ApiResponseDto.success(
      await this.productService.create(dto, user.id),
    );
  }

  /**
   * Updates an existing product.
   *
   * @param id - The unique identifier of the product to update.
   * @param dto - The updated data.
   * @param user - The authenticated user.
   * @returns The updated product.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.UPDATE_PRODUCT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing product' })
  @ApiOkResponse({ type: ApiResponseOf(ProductResponseDto) })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ApiResponseDto<ProductResult>> {
    return ApiResponseDto.success(
      await this.productService.update(id, dto, user.id),
    );
  }

  /**
   * Soft-removes multiple products in a single request.
   *
   * @param dto - The DTO containing the list of product IDs to delete.
   * @returns A success response with null data.
   */
  @Delete('bulk')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.DELETE_PRODUCT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk soft-delete products' })
  @ApiOkResponse({
    type: ApiResponseDto,
    description: 'Successfully removed products',
  })
  async bulkRemove(
    @Body() dto: BulkDeleteProductDto,
  ): Promise<ApiResponseDto<null>> {
    await this.productService.bulkRemove(dto);
    return ApiResponseDto.success(null);
  }

  /**
   * Soft-removes a product.
   *
   * @param id - The unique identifier of the product to remove.
   * @returns A success response with null data.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.DELETE_PRODUCT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete a product' })
  @ApiOkResponse({
    type: ApiResponseDto,
    description: 'Successfully removed product',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<null>> {
    await this.productService.remove(id);
    return ApiResponseDto.success(null);
  }
}
