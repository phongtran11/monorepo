import { RedisConfig } from '@api/config';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly configService: ConfigService) {
    const redisConf = this.configService.getOrThrow<RedisConfig>('redis');
    if (!redisConf) {
      throw new Error('Redis configuration is missing');
    }

    this.client = new Redis(redisConf.url);
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    this.logger.debug(
      `Setting key ${key} with value ${value} and TTL ${ttlSeconds}`,
    );

    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    this.logger.debug(`Getting key ${key}`);

    return await this.client.get(key);
  }

  async del(key: string): Promise<void> {
    this.logger.debug(`Deleting key ${key}`);

    await this.client.del(key);
  }

  async scan(pattern: string): Promise<string[]> {
    let cursor = '0';
    const keys: string[] = [];
    do {
      const [nextCursor, chunk] = await this.client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );
      cursor = nextCursor;
      if (chunk && chunk.length > 0) {
        keys.push(...chunk);
      }
    } while (cursor !== '0');
    return keys;
  }
}
