import { CategoryModule } from '@api/category/category.module';
import { Product } from '@api/product/entities';
import { ProductController } from '@api/product/product.controller';
import { ProductRepository } from '@api/product/repositories';
import { ProductService } from '@api/product/services';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

/**
 * Module for handling product-related operations.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Product]), CategoryModule],
  controllers: [ProductController],
  providers: [ProductService, ProductRepository],
  exports: [ProductService, ProductRepository],
})
export class ProductModule {}
