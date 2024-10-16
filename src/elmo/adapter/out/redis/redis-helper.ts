import { RedisService } from '@liaoliaots/nestjs-redis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisHelper {
  private readonly redis: Redis | null;

  constructor(private readonly redisService: RedisService) {
    this.redis = this.redisService.getOrThrow();
  }

  async getJsonDataFromList(key: string, index: number): Promise<any> {
    const rawData = await this.redis.lindex(key, index);
    if (rawData) {
      return JSON.parse(rawData);
    }
    return null;
  }

  async getJsonDataFromString(key: string): Promise<any> {
    const rawData = await this.redis.get(key);
    if (rawData) {
      return JSON.parse(rawData);
    }
    return null;
  }
}
