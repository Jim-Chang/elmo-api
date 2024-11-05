import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from '@anatine/zod-nestjs';
import { API_PREFIX } from '../../../../constants';
import { AuthLoginDataDto, AuthLoginDto } from './dto/auth.dto';
import { AuthService } from '../../../application/auth/auth.service';
import { UserService } from '../../../application/user/user.service';

@Controller(`${API_PREFIX}/auth`)
@UsePipes(
  new ZodValidationPipe({ errorHttpStatusCode: HttpStatus.UNAUTHORIZED }),
)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: AuthLoginDto): Promise<AuthLoginDataDto> {
    const { email, password } = dto;
    const user = await this.userService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    try {
      const accessToken = await this.authService.login(user.id);
      return { access_token: accessToken };
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }
}
