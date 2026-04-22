import { JwtAuthGuard } from '@api/auth/guard';
import type { AuthUser } from '@api/auth/jwt.type';
import { ImageResponseDto } from '@api/cloudinary/dto';
import { CloudinaryService } from '@api/cloudinary/service/cloudinary.service';
import { ImageService } from '@api/cloudinary/service/image.service';
import { ImageResult } from '@api/cloudinary/types';
import { UploadSignature } from '@api/cloudinary/types/cloudinary.types';
import { CurrentUser } from '@api/common';
import { ApiResponseDto } from '@api/common/dto/api-response.dto';
import { ApiResponseOf } from '@api/common/swagger/api-response.mixin';
import { RegisterUploadDto, UploadSignatureResponseDto } from '@api/upload/dto';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

/**
 * Controller handling image upload operations.
 */
@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(
    private readonly imageService: ImageService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Returns a short-lived signed upload signature for direct browser-to-Cloudinary uploads.
   * The api_secret never leaves the server.
   *
   * @returns Signature, timestamp, apiKey, and target folder.
   */
  @Get('sign')
  @ApiOperation({
    summary:
      'Generate a signed upload signature for direct browser-to-Cloudinary uploads',
  })
  @ApiOkResponse({
    description: 'Upload signature generated successfully',
    type: ApiResponseOf(UploadSignatureResponseDto),
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getUploadSignature(): ApiResponseDto<UploadSignature> {
    const signature = this.cloudinaryService.generateSignature();
    return ApiResponseDto.success(signature);
  }

  /**
   * Registers a Cloudinary asset (uploaded directly from the browser) as a pending image.
   * The backend verifies the asset exists via the Cloudinary Admin API before saving.
   * Returns an imageId to be included in subsequent form submissions.
   *
   * @param user - The current authenticated user.
   * @param body - The publicId and secureUrl returned by Cloudinary.
   * @returns The registered image record.
   */
  @Post('register')
  @ApiOperation({
    summary: 'Register a Cloudinary asset as a pending image record',
  })
  @ApiCreatedResponse({
    description: 'Image registered successfully',
    type: ApiResponseOf(ImageResponseDto),
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async registerUpload(
    @CurrentUser() user: AuthUser,
    @Body() body: RegisterUploadDto,
  ): Promise<ApiResponseDto<ImageResult>> {
    const image = await this.imageService.register(
      user.id,
      body.publicId,
      body.secureUrl,
    );
    return ApiResponseDto.success(image, 'Ảnh đã được đăng ký thành công', 201);
  }
}
