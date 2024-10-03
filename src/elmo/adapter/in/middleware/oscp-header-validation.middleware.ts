import {
  ForbiddenException,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { CsmsService } from '../../../application/csms/csms.service';
import { CreateRequestContext, MikroORM } from '@mikro-orm/core';

@Injectable()
export class OscpHeadersValidationMiddleware implements NestMiddleware {
  constructor(
    // for @CreateRequestContext use
    private readonly orm: MikroORM,
    private readonly csmsService: CsmsService,
  ) {}

  @CreateRequestContext()
  async use(req: Request, res: Response, next: NextFunction) {
    const authorization = req.headers['authorization'];
    const requestId = req.headers['x-request-id'];

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
    // Attach csmsEntity to the request object
    // reference decorator csms-id.ts
    req['csmsId'] = csmsEntity.id;

    if (!requestId) {
      throw new ForbiddenException('Missing mandatory header: x-request-id');
    }

    // TODO: Should implement check with other headers defined in documentation

    next();
  }
}
