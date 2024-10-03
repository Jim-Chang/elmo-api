import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CsmsId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // reference oscp-header-validation.middleware.ts
    return request['csmsId'];
  },
);
