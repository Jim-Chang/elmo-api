import { z } from 'zod';
import { registerAs } from '@nestjs/config';
import { createZodDto } from '@anatine/zod-nestjs';

const MQConfigSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().gt(0),
  user: z.string().min(1),
  password: z.string().min(1),
  caCert: z.string().min(1),
  clientCert: z.string().min(1),
  clientKey: z.string().min(1),
  chargingStationExchange: z.string().min(1),
});

export class MQConfig extends createZodDto(MQConfigSchema) {}

export const mqConfig = registerAs('mq', (): MQConfig => {
  const config = {
    host: process.env.MQ_HOST,
    port: parseInt(process.env.MQ_PORT, 10),
    user: process.env.MQ_USER,
    password: process.env.MQ_PASSWORD,
    caCert: process.env.MQ_CA_CERT,
    clientCert: process.env.MQ_CLIENT_CERT,
    clientKey: process.env.MQ_CLIENT_KEY,
    chargingStationExchange: process.env.MQ_CHARGING_STATION_EXCHANGE,
  };

  return MQConfigSchema.parse(config);
});
