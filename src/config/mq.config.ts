import { z } from 'zod';
import { registerAs } from '@nestjs/config';
import { createZodDto } from '@anatine/zod-nestjs';

const MQConfigSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().gt(0),
  user: z.string().min(1),
  password: z.string().min(1),
  exchange: z.string().min(1),
  routingKey: z.string().min(1),
});

export class MQConfig extends createZodDto(MQConfigSchema) {}

export const mqConfig = registerAs('mq', (): MQConfig => {
  const config = {
    host: process.env.MQ_HOST,
    port: parseInt(process.env.MQ_PORT, 10),
    user: process.env.MQ_USER,
    password: process.env.MQ_PASSWORD,
    exchange: process.env.MQ_EXCHANGE,
    routingKey: process.env.MQ_ROUTING_KEY,
  };

  return MQConfigSchema.parse(config);
});
