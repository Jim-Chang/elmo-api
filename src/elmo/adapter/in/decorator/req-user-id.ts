import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { API_AUTHENTICATED_USER_KEY } from '../../../../constants';

const logger = new Logger('ReqUser');

export const ReqUserId = createParamDecorator(
  (_data, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    const userId = request[API_AUTHENTICATED_USER_KEY];
    if (!!userId) {
      return userId;
    }

    const path = request.path;
    const handlerName = `${ctx.getClass().name}#${ctx.getHandler().name}()`;
    logger.warn(
      `No "user" in the request (path: "${path}", handler: "${handlerName}")`,
    );

    throw new InternalServerErrorException('authenticated user is required');
  },
);
