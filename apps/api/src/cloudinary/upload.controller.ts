import { JwtAuthGuard } from '@api/auth/guard';
import type { AuthUser } from '@api/auth/jwt.type';
import { ImageResponseDto, RegisterUploadDto } from '@api/cloudinary/dto';
import { ImageService } from '@api/cloudinary/service/image.service';
import { CurrentUser } from '@api/common';
import { ApiResponseDto } from '@api/common/dto/api-response.dto';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

/**
 * Controller handling image upload registration.
 */
@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  /**
   * Creates an instance of the UploadController.
   *
   * @param imageService - Service to manage image records.
   */
  constructor(private readonly imageService: ImageService) {}

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
  @ApiCreatedResponse({
    description: 'Image registered successfully',
    type: ImageResponseDto,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async registerUpload(
    @CurrentUser() user: AuthUser,
    @Body() body: RegisterUploadDto,
  ) {
    const image = await this.imageService.register(
      user.id,
      body.publicId,
      body.secureUrl,
    );
    return ApiResponseDto.success(
      plainToInstance(ImageResponseDto, image),
      'Ảnh đã được đăng ký thành công',
      201,
    );
  }
}
