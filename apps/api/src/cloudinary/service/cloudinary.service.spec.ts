import { CloudinaryService } from '@api/cloudinary/service/cloudinary.service';
import { HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
    api: {
      delete_resources: jest.fn(),
    },
    url: jest.fn(),
  },
}));

jest.mock('streamifier', () => ({
  createReadStream: jest.fn(),
}));

describe('CloudinaryService', () => {
  let service: CloudinaryService;

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

    service = module.get<CloudinaryService>(CloudinaryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadImage', () => {
    it('should successfully upload an image', async () => {
      const mockFile = { buffer: Buffer.from('test') } as Express.Multer.File;
      const mockResult = {
        public_id: 'test_id',
        secure_url: 'https://test.com',
        width: 100,
        height: 100,
        format: 'jpg',
      };

      const pipeMock = jest.fn();
      (streamifier.createReadStream as jest.Mock).mockReturnValue({
        pipe: pipeMock,
      });

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options: any, callback: (error: any, result: any) => void) => {
          callback(null, mockResult);
          return { pipe: jest.fn() };
        },
      );

      const result = await service.uploadImage(mockFile);

      expect(result).toEqual({
        publicId: 'test_id',
        url: 'https://test.com',
        width: 100,
        height: 100,
        format: 'jpg',
      });
    });

    it('should throw HttpException on upload failure', async () => {
      const mockFile = { buffer: Buffer.from('test') } as Express.Multer.File;
      const mockError = new Error('Upload failed');

      const pipeMock = jest.fn();
      (streamifier.createReadStream as jest.Mock).mockReturnValue({
        pipe: pipeMock,
      });

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options: any, callback: (error: any, result: any) => void) => {
          callback(mockError, null);
          return { pipe: jest.fn() };
        },
      );

      await expect(service.uploadImage(mockFile)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('deleteImage', () => {
    it('should successfully delete an image', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({
        result: 'ok',
      });

      const result = await service.deleteImage('test_id');
      expect(result).toBe('ok');
    });
  });

  describe('generateTransformUrl', () => {
    it('should return formatted URL', () => {
      (cloudinary.url as jest.Mock).mockReturnValue('https://transformed.com');

      const result = service.generateTransformUrl('test_id', {
        width: 100,
        height: 100,
      });

      expect(result).toBe('https://transformed.com');
      expect(cloudinary.url).toHaveBeenCalledWith('test_id', {
        width: 100,
        height: 100,
      });
    });
  });
});
