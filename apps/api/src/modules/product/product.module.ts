import { Product } from '@api/modules/product/entities';
import { ProductPort } from '@api/modules/product/ports/product.port';
import { ProductController } from '@api/modules/product/product.controller';
import { ProductRepository } from '@api/modules/product/repositories';
import { ProductService } from '@api/modules/product/services';
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
