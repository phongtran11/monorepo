import { CategoryRepository } from '@api/category/repositories/category.repository';
import { CategoryService } from '@api/category/services/category.service';
import { CloudinaryService } from '@api/cloudinary/service/cloudinary.service';
import { TempUploadService } from '@api/cloudinary/service/temp-upload.service';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';

import { Category } from '../entities/category.entity';

jest.mock('@lam-thinh-ecommerce/shared', () => ({
  slugify: jest.fn((text: string) =>
    text
      .toLowerCase()
      .replace(/\s+/g, '-'),
  ),
  formatYearMonth: jest.fn(() => '2026-03'),
}));

const makeCategory = (overrides: Partial<Category> = {}): Category =>
  ({
    id: 'cat-uuid',
    name: 'Test Category',
    slug: 'test-category',
    displayOrder: 0,
    parent: null,
    children: [],
    imageUrl: null,
    imagePublicId: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: null,
    ...overrides,
  }) as Category;

describe('CategoryService', () => {
  let service: CategoryService;
  let categoryRepository: jest.Mocked<
    Pick<CategoryRepository, 'findTrees' | 'findOne' | 'softRemove' | 'findDescendants'>
  >;
  let tempUploadService: jest.Mocked<Pick<TempUploadService, 'consumeTempMeta'>>;
  let cloudinaryService: jest.Mocked<
    Pick<CloudinaryService, 'moveToPermanent' | 'deleteAsset'>
  >;

  let txRepo: {
    create: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
  };
  let mockTransaction: jest.Mock;

  beforeEach(async () => {
    txRepo = {
      create: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    mockTransaction = jest.fn().mockImplementation((cb) =>
      cb({ getRepository: jest.fn().mockReturnValue(txRepo) }),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: CategoryRepository,
          useValue: {
            findTrees: jest.fn(),
            findOne: jest.fn(),
            softRemove: jest.fn(),
            findDescendants: jest.fn(),
          },
        },
        {
          provide: TempUploadService,
          useValue: { consumeTempMeta: jest.fn() },
        },
        {
          provide: CloudinaryService,
          useValue: {
            moveToPermanent: jest.fn(),
            deleteAsset: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: { transaction: mockTransaction },
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    categoryRepository = module.get(CategoryRepository);
    tempUploadService = module.get(TempUploadService);
    cloudinaryService = module.get(CloudinaryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─────────────────────────────────────────────
  // findAllTree
  // ─────────────────────────────────────────────
  describe('findAllTree', () => {
    it('should return categories sorted by displayOrder', async () => {
      const cat1 = makeCategory({ id: '1', displayOrder: 2 });
      const cat2 = makeCategory({ id: '2', displayOrder: 1 });
      (categoryRepository.findTrees as jest.Mock).mockResolvedValue([cat1, cat2]);

      const result = await service.findAllTree();

      expect(result[0].id).toBe('2');
      expect(result[1].id).toBe('1');
    });

    it('should sort children recursively', async () => {
      const child1 = makeCategory({ id: 'c1', displayOrder: 2 });
      const child2 = makeCategory({ id: 'c2', displayOrder: 0 });
      const parent = makeCategory({ id: 'p1', displayOrder: 0, children: [child1, child2] });
      (categoryRepository.findTrees as jest.Mock).mockResolvedValue([parent]);

      const result = await service.findAllTree();

      expect(result[0].children[0].id).toBe('c2');
      expect(result[0].children[1].id).toBe('c1');
    });

    it('should return empty array when no categories exist', async () => {
      (categoryRepository.findTrees as jest.Mock).mockResolvedValue([]);

      const result = await service.findAllTree();

      expect(result).toEqual([]);
    });
  });

  // ─────────────────────────────────────────────
  // findOne
  // ─────────────────────────────────────────────
  describe('findOne', () => {
    it('should return the category when found', async () => {
      const category = makeCategory();
      (categoryRepository.findOne as jest.Mock).mockResolvedValue(category);

      const result = await service.findOne('cat-uuid');

      expect(result).toBe(category);
      expect(categoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'cat-uuid' },
        relations: ['parent'],
      });
    });

    it('should throw NotFoundException when category does not exist', async () => {
      (categoryRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────
  // create
  // ─────────────────────────────────────────────
  describe('create', () => {
    it('should create a category without image or parent', async () => {
      const dto = { name: 'Test Category' };
      const saved = makeCategory();

      (categoryRepository.findOne as jest.Mock).mockResolvedValue(null);
      txRepo.create.mockReturnValue(saved);
      txRepo.save.mockResolvedValue(saved);

      const result = await service.create(dto, 'user-id');

      expect(result).toBe(saved);
      expect(txRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Test Category', imagePublicId: null, imageUrl: null }),
      );
    });

    it('should create a category with a parent', async () => {
      const parent = makeCategory({ id: 'parent-uuid' });
      const dto = { name: 'Child Category', parentId: 'parent-uuid' };
      const saved = makeCategory({ parent });

      (categoryRepository.findOne as jest.Mock).mockResolvedValue(null);
      txRepo.create.mockReturnValue(makeCategory());
      txRepo.findOne.mockResolvedValue(parent);
      txRepo.save.mockResolvedValue(saved);

      const result = await service.create(dto, 'user-id');

      expect(result).toBe(saved);
      expect(txRepo.findOne).toHaveBeenCalledWith({ where: { id: 'parent-uuid' } });
    });

    it('should create a category with an image', async () => {
      const dto = { name: 'Category With Image', imageId: 'temp-image-id' };
      const saved = makeCategory({
        imagePublicId: 'perm-public-id',
        imageUrl: 'https://res.cloudinary.com/test/image',
      });

      (categoryRepository.findOne as jest.Mock).mockResolvedValue(null);
      (tempUploadService.consumeTempMeta as jest.Mock).mockResolvedValue({
        publicId: 'temp-public-id',
      });
      (cloudinaryService.moveToPermanent as jest.Mock).mockResolvedValue({
        publicId: 'perm-public-id',
        secureUrl: 'https://res.cloudinary.com/test/image',
      });
      txRepo.create.mockReturnValue(saved);
      txRepo.save.mockResolvedValue(saved);

      const result = await service.create(dto, 'user-id');

      expect(tempUploadService.consumeTempMeta).toHaveBeenCalledWith('temp-image-id', 'user-id');
      expect(cloudinaryService.moveToPermanent).toHaveBeenCalledWith(
        'temp-public-id',
        'uploads/category/2026-03',
      );
      expect(txRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          imagePublicId: 'perm-public-id',
          imageUrl: 'https://res.cloudinary.com/test/image',
        }),
      );
      expect(result).toBe(saved);
    });

    it('should throw ConflictException when slug already exists', async () => {
      const dto = { name: 'Existing Category' };
      (categoryRepository.findOne as jest.Mock).mockResolvedValue(makeCategory());

      await expect(service.create(dto, 'user-id')).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when parent does not exist', async () => {
      const dto = { name: 'Category', parentId: 'non-existent-parent' };

      (categoryRepository.findOne as jest.Mock).mockResolvedValue(null);
      txRepo.create.mockReturnValue(makeCategory());
      txRepo.findOne.mockResolvedValue(null);

      await expect(service.create(dto, 'user-id')).rejects.toThrow(NotFoundException);
    });

    it('should rollback cloudinary image when DB transaction fails', async () => {
      const dto = { name: 'Category', imageId: 'temp-id' };

      (categoryRepository.findOne as jest.Mock).mockResolvedValue(null);
      (tempUploadService.consumeTempMeta as jest.Mock).mockResolvedValue({
        publicId: 'temp-public-id',
      });
      (cloudinaryService.moveToPermanent as jest.Mock).mockResolvedValue({
        publicId: 'perm-public-id',
        secureUrl: 'https://res.cloudinary.com/test',
      });
      txRepo.create.mockReturnValue(makeCategory());
      txRepo.save.mockRejectedValue(new Error('DB error'));
      (cloudinaryService.deleteAsset as jest.Mock).mockResolvedValue(undefined);

      await expect(service.create(dto, 'user-id')).rejects.toThrow('DB error');
      expect(cloudinaryService.deleteAsset).toHaveBeenCalledWith('perm-public-id');
    });

    it('should NOT call deleteAsset when no image and DB fails', async () => {
      const dto = { name: 'Category' };

      (categoryRepository.findOne as jest.Mock).mockResolvedValue(null);
      txRepo.create.mockReturnValue(makeCategory());
      txRepo.save.mockRejectedValue(new Error('DB error'));

      await expect(service.create(dto, 'user-id')).rejects.toThrow();
      expect(cloudinaryService.deleteAsset).not.toHaveBeenCalled();
    });

    it('should throw ConflictException on PostgreSQL unique constraint error', async () => {
      const dto = { name: 'Category' };

      (categoryRepository.findOne as jest.Mock).mockResolvedValue(null);
      txRepo.create.mockReturnValue(makeCategory());
      txRepo.save.mockRejectedValue({ code: '23505' });

      await expect(service.create(dto, 'user-id')).rejects.toThrow(ConflictException);
    });
  });

  // ─────────────────────────────────────────────
  // update
  // ─────────────────────────────────────────────
  describe('update', () => {
    const baseCategory = makeCategory({
      id: 'cat-id',
      name: 'Old Name',
      slug: 'old-name',
      imagePublicId: 'old-public-id',
      imageUrl: 'https://old-image.com',
    });

    it('should update the category name and regenerate the slug', async () => {
      const dto = { name: 'New Name' };
      const updated = makeCategory({ name: 'New Name', slug: 'new-name' });

      txRepo.findOne
        .mockResolvedValueOnce({ ...baseCategory })
        .mockResolvedValueOnce(null); // slug not taken
      txRepo.save.mockResolvedValue(updated);

      const result = await service.update('cat-id', dto, 'user-id');

      expect(result).toBe(updated);
    });

    it('should update displayOrder without touching the slug', async () => {
      const dto = { displayOrder: 5 };
      const updated = makeCategory({ displayOrder: 5 });

      txRepo.findOne.mockResolvedValueOnce({ ...baseCategory });
      txRepo.save.mockResolvedValue(updated);

      const result = await service.update('cat-id', dto, 'user-id');

      expect(result).toBe(updated);
    });

    it('should NOT throw when new slug belongs to the same category', async () => {
      const dto = { name: 'Different Name' };
      // slug check finds the same category (id matches) → not a conflict
      const sameCategory = makeCategory({ id: 'cat-id', slug: 'different-name' });

      txRepo.findOne
        .mockResolvedValueOnce({ ...baseCategory })
        .mockResolvedValueOnce(sameCategory);
      txRepo.save.mockResolvedValue(sameCategory);

      await expect(service.update('cat-id', dto, 'user-id')).resolves.not.toThrow();
    });

    it('should replace image and soft-delete the old one post-transaction', async () => {
      const dto = { imageId: 'new-temp-id' };

      (tempUploadService.consumeTempMeta as jest.Mock).mockResolvedValue({
        publicId: 'new-temp-public-id',
      });
      (cloudinaryService.moveToPermanent as jest.Mock).mockResolvedValue({
        publicId: 'new-perm-id',
        secureUrl: 'https://new-image.com',
      });
      txRepo.findOne.mockResolvedValueOnce({ ...baseCategory });
      txRepo.save.mockResolvedValue(makeCategory({ imagePublicId: 'new-perm-id' }));
      (cloudinaryService.deleteAsset as jest.Mock).mockResolvedValue(undefined);

      await service.update('cat-id', dto, 'user-id');

      expect(cloudinaryService.deleteAsset).toHaveBeenCalledWith('old-public-id');
    });

    it('should set parent to null when parentId is null', async () => {
      const dto = { parentId: null };
      const categoryWithParent = makeCategory({
        parent: makeCategory({ id: 'parent-id' }),
      });
      const updated = makeCategory({ parent: null });

      txRepo.findOne.mockResolvedValueOnce(categoryWithParent);
      txRepo.save.mockResolvedValue(updated);

      const result = await service.update('cat-id', dto, 'user-id');

      expect(result.parent).toBeNull();
    });

    it('should set a new parent', async () => {
      const newParent = makeCategory({ id: 'new-parent-id' });
      const dto = { parentId: 'new-parent-id' };

      txRepo.findOne
        .mockResolvedValueOnce({ ...baseCategory })
        .mockResolvedValueOnce(newParent); // parent found
      (categoryRepository.findDescendants as jest.Mock).mockResolvedValue([]);
      txRepo.save.mockResolvedValue(makeCategory({ parent: newParent }));

      const result = await service.update('cat-id', dto, 'user-id');

      expect(result.parent).toBe(newParent);
    });

    it('should throw NotFoundException when category does not exist', async () => {
      txRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.update('non-existent', {}, 'user-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when new slug is taken by another category', async () => {
      const dto = { name: 'Taken Name' };
      const otherCategory = makeCategory({ id: 'other-id', slug: 'taken-name' });

      txRepo.findOne
        .mockResolvedValueOnce({ ...baseCategory })
        .mockResolvedValueOnce(otherCategory);

      await expect(service.update('cat-id', dto, 'user-id')).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException when setting parent to self', async () => {
      const dto = { parentId: 'cat-id' };
      txRepo.findOne.mockResolvedValueOnce({ ...baseCategory, id: 'cat-id' });

      await expect(service.update('cat-id', dto, 'user-id')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when new parent does not exist', async () => {
      const dto = { parentId: 'ghost-parent' };

      txRepo.findOne
        .mockResolvedValueOnce({ ...baseCategory })
        .mockResolvedValueOnce(null); // parent not found

      await expect(service.update('cat-id', dto, 'user-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when new parent is a descendant', async () => {
      const descendant = makeCategory({ id: 'descendant-id' });
      const dto = { parentId: 'descendant-id' };

      txRepo.findOne
        .mockResolvedValueOnce({ ...baseCategory })
        .mockResolvedValueOnce(descendant); // parent exists
      (categoryRepository.findDescendants as jest.Mock).mockResolvedValue([descendant]);

      await expect(service.update('cat-id', dto, 'user-id')).rejects.toThrow(BadRequestException);
    });

    it('should rollback new cloudinary image when DB transaction fails', async () => {
      const dto = { imageId: 'new-temp-id' };

      (tempUploadService.consumeTempMeta as jest.Mock).mockResolvedValue({
        publicId: 'new-temp-public-id',
      });
      (cloudinaryService.moveToPermanent as jest.Mock).mockResolvedValue({
        publicId: 'new-perm-id',
        secureUrl: 'https://new-image.com',
      });
      txRepo.findOne.mockResolvedValueOnce({ ...baseCategory });
      txRepo.save.mockRejectedValue(new Error('DB error'));
      (cloudinaryService.deleteAsset as jest.Mock).mockResolvedValue(undefined);

      await expect(service.update('cat-id', dto, 'user-id')).rejects.toThrow('DB error');
      expect(cloudinaryService.deleteAsset).toHaveBeenCalledWith('new-perm-id');
    });

    it('should throw ConflictException on PostgreSQL unique constraint error', async () => {
      const dto = { name: 'New Name' };

      txRepo.findOne
        .mockResolvedValueOnce({ ...baseCategory })
        .mockResolvedValueOnce(null);
      txRepo.save.mockRejectedValue({ code: '23505' });

      await expect(service.update('cat-id', dto, 'user-id')).rejects.toThrow(ConflictException);
    });
  });

  // ─────────────────────────────────────────────
  // remove
  // ─────────────────────────────────────────────
  describe('remove', () => {
    it('should soft-remove a category with no children', async () => {
      const category = makeCategory({ children: [] });
      (categoryRepository.findOne as jest.Mock).mockResolvedValue(category);
      (categoryRepository.softRemove as jest.Mock).mockResolvedValue(undefined);

      await expect(service.remove('cat-id')).resolves.toBeUndefined();
      expect(categoryRepository.softRemove).toHaveBeenCalledWith(category);
    });

    it('should throw NotFoundException when category does not exist', async () => {
      (categoryRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when category has children', async () => {
      const category = makeCategory({
        children: [makeCategory({ id: 'child-id' })],
      });
      (categoryRepository.findOne as jest.Mock).mockResolvedValue(category);

      await expect(service.remove('cat-id')).rejects.toThrow(ConflictException);
    });
  });
});
