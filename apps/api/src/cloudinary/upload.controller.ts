import { JwtAuthGuard } from '@api/auth/guard';
import type { AuthUser } from '@api/auth/jwt.type';
import { TempUploadResponseDto } from '@api/cloudinary/dto';
import { TempUploadService } from '@api/cloudinary/service/temp-upload.service';
import { CurrentUser } from '@api/common';
import { ApiResponseDto } from '@api/common/dto/api-response.dto';
import {
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import * as multer from 'multer';

/**
 * Controller handling temporary image uploads.
 */
@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  /**
   * Creates an instance of the UploadController.
   *
   * @param tempUploadService - Service to manage temporary uploads.
   */
  constructor(private readonly tempUploadService: TempUploadService) {}

  /**
   * Uploads an image to the temporary folder.
   *
   * @param req - The request object containing user information.
   * @param file - The uploaded file.
   * @returns The temporary upload metadata.
   */
  @Post('temp')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    type: TempUploadResponseDto,
  })
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(JwtAuthGuard)
  async uploadTemp(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.tempUploadService.saveTempMeta(user.id, file);
    return ApiResponseDto.success(
      plainToInstance(TempUploadResponseDto, result),
    );
  }

  /**
   * Cancels a temporary upload, deleting it from storage.
   *
   * @param user - The current authenticated user.
   * @param tempId - The ID of the temporary upload.
   * @returns A success response.
   */
  @Delete('cancel/:tempId')
  @ApiResponse({
    status: 200,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async cancelTemp(
    @CurrentUser() user: AuthUser,
    @Param('tempId') tempId: string,
  ) {
    await this.tempUploadService.cancelTemp(tempId, user.id);
    return ApiResponseDto.success(null, 'Đã hủy ảnh tạm thành công');
  }
}
