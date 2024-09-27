import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

const OptionsResponseSchema = z.object({
  options: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
    }),
  ),
});

export class OptionsResponseDto extends createZodDto(OptionsResponseSchema) {}
