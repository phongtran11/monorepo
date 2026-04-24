import { CategoryController } from '@api/modules/category/category.controller';
import { Category } from '@api/modules/category/entities';
import { CategoryPort } from '@api/modules/category/ports/category.port';
import { CategoryRepository } from '@api/modules/category/repositories';
import { CategoryService } from '@api/modules/category/services';
import { ProductModule } from '@api/modules/product/product.module';
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
