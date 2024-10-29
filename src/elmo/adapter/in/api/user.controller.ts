import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from '@anatine/zod-nestjs';
import { API_PREFIX } from '../../../../constants';
import { UserService } from '../../../application/user/user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserDataDto } from './dto/user-data.dto';
import { UserListDataDto, UserListQueryDto } from './dto/user-list.dto';

@Controller(`${API_PREFIX}/user`)
@UsePipes(ZodValidationPipe)
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  @Get()
  async getListItems(
    @Query() query: UserListQueryDto,
  ): Promise<UserListDataDto> {
    const filterBy = {
      keyword: query.keyword,
    };

    const users = await this.userService.findUsers(filterBy);

    return {
      items: users.map((u) => ({
        id: u.id,
        email: u.email,
        full_name: u.fullName,
        role: u.role,
        distinct_id: u.district?.id ?? null,
        remark: u.remark ?? null,
        created_at: u.createdAt,
      })),
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() dto: CreateUserDto): Promise<UserDataDto> {
    const isEmailExist = await this.userService.isUserEmailExist(dto.email);
    if (isEmailExist) {
      this.logger.error(`[createUser] email is exist: '${dto.email}'`);
      throw new BadRequestException(['email: Not acceptable']);
    }

    const user = await this.userService.createUser({
      email: dto.email,
      password: dto.password,
      fullName: dto.full_name,
      role: dto.role,
      remark: dto.remark ? dto.remark : null,
      district: dto.district_id ?? null,
    });

    return {
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      role: user.role,
      remark: user.remark,
      district_id: user.district?.id ?? null,
      created_at: user.createdAt,
    };
  }
}
