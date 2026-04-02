import { registerAs } from '@nestjs/config';

export const REDIS_CONFIG_TOKEN = 'redis';

export const redisConfig = registerAs(REDIS_CONFIG_TOKEN, () => ({
  url: process.env.REDIS_URL!,
}));

export type RedisConfig = ReturnType<typeof redisConfig>;
