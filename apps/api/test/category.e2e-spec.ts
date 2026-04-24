import { AppModule } from '@api/app.module';
import { ApiResponseDto, bootstrapApp } from '@api/lib/common';
import { SessionRepository } from '@api/modules/auth/session.repository';
import { CategoryRepository } from '@api/modules/category/repositories/category.repository';
import { CategoryResult } from '@api/modules/category/types';
import { UserRepository } from '@api/modules/user/user.repository';
import { Role } from '@lam-thinh-ecommerce/shared';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

describe('CategoryController (e2e)', () => {
  let app: NestExpressApplication;
  let userRepository: UserRepository;
  let sessionRepository: SessionRepository;
  let categoryRepository: CategoryRepository;

  const adminUser = {
    email: 'category-e2e-admin@example.com',
    password: 'securepassword123',
  };

  let adminAccessToken: string;
  let createdCategoryId: string;
  let childCategoryId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    bootstrapApp(app);
    await app.init();

    userRepository = moduleFixture.get(UserRepository);
    sessionRepository = moduleFixture.get(SessionRepository);
    categoryRepository = moduleFixture.get(CategoryRepository);

    // Clean up any leftover test user
    const existing = await userRepository.findOne({
      where: { email: adminUser.email },
    });
    if (existing) {
      await sessionRepository.delete({ userId: existing.id });
      await userRepository.delete({ id: existing.id });
    }

    // Register user, then promote to ADMIN
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(adminUser)
      .expect(201);

    const user = await userRepository.findOne({
      where: { email: adminUser.email },
    });
    await userRepository.update(user!.id, { role: Role.ADMIN });

    // Re-login to get a token with ADMIN role
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(adminUser)
      .expect(200);

    adminAccessToken = (
      loginRes.body as ApiResponseDto<{
        accessToken: string;
        refreshToken: string;
      }>
    ).data.accessToken;
  });

  afterAll(async () => {
    // Clean up categories created during tests
    if (childCategoryId) {
      const child = await categoryRepository.findById(childCategoryId);
      if (child) await categoryRepository.delete(child.id);
    }
    if (createdCategoryId) {
      const cat = await categoryRepository.findById(createdCategoryId);
      if (cat) await categoryRepository.delete(cat.id);
    }

    // Clean up test user
    const user = await userRepository.findOne({
      where: { email: adminUser.email },
    });
    if (user) {
      await sessionRepository.delete({ userId: user.id });
      await userRepository.delete({ id: user.id });
    }

    await app.close();
  });

  describe('GET /api/v1/categories', () => {
    it('returns tree of categories (public)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/categories')
        .expect(200);

      const body = response.body as ApiResponseDto<CategoryResult[]>;
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  describe('POST /api/v1/categories', () => {
    it('creates a category when authenticated as ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ name: 'E2E Root Category' })
        .expect(201);

      const body = response.body as ApiResponseDto<CategoryResult>;
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('E2E Root Category');
      expect(body.data.id).toBeDefined();

      createdCategoryId = body.data.id;
    });

    it('creates a child category with parentId', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ name: 'E2E Child Category', parentId: createdCategoryId })
        .expect(201);

      const body = response.body as ApiResponseDto<CategoryResult>;
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('E2E Child Category');

      childCategoryId = body.data.id;
    });

    it('returns 409 when name produces duplicate slug', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ name: 'E2E Root Category' })
        .expect(409);

      const body = response.body as ApiResponseDto<null>;
      expect(body.success).toBe(false);
    });

    it('returns 401 without token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .send({ name: 'Unauthorized Category' })
        .expect(401);

      const body = response.body as ApiResponseDto<null>;
      expect(body.success).toBe(false);
    });

    it('returns 400 when name is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({})
        .expect(400);

      const body = response.body as ApiResponseDto<null>;
      expect(body.success).toBe(false);
    });

    it('returns 404 when parentId does not exist', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          name: 'E2E Orphan Category',
          parentId: '00000000-0000-0000-0000-000000000000',
        })
        .expect(404);

      const body = response.body as ApiResponseDto<null>;
      expect(body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/categories/:id', () => {
    it('updates a category name', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ name: 'E2E Root Category Updated' })
        .expect(200);

      const body = response.body as ApiResponseDto<CategoryResult>;
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('E2E Root Category Updated');
    });

    it('returns 409 when new name produces slug conflict', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ name: 'E2E Child Category' })
        .expect(409);

      const body = response.body as ApiResponseDto<null>;
      expect(body.success).toBe(false);
    });

    it('returns 400 when setting parent to itself', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ parentId: createdCategoryId })
        .expect(400);

      const body = response.body as ApiResponseDto<null>;
      expect(body.success).toBe(false);
    });

    it('returns 400 when setting parent to a descendant', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ parentId: childCategoryId })
        .expect(400);

      const body = response.body as ApiResponseDto<null>;
      expect(body.success).toBe(false);
    });

    it('returns 404 when category does not exist', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/v1/categories/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ name: 'Ghost' })
        .expect(404);

      const body = response.body as ApiResponseDto<null>;
      expect(body.success).toBe(false);
    });

    it('returns 401 without token', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/categories/${createdCategoryId}`)
        .send({ name: 'Unauthorized' })
        .expect(401);

      const body = response.body as ApiResponseDto<null>;
      expect(body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/categories/bulk', () => {
    it('returns 400 when ids array is empty', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/v1/categories/bulk')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ ids: [] })
        .expect(400);

      const body = response.body as ApiResponseDto<null>;
      expect(body.success).toBe(false);
    });

    it('returns 404 when one of the ids does not exist', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/v1/categories/bulk')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ ids: ['00000000-0000-0000-0000-000000000000'] })
        .expect(404);

      const body = response.body as ApiResponseDto<null>;
      expect(body.success).toBe(false);
    });

    it('returns 409 when trying to bulk delete a category that has children', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/v1/categories/bulk')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ ids: [createdCategoryId] })
        .expect(409);

      const body = response.body as ApiResponseDto<null>;
      expect(body.success).toBe(false);
    });

    it('returns 401 without token', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/v1/categories/bulk')
        .send({ ids: [childCategoryId] })
        .expect(401);

      const body = response.body as ApiResponseDto<null>;
      expect(body.success).toBe(false);
    });

    it('bulk deletes leaf categories', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/v1/categories/bulk')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ ids: [childCategoryId] })
        .expect(200);

      const body = response.body as ApiResponseDto<null>;
      expect(body.success).toBe(true);
      expect(body.data).toBeNull();

      childCategoryId = '';
    });
  });

  describe('DELETE /api/v1/categories/:id', () => {
    it('returns 409 when category has children', async () => {
      // Re-create a child to test this guard
      const createChild = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ name: 'E2E Child Category 2', parentId: createdCategoryId })
        .expect(201);

      childCategoryId = (createChild.body as ApiResponseDto<CategoryResult>)
        .data.id;

      const response = await request(app.getHttpServer())
        .delete(`/api/v1/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(409);

      const body = response.body as ApiResponseDto<null>;
      expect(body.success).toBe(false);
    });

    it('deletes a leaf category', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/categories/${childCategoryId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      const body = response.body as ApiResponseDto<null>;
      expect(body.success).toBe(true);
      expect(body.data).toBeNull();

      childCategoryId = '';
    });

    it('returns 404 when category does not exist', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/v1/categories/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(404);

      const body = response.body as ApiResponseDto<null>;
      expect(body.success).toBe(false);
    });

    it('returns 401 without token', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/categories/${createdCategoryId}`)
        .expect(401);

      const body = response.body as ApiResponseDto<null>;
      expect(body.success).toBe(false);
    });
  });
});
