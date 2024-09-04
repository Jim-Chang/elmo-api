import {
  ForbiddenException,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { AUTH_TOKEN, OSCP_API_PREFIX } from '../constants';

@Injectable()
export class HeadersValidationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const url = req.originalUrl;

    const authorization = req.headers['authorization'];
    const requestId = req.headers['x-request-id'];

    if (!authorization) {
      throw new UnauthorizedException(
        'Missing mandatory header: authorization',
      );
    }

    if (authorization !== `Bearer ${AUTH_TOKEN}`) {
      throw new ForbiddenException('Invalid authorization token');
    }

    if (url.startsWith(OSCP_API_PREFIX)) {
      if (!requestId) {
        throw new ForbiddenException('Missing mandatory header: x-request-id');
      }
    }

    // TODO: Should implement check with other headers defined in documentation

    next();
  }
}
