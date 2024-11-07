import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';
import { FeedLineEntity } from '../../adapter/out/entities/feed-line.entity';
import { UserEntity } from '../../adapter/out/entities/user.entity';

@Injectable()
export class FeedLineService {
  constructor(
    @InjectRepository(FeedLineEntity)
    private readonly feedLineRepository: EntityRepository<FeedLineEntity>,
  ) {}

  async getAllFeedLines(user: UserEntity): Promise<FeedLineEntity[]> {
    if (user.district) {
      return await this.feedLineRepository.find({ district: user.district });
    } else {
      return await this.feedLineRepository.findAll();
    }
  }
}
