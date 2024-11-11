import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';
import { FeederEntity } from '../../adapter/out/entities/feeder.entity';
import { UserEntity } from '../../adapter/out/entities/user.entity';

@Injectable()
export class FeederService {
  constructor(
    @InjectRepository(FeederEntity)
    private readonly feederRepository: EntityRepository<FeederEntity>,
  ) {}

  async getAllFeeders(user: UserEntity): Promise<FeederEntity[]> {
    if (user.district) {
      return await this.feederRepository.find({ district: user.district });
    } else {
      return await this.feederRepository.findAll();
    }
  }
}
