import { CategoryController } from '@api/category/category.controller';
import { CategoryService } from '@api/category/services/category.service';
import { ApiResponseDto } from '@api/common/dto/api-response.dto';
import { AccountStatus, Role } from '@lam-thinh-ecommerce/shared';
import { Test, TestingModule } from '@nestjs/testing';

import type { AuthUser } from '../auth/jwt.type';
import type { Category } from './entities/category.entity';

jest.mock('class-transformer', () => ({
  ...jest.requireActual('class-transformer'),
  plainToInstance: jest.fn((_cls, data) => data),
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

const mockUser: AuthUser = {
  id: 'user-uuid',
  email: 'test@example.com',
  role: Role.ADMIN,
  status: AccountStatus.ACTIVE,
};

describe('CategoryController', () => {
  let controller: CategoryController;
  let service: jest.Mocked<CategoryService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        {
          provide: CategoryService,
          useValue: {
            findAllTree: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CategoryController>(CategoryController);
    service = module.get(CategoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─────────────────────────────────────────────
  // findAll
  // ─────────────────────────────────────────────
  describe('findAll', () => {
    it('should return success response with category list', async () => {
      const categories = [makeCategory({ id: '1' }), makeCategory({ id: '2' })];
      service.findAllTree.mockResolvedValue(categories);

      const result = await controller.findAll();

      expect(service.findAllTree).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(categories);
    });

    it('should return success response with empty array when no categories', async () => {
      service.findAllTree.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  // ─────────────────────────────────────────────
  // create
  // ─────────────────────────────────────────────
  describe('create', () => {
    it('should delegate to service and return success response', async () => {
      const dto = { name: 'New Category' };
      const created = makeCategory({ id: 'new-id', name: 'New Category' });
      service.create.mockResolvedValue(created);

      const result = await controller.create(dto as any, mockUser);

      expect(service.create).toHaveBeenCalledWith(dto, mockUser.id);
      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(created);
    });
  });

  // ─────────────────────────────────────────────
  // update
  // ─────────────────────────────────────────────
  describe('update', () => {
    it('should delegate to service and return success response', async () => {
      const dto = { name: 'Updated Name' };
      const updated = makeCategory({ id: 'cat-uuid', name: 'Updated Name' });
      service.update.mockResolvedValue(updated);

      const result = await controller.update('cat-uuid', dto as any, mockUser);

      expect(service.update).toHaveBeenCalledWith('cat-uuid', dto, mockUser.id);
      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(updated);
    });
  });

  // ─────────────────────────────────────────────
  // remove
  // ─────────────────────────────────────────────
  describe('remove', () => {
    it('should delegate to service and return null data', async () => {
      service.remove.mockResolvedValue(undefined);

      const result = await controller.remove('cat-uuid');

      expect(service.remove).toHaveBeenCalledWith('cat-uuid');
      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });
});
