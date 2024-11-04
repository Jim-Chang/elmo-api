import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';
import { API_ACCESS_TOKEN_LENGTH } from '../../../../../constants';

const AuthLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export class AuthLoginDto extends createZodDto(AuthLoginSchema) {}

const AuthLoginDataSchema = z.object({
  access_token: z.string().min(API_ACCESS_TOKEN_LENGTH),
});

export class AuthLoginDataDto extends createZodDto(AuthLoginDataSchema) {}
