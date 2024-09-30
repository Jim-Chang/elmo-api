import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';
import { FeedLineEntity } from '../../adapter/out/entities/feed-line.entity';

@Injectable()
export class FeedLineService {
  constructor(
    @InjectRepository(FeedLineEntity)
    private readonly feedLineRepository: EntityRepository<FeedLineEntity>,
  ) {}

  async getAllFeedLines(): Promise<FeedLineEntity[]> {
    return await this.feedLineRepository.findAll();
  }
}
