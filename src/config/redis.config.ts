import { createZodDto } from '@anatine/zod-nestjs';
import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const RedisConfigSchema = z.object({
  url: z.string().url(),
});

export class RedisConfig extends createZodDto(RedisConfigSchema) {}

export const redisConfig = registerAs('redis', (): RedisConfig => {
  const config = {
    url: process.env.REDIS_URL,
  };

  return RedisConfigSchema.parse(config);
});
