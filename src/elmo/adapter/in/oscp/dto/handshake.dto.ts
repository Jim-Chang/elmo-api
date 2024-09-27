import { z } from 'zod';
import { RequiredBehaviourSchema } from './required-behaviour.dto';
import { createZodDto } from '@anatine/zod-nestjs';

const HandshakeSchema = z.object({
  required_behaviour: RequiredBehaviourSchema.optional(),
});

export class HandshakeDto extends createZodDto(HandshakeSchema) {}
