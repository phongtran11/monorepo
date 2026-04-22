import { Product } from '@api/product/entities';
import { ProductPort } from '@api/product/ports/product.port';
import { ProductController } from '@api/product/product.controller';
import { ProductRepository } from '@api/product/repositories';
import { ProductService } from '@api/product/services';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

/**
 * Module for handling product-related operations.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [ProductController],
  providers: [
    ProductService,
    ProductRepository,
    { provide: ProductPort, useExisting: ProductService },
  ],
  exports: [ProductPort],
})
export class ProductModule {}
