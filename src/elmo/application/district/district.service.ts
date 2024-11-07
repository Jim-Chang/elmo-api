import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';
import { DistrictEntity } from '../../adapter/out/entities/district.entity';
import { UserEntity } from '../../adapter/out/entities/user.entity';

@Injectable()
export class DistrictService {
  constructor(
    @InjectRepository(DistrictEntity)
    private readonly districtRepository: EntityRepository<DistrictEntity>,
  ) {}

  async getAllActivateDistricts(user: UserEntity): Promise<DistrictEntity[]> {
    const filterBy = {
      isActivated: true,
    };

    // If user has district, filter by user's district
    if (user.district) {
      filterBy['id'] = user.district.id;
    }

    return await this.districtRepository.find(filterBy);
  }

  async isDistrictExist(id: number): Promise<boolean> {
    const district = await this.districtRepository.findOne({ id });
    return !!district;
  }
}
