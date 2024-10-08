import {
  ForbiddenException,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { CsmsService } from '../../../application/csms/csms.service';
import { CreateRequestContext, MikroORM } from '@mikro-orm/core';
import { OSCP_API_PREFIX } from '../../../../constants';

const WHITELIST_ENDPOINTS_BEFORE_CONNECTED = [
  '/register',
  '/handshake_acknowledge',
];

@Injectable()
export class OscpHeadersValidationMiddleware implements NestMiddleware {
  constructor(
    // for @CreateRequestContext use
    private readonly orm: MikroORM,
    private readonly csmsService: CsmsService,
  ) {}

  @CreateRequestContext()
  async use(req: Request, res: Response, next: NextFunction) {
    const url = req.originalUrl;
    const authorization = req.headers['authorization'];
    const requestId = req.headers['x-request-id'];

    if (!requestId) {
      throw new ForbiddenException('Missing mandatory header: x-request-id');
    }

    if (!authorization) {
      throw new UnauthorizedException(
        'Missing mandatory header: authorization',
      );
    }

    if (!authorization.startsWith('Token ')) {
      throw new ForbiddenException('Un-support authorization token prefix');
    }

    const oscpElmoToken = authorization.replace('Token ', '');
    const csmsEntity =
      await this.csmsService.findByOscpElmoToken(oscpElmoToken);
    if (!csmsEntity) {
      throw new ForbiddenException('Invalid authorization token');
    }

    // check csms is connected or not, exclude some endpoints
    if (
      !WHITELIST_ENDPOINTS_BEFORE_CONNECTED.includes(
        url.replace(OSCP_API_PREFIX, ''),
      )
    ) {
      if (!csmsEntity.isConnected) {
        throw new ForbiddenException(
          `CSMS[${csmsEntity.id}] is not connected, should register and handshake first`,
        );
      }
    }

    // Attach csmsEntity to the request object
    // reference decorator csms-id.ts
    req['csmsId'] = csmsEntity.id;

    // TODO: Should implement check with other headers defined in documentation

    next();
  }
}
