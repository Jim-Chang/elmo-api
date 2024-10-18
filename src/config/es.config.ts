import { z } from 'zod';
import { registerAs } from '@nestjs/config';
import { createZodDto } from '@anatine/zod-nestjs';

const ElasticsearchConfigSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().gt(0),
  user: z.string().min(1),
  password: z.string().min(1),
});

export class ElasticsearchConfig extends createZodDto(
  ElasticsearchConfigSchema,
) {}

export const esConfig = registerAs('elasticsearch', (): ElasticsearchConfig => {
  const config = {
    host: process.env.ES_HOST,
    port: parseInt(process.env.ES_PORT, 10),
    user: process.env.ES_USER,
    password: process.env.ES_PASSWORD,
  };

  return ElasticsearchConfigSchema.parse(config);
});
