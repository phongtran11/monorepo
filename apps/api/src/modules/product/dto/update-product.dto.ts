import { PartialType } from '@nestjs/swagger';

import { CreateProductDto } from './create-product.dto';

/**
 * Data transfer object for updating an existing product.
 * All fields are optional; if `imageIds` is provided, it fully replaces the
 * current image set (previous images are deleted from Cloudinary).
 */
export class UpdateProductDto extends PartialType(CreateProductDto) {}
