import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';
import { DistrictEntity } from '../../adapter/out/entities/district.entity';

@Injectable()
export class DistrictService {
  constructor(
    @InjectRepository(DistrictEntity)
    private readonly districtRepository: EntityRepository<DistrictEntity>,
  ) {}

  async getAllDistricts(): Promise<DistrictEntity[]> {
    return await this.districtRepository.findAll();
  }

  async getAllActivateDistricts(): Promise<DistrictEntity[]> {
    return await this.districtRepository.find({ isActivated: true });
  }

  async isDistrictExist(id: number): Promise<boolean> {
    const district = await this.districtRepository.findOne({ id });
    return !!district;
  }
}
