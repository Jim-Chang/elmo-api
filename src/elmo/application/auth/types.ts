import { z } from 'zod';

export const AccessToken = z.string().brand('AccessToken');

export type AccessToken = z.infer<typeof AccessToken>;
