import { Controller, Get, Query, UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from '@anatine/zod-nestjs';
import { API_PREFIX } from '../../../../constants';
import { UserService } from '../../../application/user/user.service';
import { UserListDataDto, UserListQueryDto } from './dto/user-list.dto';

@Controller(`${API_PREFIX}/user`)
@UsePipes(ZodValidationPipe)
export class UserController {
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
        uuid: u.uuid,
        email: u.email,
        full_name: u.fullName,
        role: u.role,
        remark: u.remark ?? null,
        created_at: u.createdAt,
      })),
    };
  }
}
