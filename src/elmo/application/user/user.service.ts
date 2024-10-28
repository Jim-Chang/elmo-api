import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { UserEntity } from '../../adapter/out/entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: EntityRepository<UserEntity>,
  ) {}

  async findUsers(filterBy: { keyword?: string }): Promise<UserEntity[]> {
    const { keyword } = filterBy;

    // filter users by keyword
    let userFilters: any = {};

    if (keyword) {
      userFilters = {
        ...userFilters,
        ...{
          $or: [
            { email: { $like: `%${keyword}%` } },
            { fullName: { $like: `%${keyword}%` } },
          ],
        },
      };
    }

    return await this.userRepository.find(userFilters, {
      orderBy: { id: 'ASC' },
    });
  }
}
