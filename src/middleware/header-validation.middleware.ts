import {
  ForbiddenException,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class HeadersValidationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const authorization = req.headers['authorization'];
    const requestId = req.headers['x-request-id'];

    if (!authorization) {
      throw new UnauthorizedException(
        'Missing mandatory header: authorization',
      );
    }

    if (!requestId) {
      throw new ForbiddenException('Missing mandatory header: x-request-id');
    }

    // TODO: Should implement check with other headers defined in documentation

    next();
  }
}
