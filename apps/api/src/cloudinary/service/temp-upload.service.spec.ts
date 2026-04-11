import { randomUUID } from 'node:crypto';

import { CloudinaryService } from '@api/cloudinary/service/cloudinary.service';
import {
  TempUploadMeta,
  TempUploadService,
} from '@api/cloudinary/service/temp-upload.service';
import { RedisService } from '@api/common/redis/redis.service';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('node:crypto', () => ({
  ...jest.requireActual('node:crypto'),
  randomUUID: jest.fn(),
}));

describe('TempUploadService', () => {
  let service: TempUploadService;
  let cloudinaryService: jest.Mocked<CloudinaryService>;
  let redisService: jest.Mocked<RedisService>;

  const userId = 'user-1';
  const tempId = 'uuid-123';
  const REDIS_KEY = `temp_upload:${tempId}`;
  const TTL_24H = 24 * 60 * 60;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TempUploadService,
        {
          provide: CloudinaryService,
          useValue: {
            uploadToTemp: jest.fn(),
            deleteAsset: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            set: jest.fn(),
            get: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(TempUploadService);
    cloudinaryService = module.get(CloudinaryService);
    redisService = module.get(RedisService);

    (randomUUID as jest.Mock).mockReturnValue(tempId);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('saveTempMeta', () => {
    const file = {
      buffer: Buffer.from('file'),
    } as Express.Multer.File;

    it('should upload to cloudinary, persist meta in redis, and return tempId/url', async () => {
      cloudinaryService.uploadToTemp.mockResolvedValue({
        publicId: 'temp/xyz',
        secureUrl: 'https://cdn/temp/xyz.jpg',
      });

      const result = await service.saveTempMeta(userId, file);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(cloudinaryService.uploadToTemp).toHaveBeenCalledWith(
        file.buffer,
        userId,
      );

      const expectedMeta: TempUploadMeta = {
        publicId: 'temp/xyz',
        secureUrl: 'https://cdn/temp/xyz.jpg',
        userId,
      };

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(redisService.set).toHaveBeenCalledWith(
        REDIS_KEY,
        JSON.stringify(expectedMeta),
        TTL_24H,
      );
      expect(result).toEqual({
        tempId,
        tempUrl: 'https://cdn/temp/xyz.jpg',
        expiresIn: TTL_24H,
      });
    });

    it('should propagate errors from cloudinary upload', async () => {
      cloudinaryService.uploadToTemp.mockRejectedValue(
        new BadRequestException('upload failed'),
      );

      await expect(service.saveTempMeta(userId, file)).rejects.toThrow(
        'upload failed',
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(redisService.set).not.toHaveBeenCalled();
    });
  });

  describe('consumeTempMeta', () => {
    it('should return meta and delete the redis key', async () => {
      const meta: TempUploadMeta = {
        publicId: 'temp/xyz',
        secureUrl: 'https://cdn/temp/xyz.jpg',
        userId,
      };
      redisService.get.mockResolvedValue(JSON.stringify(meta));

      const result = await service.consumeTempMeta(tempId, userId);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(redisService.get).toHaveBeenCalledWith(REDIS_KEY);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(redisService.del).toHaveBeenCalledWith(REDIS_KEY);
      expect(result).toEqual(meta);
    });

    it('should throw BadRequestException when key does not exist', async () => {
      redisService.get.mockResolvedValue(null);

      await expect(service.consumeTempMeta(tempId, userId)).rejects.toThrow(
        'Mã upload không tồn tại hoặc đã hết hạn',
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(redisService.del).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when user does not own the meta', async () => {
      const meta: TempUploadMeta = {
        publicId: 'temp/xyz',
        secureUrl: 'https://cdn/temp/xyz.jpg',
        userId: 'other-user',
      };
      redisService.get.mockResolvedValue(JSON.stringify(meta));

      await expect(service.consumeTempMeta(tempId, userId)).rejects.toThrow(
        'Bạn không có quyền sử dụng mã upload này',
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(redisService.del).not.toHaveBeenCalled();
    });
  });

  describe('cancelTemp', () => {
    it('should delete cloudinary asset and redis key', async () => {
      const meta: TempUploadMeta = {
        publicId: 'temp/xyz',
        secureUrl: 'https://cdn/temp/xyz.jpg',
        userId,
      };
      redisService.get.mockResolvedValue(JSON.stringify(meta));

      await service.cancelTemp(tempId, userId);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(cloudinaryService.deleteAsset).toHaveBeenCalledWith('temp/xyz');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(redisService.del).toHaveBeenCalledWith(REDIS_KEY);
    });

    it('should throw BadRequestException when key does not exist', async () => {
      redisService.get.mockResolvedValue(null);

      await expect(service.cancelTemp(tempId, userId)).rejects.toThrow(
        'Mã upload không tồn tại hoặc đã hết hạn',
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(cloudinaryService.deleteAsset).not.toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(redisService.del).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when user does not own the meta', async () => {
      const meta: TempUploadMeta = {
        publicId: 'temp/xyz',
        secureUrl: 'https://cdn/temp/xyz.jpg',
        userId: 'other-user',
      };
      redisService.get.mockResolvedValue(JSON.stringify(meta));

      await expect(service.cancelTemp(tempId, userId)).rejects.toThrow(
        'Bạn không có quyền hủy mã upload này',
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(cloudinaryService.deleteAsset).not.toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(redisService.del).not.toHaveBeenCalled();
    });
  });
});
