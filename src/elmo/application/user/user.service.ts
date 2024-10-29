import { EntityRepository, RequiredEntityData } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { UserEntity } from '../../adapter/out/entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: EntityRepository<UserEntity>,
  ) {}

  async isUserEmailExist(email: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ email });
    return !!user;
  }

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

  async createUser(data: RequiredEntityData<UserEntity>): Promise<UserEntity> {
    // TODO: hash password

    const user = this.userRepository.create(data);

    const em = this.userRepository.getEntityManager();
    await em.persistAndFlush(user);

    return user;
  }
}
