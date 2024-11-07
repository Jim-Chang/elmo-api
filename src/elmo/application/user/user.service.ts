import {
  EntityData,
  EntityManager,
  EntityRepository,
  RequiredEntityData,
  wrap,
} from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { UserEntity } from '../../adapter/out/entities/user.entity';
import { UserPasswordService } from './user-password.service';
import { ADMIN_ROLE, POWER_USER_ROLE, SUPERVISOR_ROLE } from './types';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: EntityRepository<UserEntity>,
    private readonly userPasswordService: UserPasswordService,
  ) {}

  async isUserEmailExist(email: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ email });
    return !!user;
  }

  async getUserById(userId: number): Promise<UserEntity | null> {
    return await this.userRepository.findOne({ id: userId });
  }

  async findUsers(filterBy: { keyword?: string }): Promise<UserEntity[]> {
    const { keyword } = filterBy;

    let userFilters: any = {
      role: { $ne: ADMIN_ROLE }, // exclude admin user
    };

    // filter users by keyword
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
    const hashedPassword = await this.userPasswordService.hash(data.password);

    const user = this.userRepository.create({
      ...data,
      password: hashedPassword,
    });

    const em = this.userRepository.getEntityManager();
    await em.persistAndFlush(user);

    return user;
  }

  async updateUser(
    userId: number,
    data: Partial<EntityData<UserEntity>>,
  ): Promise<UserEntity> {
    const user = await this.userRepository.findOneOrFail(userId);
    const updateData = await this.refineUpdateData(user, data);

    // update user
    wrap(user).assign(updateData, { mergeObjectProperties: true });

    const em = this.userRepository.getEntityManager();
    await em.persistAndFlush(user);

    return user;
  }

  async refineUpdateData(
    user: UserEntity,
    data: Partial<EntityData<UserEntity>>,
  ): Promise<Partial<EntityData<UserEntity>>> {
    const updateData: Partial<EntityData<UserEntity>> = {};

    if (data.fullName) {
      updateData.fullName = data.fullName;
    }
    if (data.role) {
      updateData.role = data.role;
    }
    if (data.district !== undefined) {
      updateData.district = data.district;
    }
    if (data.remark !== undefined) {
      updateData.remark = data.remark;
    }

    // If role or district is updated, check relation between role and district
    if (updateData.role !== undefined || updateData.district !== undefined) {
      const newRole = updateData.role ?? user.role;
      const newDistrictId =
        updateData.district !== undefined
          ? updateData.district
          : (user.district?.id ?? null);

      if (newRole === POWER_USER_ROLE) {
        if (newDistrictId) {
          throw new Error('系統管理員不應指定所屬區處');
        }
      } else if (newRole === SUPERVISOR_ROLE) {
        if (!newDistrictId) {
          throw new Error('區處管理員應指定所屬區處');
        }
      }
    }

    return updateData;
  }

  async deleteUser(userId: number): Promise<void> {
    const user = await this.userRepository.findOneOrFail({
      id: userId,
      role: { $ne: ADMIN_ROLE },
    });
    const em = this.userRepository.getEntityManager();
    await em.removeAndFlush(user);
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserEntity | null> {
    const user = await this.userRepository.findOne({ email });
    if (!user) {
      return null;
    }

    const isPasswordValid = await this.userPasswordService.verify(
      password,
      user.password,
    );
    return isPasswordValid ? user : null;
  }

  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isOldPasswordValid = await this.userPasswordService.verify(
      oldPassword,
      user.password,
    );
    if (!isOldPasswordValid) {
      throw new Error('Invalid old password');
    }

    const hashedNewPassword = await this.userPasswordService.hash(newPassword);

    const em = this.userRepository.getEntityManager();
    await em.transactional(async (em: EntityManager) => {
      wrap(user).assign(
        { password: hashedNewPassword },
        { em, mergeObjectProperties: true },
      );
      await em.persistAndFlush(user);
    });
  }
}
