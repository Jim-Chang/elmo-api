import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from '@anatine/zod-nestjs';
import { API_PREFIX } from '../../../../constants';
import { AuthUserGuard } from '../guard/auth-user.guard';
import { ReqUserId } from '../decorator/req-user-id';
import { Roles } from '../decorator/roles';
import { POWER_USER_ROLE } from '../../../application/user/types';
import { AuthService } from '../../../application/auth/auth.service';
import { DistrictService } from '../../../application/district/district.service';
import { UserService } from '../../../application/user/user.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { UserDataDto } from './dto/user-data.dto';
import { UserListDataDto, UserListQueryDto } from './dto/user-list.dto';
import {
  UserChangePasswordDto,
  UserChangePasswordResponseDto,
} from './dto/user-me.dto';

@Controller(`${API_PREFIX}/user`)
@UseGuards(AuthUserGuard)
@UsePipes(ZodValidationPipe)
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly districtService: DistrictService,
  ) {}

  @Get()
  @Roles(POWER_USER_ROLE)
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
        district_id: u.district?.id ?? null,
        remark: u.remark ?? null,
        created_at: u.createdAt,
      })),
    };
  }

  @Post()
  @Roles(POWER_USER_ROLE)
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

  @Put(':id')
  @Roles(POWER_USER_ROLE)
  @HttpCode(HttpStatus.OK)
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ): Promise<UserDataDto> {
    // Check if district is exist
    if (dto.district_id) {
      const isDistrictExist = await this.districtService.isDistrictExist(
        dto.district_id,
      );
      if (!isDistrictExist) {
        throw new BadRequestException(
          `District with id ${dto.district_id} is not exist`,
        );
      }
    }

    try {
      const user = await this.userService.updateUser(id, {
        fullName: dto.full_name,
        role: dto.role,
        district: dto.district_id,
        remark: dto.remark,
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
    } catch (error) {
      this.logger.error(`[updateUser] error: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  @Delete(':id')
  @Roles(POWER_USER_ROLE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.userService.deleteUser(id);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getCurrentUser(@ReqUserId() reqUserId: number): Promise<UserDataDto> {
    const user = await this.userService.getUserById(reqUserId);
    if (!user) {
      throw new NotFoundException();
    }

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

  @Patch('me/password')
  @HttpCode(HttpStatus.OK)
  async changeSelfPassword(
    @ReqUserId() reqUserId: number,
    @Body() changePasswordDto: UserChangePasswordDto,
  ): Promise<UserChangePasswordResponseDto> {
    // change password
    try {
      await this.userService.changePassword(
        reqUserId,
        changePasswordDto.old_password,
        changePasswordDto.new_password,
      );
    } catch {
      throw new ForbiddenException();
    }

    // Invalidate all access token and login again
    await this.authService.invalidateAllAccessTokenByUser(reqUserId);
    const accessToken = await this.authService.login(reqUserId);

    return {
      access_token: accessToken,
    };
  }
}
