import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { NodeType } from '../../../../application/tree/types';

const OptionsResponseSchema = z.object({
  options: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
    }),
  ),
});

export class OptionsResponseDto extends createZodDto(OptionsResponseSchema) {}

const NodeDataSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.nativeEnum(NodeType),
  children: z.array(z.lazy(() => NodeDataSchema)).optional(),
});

const TreeDataSchema = z.array(NodeDataSchema);

const TreeDataResponseSchema = z.object({
  tree: TreeDataSchema,
});

export class TreeDataResponseDto extends createZodDto(TreeDataResponseSchema) {}
