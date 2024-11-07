import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { API_AUTHENTICATED_USER_KEY } from '../../../../constants';
import { AuthService } from '../../../application/auth/auth.service';
import { parseAccessToken } from '../../../application/auth/utils';

@Injectable()
export class AuthUserGuard implements CanActivate {
  private logger: Logger = new Logger(AuthUserGuard.name);

  constructor(
    private readonly authService: AuthService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();

      const accessToken = parseAccessToken(
        request.headers.authorization ?? null,
      );

      const user = await this.authService.getUserByAccessToken(accessToken);
      request[API_AUTHENTICATED_USER_KEY] = user.id;

      const roles = this.reflector.get<string[]>('roles', context.getHandler());
      if (roles) {
        return roles.includes(user.role);
      }

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.stack
          : ((error as { message?: string }).message ?? `${error}`);

      this.logger.verbose(`fail to authentication: ${errorMessage}`);

      throw new UnauthorizedException();
    }
  }
}
