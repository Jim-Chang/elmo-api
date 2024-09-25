import { createZodDto } from '@anatine/zod-nestjs';
import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const ProxyConfigSchema = z.object({
  url: z
    .union([
      z.string().url(), // URL
      z.string().length(0), // empty string
    ])
    .optional(),
});

export class ProxyConfig extends createZodDto(ProxyConfigSchema) {}

export const proxyConfig = registerAs('proxy', (): ProxyConfig => {
  const config = {
    url: process.env.PROXY_URL,
  };

  return ProxyConfigSchema.parse(config);
});
