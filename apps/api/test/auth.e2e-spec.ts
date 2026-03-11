import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from 'src/user/user.repository';
import request from 'supertest';
import { Repository } from 'typeorm';

import { AppModule } from './../src/app.module';
import { SessionRepository } from './../src/auth/session.repository';
import { User } from './../src/user/user.entity';

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

    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

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

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');

    const responseBody = response.body as {
      accessToken: string;
      refreshToken: string;
    };
    accessToken = responseBody.accessToken;
    refreshToken = responseBody.refreshToken;
  });

  it('/auth/register (POST) - duplicate email', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testUser)
      .expect(409);
  });

  it('/auth/login (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(testUser)
      .expect(200);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');

    const responseBody = response.body as {
      accessToken: string;
      refreshToken: string;
    };
    accessToken = responseBody.accessToken;
    refreshToken = responseBody.refreshToken;
  });

  it('/auth/login (POST) - wrong password', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ ...testUser, password: 'wrongpassword' })
      .expect(401);
  });

  it('/auth/profile (GET) - Success', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toBe(testUser.email);
  });

  it('/auth/profile (GET) - Unauthorized without token', async () => {
    await request(app.getHttpServer()).get('/api/v1/auth/profile').expect(401);
  });

  it('/auth/refresh (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Authorization', `Bearer ${refreshToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');

    // Update tokens for next requests
    accessToken = response.body.accessToken;
    refreshToken = response.body.refreshToken;
  });

  it('/auth/logout (POST)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${refreshToken}`)
      .expect(200);
  });

  it('/auth/refresh (POST) - Fails after logout', async () => {
    // Attempting to refresh with the token that was just logged out should fail
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Authorization', `Bearer ${refreshToken}`)
      .expect(401);
  });
});
