import { CloudinaryService } from '@api/cloudinary/service/cloudinary.service';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import {
  UploadApiErrorResponse,
  UploadApiOptions,
  UploadResponseCallback,
  v2 as cloudinary,
} from 'cloudinary';

jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
      rename: jest.fn(),
      remove_tag: jest.fn(),
    },
  },
}));

describe('CloudinaryService', () => {
  let service: CloudinaryService;

  const mockUploader = cloudinary.uploader as jest.Mocked<
    typeof cloudinary.uploader
  >;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudinaryService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue({ defaultFolder: 'test_uploads' }),
            getOrThrow: jest
              .fn()
              .mockReturnValue({ defaultFolder: 'test_uploads' }),
          },
        },
      ],
    }).compile();

    service = module.get(CloudinaryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadToTemp', () => {
    const buffer = Buffer.from('fake-image');
    const userId = 'user-1';

    it('should upload buffer and resolve with publicId and secureUrl', async () => {
      const endMock = jest.fn();

      (mockUploader.upload_stream as jest.Mock).mockImplementation(
        (options: UploadApiOptions, cb: UploadResponseCallback) => {
          expect(options).toEqual({
            folder: 'temp',
            tags: ['temp', `user_${userId}`],
          });
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          cb(null, {
            public_id: 'temp/abc',
            secure_url: 'https://cdn/temp/abc.jpg',
          });
          return { end: endMock };
        },
      );

      const result = await service.uploadToTemp(buffer, userId);

      expect(result).toEqual({
        publicId: 'temp/abc',
        secureUrl: 'https://cdn/temp/abc.jpg',
      });
      expect(endMock).toHaveBeenCalledWith(buffer);
    });

    it('should reject with BadRequestException when cloudinary returns error', async () => {
      (mockUploader.upload_stream as jest.Mock).mockImplementation(
        (_options: UploadApiOptions, cb: UploadResponseCallback) => {
          cb(new Error('network down') as UploadApiErrorResponse, undefined);
          return { end: jest.fn() };
        },
      );

      await expect(service.uploadToTemp(buffer, userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject with BadRequestException when result is missing', async () => {
      (mockUploader.upload_stream as jest.Mock).mockImplementation(
        (_options: UploadApiOptions, cb: UploadResponseCallback) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          cb(null, undefined);
          return { end: jest.fn() };
        },
      );

      await expect(service.uploadToTemp(buffer, userId)).rejects.toThrow(
        'Kết quả tải ảnh tạm lên Cloudinary không hợp lệ',
      );
    });
  });

  describe('moveToPermanent', () => {
    it('should rename asset, remove temp tag, and return new info', async () => {
      (mockUploader.rename as jest.Mock).mockResolvedValue({
        public_id: 'products/abc',
        secure_url: 'https://cdn/products/abc.jpg',
      });
      (mockUploader.remove_tag as jest.Mock).mockResolvedValue({});

      const result = await service.moveToPermanent('temp/abc', 'products');

      expect(mockUploader.rename).toHaveBeenCalledWith(
        'temp/abc',
        'products/abc',
        { overwrite: true, invalidate: true },
      );
      expect(mockUploader.remove_tag).toHaveBeenCalledWith('temp', [
        'products/abc',
      ]);
      expect(result).toEqual({
        publicId: 'products/abc',
        secureUrl: 'https://cdn/products/abc.jpg',
      });
    });

    it('should throw BadRequestException when rename fails', async () => {
      (mockUploader.rename as jest.Mock).mockRejectedValue(
        new Error('not found'),
      );

      await expect(
        service.moveToPermanent('temp/abc', 'products'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.moveToPermanent('temp/abc', 'products'),
      ).rejects.toThrow('Lỗi khi di chuyển ảnh Cloudinary: not found');
      expect(mockUploader.remove_tag).not.toHaveBeenCalled();
    });
  });

  describe('deleteAsset', () => {
    it('should call cloudinary destroy', async () => {
      (mockUploader.destroy as jest.Mock).mockResolvedValue({ result: 'ok' });

      await service.deleteAsset('products/abc');

      expect(mockUploader.destroy).toHaveBeenCalledWith('products/abc');
    });

    it('should swallow errors and log them', async () => {
      (mockUploader.destroy as jest.Mock).mockRejectedValue(new Error('boom'));
      const loggerSpy = jest
        .spyOn(
          (service as unknown as { logger: { error: jest.Mock } }).logger,
          'error',
        )
        .mockImplementation();

      await expect(
        service.deleteAsset('products/abc'),
      ).resolves.toBeUndefined();
      expect(loggerSpy).toHaveBeenCalled();
    });
  });
});
