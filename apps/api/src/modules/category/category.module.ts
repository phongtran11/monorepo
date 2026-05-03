import { ProductModule } from '@api/modules/product/product.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CategoryController } from './category.controller';
import { Category } from './entities';
import { CategoryPort } from './ports/category.port';
import { CategoryRepository } from './repositories';
import { CategoryService } from './services';

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
