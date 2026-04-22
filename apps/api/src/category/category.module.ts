import { CategoryController } from '@api/category/category.controller';
import { Category } from '@api/category/entities';
import { CategoryPort } from '@api/category/ports/category.port';
import { CategoryRepository } from '@api/category/repositories';
import { CategoryService } from '@api/category/services';
import { ProductModule } from '@api/product/product.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

/**
 * Module for handling category-related operations.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Category]), ProductModule],
  controllers: [CategoryController],
  providers: [
    CategoryService,
    CategoryRepository,
    { provide: CategoryPort, useExisting: CategoryService },
  ],
  exports: [CategoryPort],
})
export class CategoryModule {}
