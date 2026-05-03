import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Product } from './entities';
import { ProductPort } from './ports/product.port';
import { ProductController } from './product.controller';
import { ProductRepository } from './repositories';
import { ProductService } from './services';

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
