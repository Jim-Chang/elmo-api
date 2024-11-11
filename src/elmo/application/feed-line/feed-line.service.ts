import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';
import { FeederEntity } from '../../adapter/out/entities/feeder.entity';
import { UserEntity } from '../../adapter/out/entities/user.entity';

@Injectable()
export class FeedLineService {
  constructor(
    @InjectRepository(FeederEntity)
    private readonly feedLineRepository: EntityRepository<FeederEntity>,
  ) {}

  async getAllFeedLines(user: UserEntity): Promise<FeederEntity[]> {
    if (user.district) {
      return await this.feedLineRepository.find({ district: user.district });
    } else {
      return await this.feedLineRepository.findAll();
    }
  }
}
