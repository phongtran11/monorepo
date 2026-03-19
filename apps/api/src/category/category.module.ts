import { CategoryController } from '@api/category/category.controller';
import { Category } from '@api/category/entities';
import { CategoryRepository } from '@api/category/repositories';
import { CategoryService } from '@api/category/services';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

/**
 * Module for handling category-related operations.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  controllers: [CategoryController],
  providers: [CategoryService, CategoryRepository],
  exports: [CategoryService, CategoryRepository],
})
export class CategoryModule {}
