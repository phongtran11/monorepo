import { AppModule } from '@api/app.module';
import { SessionRepository } from '@api/auth/session.repository';
import { ApiResponseDto, bootstrapApp } from '@api/common';
import { User } from '@api/user/user.entity';
import { UserRepository } from '@api/user/user.repository';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Repository } from 'typeorm';

describe('AuthController (e2e)', () => {
  let app: NestExpressApplication;
  let userRepository: Repository<User>;
  let sessionRepository: SessionRepository;

  const testUser = {
    email: 'test-e2e@example.com',
    password: 'securepassword123',
  };

  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    bootstrapApp(app);

    await app.init();

    userRepository = moduleFixture.get(UserRepository);
    sessionRepository = moduleFixture.get(SessionRepository);

    // Clean up before running tests
    const existingUser = await userRepository.findOne({
      where: { email: testUser.email },
    });
    if (existingUser) {
      await sessionRepository.delete({ userId: existingUser.id });
      await userRepository.delete({ id: existingUser.id });
    }
  });

  afterAll(async () => {
    // Clean up after tests
    const existingUser = await userRepository.findOne({
      where: { email: testUser.email },
    });
    if (existingUser) {
      await sessionRepository.delete({ userId: existingUser.id });
      await userRepository.delete({ id: existingUser.id });
    }
    await app.close();
  });

  it('/auth/register (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testUser)
      .expect(201);

    const body = response.body as ApiResponseDto<any>;
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('accessToken');
    expect(body.data).toHaveProperty('refreshToken');

    const responseBody = body.data as {
      accessToken: string;
      refreshToken: string;
    };
    accessToken = responseBody.accessToken;
    refreshToken = responseBody.refreshToken;

    // Assert database
    const user = await userRepository.findOne({
      where: { email: testUser.email },
    });
    expect(user).toBeDefined();
    expect(user?.email).toBe(testUser.email);
  });

  it('/auth/register (POST) - duplicate email', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testUser)
      .expect(409);

    const body = response.body as ApiResponseDto<any>;
    expect(body.success).toBe(false);
  });

  it('/auth/login (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(testUser)
      .expect(200);

    const body = response.body as ApiResponseDto<any>;
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('accessToken');
    expect(body.data).toHaveProperty('refreshToken');

    const responseBody = body.data as {
      accessToken: string;
      refreshToken: string;
    };
    accessToken = responseBody.accessToken;
    refreshToken = responseBody.refreshToken;

    // Decode token to get jti
    const decodedToken = JSON.parse(
      Buffer.from(refreshToken.split('.')[1], 'base64').toString(),
    ) as { jti: string };
    const jti = decodedToken.jti;

    // Assert database (session created)
    const session = await sessionRepository.findOne({
      where: { id: jti },
    });
    expect(session).toBeDefined();
  });

  it('/auth/login (POST) - wrong password', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ ...testUser, password: 'wrongpassword' })
      .expect(401);

    const body = response.body as ApiResponseDto<any>;
    expect(body.success).toBe(false);
  });

  it('/auth/profile (GET) - Success', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = response.body as ApiResponseDto<any>;
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('id');
    const responseBody = body.data as { email: string };
    expect(responseBody.email).toBe(testUser.email);
  });

  it('/auth/profile (GET) - Unauthorized without token', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/profile')
      .expect(401);

    const body = response.body as ApiResponseDto<any>;
    expect(body.success).toBe(false);
  });

  it('/auth/refresh (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Authorization', `Bearer ${refreshToken}`)
      .expect(200);

    const body = response.body as ApiResponseDto<any>;
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('accessToken');
    expect(body.data).toHaveProperty('refreshToken');

    // Update tokens for next requests
    const responseBody = body.data as {
      accessToken: string;
      refreshToken: string;
    };
    accessToken = responseBody.accessToken;
    refreshToken = responseBody.refreshToken;
  });

  it('/auth/logout (POST)', async () => {
    // Decode token to get jti before logout
    const decodedToken = JSON.parse(
      Buffer.from(refreshToken.split('.')[1], 'base64').toString(),
    ) as { jti: string };
    const jti = decodedToken.jti;

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${refreshToken}`)
      .expect(200);

    const body = response.body as ApiResponseDto<any>;
    expect(body.success).toBe(true);

    // Assert database (session removed)
    const session = await sessionRepository.findOne({
      where: { id: jti },
    });
    expect(session).toBeNull();
  });

  it('/auth/refresh (POST) - Fails after logout', async () => {
    // Attempting to refresh with the token that was just logged out should fail
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Authorization', `Bearer ${refreshToken}`)
      .expect(401);

    const body = response.body as ApiResponseDto<any>;
    expect(body.success).toBe(false);
  });
});
