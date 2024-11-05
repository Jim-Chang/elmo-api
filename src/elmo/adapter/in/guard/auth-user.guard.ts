import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { API_AUTHENTICATED_USER_KEY } from '../../../../constants';
import { AuthService } from '../../../application/auth/auth.service';
import { parseAccessToken } from '../../../application/auth/utils';

@Injectable()
export class AuthUserGuard implements CanActivate {
  private logger: Logger = new Logger(AuthUserGuard.name);

  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();

      const accessToken = parseAccessToken(
        request.headers.authorization ?? null,
      );

      request[API_AUTHENTICATED_USER_KEY] =
        await this.authService.getUserIdByAccessToken(accessToken);

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
