import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { v4 } from 'uuid';
import { OSCP_API_PREFIX } from '../constants';

@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const url = request.originalUrl;

    if (url.startsWith(OSCP_API_PREFIX)) {
      response.setHeader('X-Correlation-ID', v4());
    }

    return next.handle();
  }
}
