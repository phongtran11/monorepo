import { CategoryController } from '@api/category/category.controller';
import { Category, CategoryImage } from '@api/category/entities';
import {
  CategoryImageRepository,
  CategoryRepository,
} from '@api/category/repositories';
import { CategoryImageService, CategoryService } from '@api/category/services';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

/**
 * Module for handling category-related operations.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Category, CategoryImage])],
  controllers: [CategoryController],
  providers: [
    CategoryService,
    CategoryRepository,
    CategoryImageService,
    CategoryImageRepository,
  ],
  exports: [
    CategoryService,
    CategoryRepository,
    CategoryImageService,
    CategoryImageRepository,
  ],
})
export class CategoryModule {}
